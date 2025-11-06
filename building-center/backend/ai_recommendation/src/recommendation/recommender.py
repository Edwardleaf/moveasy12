#!/usr/bin/env python3
"""
Recommendation pipeline that combines structured filtering/scoring with GPT ranking.

Usage example (from a script or notebook):

    from src.recommendation import HousingRecommender

    recommender = HousingRecommender(
        enriched_paths=[
            "data/processed/buildings/san_francisco/buildings_enriched.json",
            "data/processed/buildings/san_mateo/buildings_enriched.json",
            "data/processed/buildings/santa_clara/buildings_enriched.json",
        ],
        embedding_paths=[
            "data/processed/buildings/san_francisco/buildings_with_embeddings.json",
            "data/processed/buildings/san_mateo/buildings_with_embeddings.json",
            "data/processed/buildings/santa_clara/buildings_with_embeddings.json",
        ],
        openai_api_key=os.getenv("OPENAI_API_KEY"),
    )

    result = recommender.recommend({
        "location": "San Mateo",
        "radius_miles": 5,
        "top_priorities": ["Safety", "Public Transit", "Lifestyle"],
        "budget": {"max_rent": 3500, "bedrooms": 2},
        "housing_type": "Entire Apartment",
        "roommate_preference": "I prefer to live alone",
        "layout_requirements": {"bedrooms": [2], "bathrooms": [2]},
        "notes": "Looking for a lively neighbourhood near parks.",
    })

    print(result["final_recommendations"])  # -> ['building_id_1', 'building_id_2', 'building_id_3']
"""
from __future__ import annotations

import json
import math
import os
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests

from src.pipeline.geo_utils import haversine_distance
from src.recommendation.prompts_config import (
    build_system_prompt,
    build_user_prompt,
    format_candidate_building,
)


# ---------------------------------------------------------------------------
# Data containers
# ---------------------------------------------------------------------------


@dataclass
class BuildingRecord:
    building_id: str
    county: str
    data: Dict[str, Any]
    embedding: Optional[List[float]]


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def geocode_location(query: str) -> Optional[Tuple[float, float]]:
    """
    Resolve a place name to latitude/longitude using Photon API (via local backend).
    Returns (lat, lon) in degrees if successful, otherwise None.
    """
    try:
        # 使用本地Node后端的Photon API（支持中文翻译）
        resp = requests.get(
            "http://localhost:5003/api/geo/search",
            params={"q": query, "limit": 1},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        
        # data格式: { top: {...}, candidates: [...] }
        if data and data.get("top"):
            top = data["top"]
            lat = top.get("lat")
            lon = top.get("lon")
            if lat and lon:
                return float(lat), float(lon)
        return None
    except Exception as e:
        print(f"⚠️ Geocoding error: {e}")
        return None


def parse_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_scalar(value: Optional[float], min_val: float, max_val: float, invert: bool = False) -> float:
    if value is None:
        return 0.0
    if math.isclose(max_val, min_val):
        return 0.0
    ratio = (value - min_val) / (max_val - min_val)
    ratio = max(0.0, min(1.0, ratio))
    return 1.0 - ratio if invert else ratio


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b:
        return 0.0
    if len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# OpenAI helpers
# ---------------------------------------------------------------------------


class OpenAIClient:
    """Minimal OpenAI client using HTTP requests (no external SDK dependency)."""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        if not api_key:
            raise ValueError("OpenAI API key is required.")
        self.api_key = api_key
        self.model = model
        self._session = requests.Session()

    def chat(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        resp = self._session.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=240,  # 增加到4分钟
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def embed(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        payload = {"model": model, "input": text}
        resp = self._session.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=180,  # 增加到3分钟
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]


# ---------------------------------------------------------------------------
# Recommender core
# ---------------------------------------------------------------------------


class HousingRecommender:
    TAG_ORDER = ["Safety", "Commute", "Public Transit", "Near Grocery", "Car Friendly", "Lifestyle", "Pet Friendly", "Amenities"]

    def __init__(
        self,
        enriched_paths: Iterable[str],
        embedding_paths: Iterable[str],
        openai_api_key: Optional[str] = None,
        gpt_model: str = "gpt-4o",
        query_embedding_model: str = "text-embedding-3-small",
    ) -> None:
        self.enriched_paths = [Path(p) for p in enriched_paths]
        self.embedding_paths = [Path(p) for p in embedding_paths]
        self.openai_key = openai_api_key
        self.gpt_model = gpt_model
        self.query_embedding_model = query_embedding_model
        self._buildings: List[BuildingRecord] = []
        self._embedding_matrix: Optional[List[List[float]]] = None
        self._load_data()
        self._openai_client = OpenAIClient(openai_api_key, model=gpt_model) if openai_api_key else None

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def _load_data(self) -> None:
        embeddings_by_id: Dict[str, List[float]] = {}
        for path in self.embedding_paths:
            if not path.exists():
                continue
            data = load_json(path)
            for record in data:
                building_id = record.get("building_id")
                embedding = record.get("embedding")
                if building_id and isinstance(embedding, list):
                    embeddings_by_id[building_id] = embedding

        all_buildings: List[BuildingRecord] = []
        for path in self.enriched_paths:
            if not path.exists():
                continue
            county = path.parent.name  # e.g. san_francisco
            data = load_json(path)
            for building in data:
                building_id = building.get("building_id")
                if not building_id:
                    continue
                all_buildings.append(
                    BuildingRecord(
                        building_id=building_id,
                        county=county,
                        data=building,
                        embedding=embeddings_by_id.get(building_id),
                    )
                )

        self._buildings = all_buildings
        self._embedding_matrix = [b.embedding for b in all_buildings if b.embedding]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def recommend(self, user_request: Dict[str, Any], return_top_n: int = 20) -> Dict[str, Any]:
        """
        Main entry point.
        Expected user_request keys (all optional except location/radius/priorities):
            - location: place name or dict {"lat": .., "lon": ..}
            - radius_miles: float
            - top_priorities: ordered list of tag strings (see TAG_ORDER)
            - budget: {"max_rent": int, "bedrooms": Optional[int]}
            - housing_type, roommate_preference, layout_requirements (dict), notes: str
            - return_top_n: number of top candidates to return (default 20, can be 40 for refinement)
        """
        filtered = self._filter_by_location(user_request)
        filtered = self._filter_by_budget(filtered, user_request.get("budget"))

        if not filtered:
            return {"top20": [], "final_recommendations": []}

        priorities = ensure_list(user_request.get("top_priorities"))
        weights = self._compute_priority_weights(priorities)

        query_embedding = None
        if self._openai_client and user_request.get("notes"):
            query_text = self._build_query_text(user_request)
            try:
                query_embedding = self._openai_client.embed(query_text, model=self.query_embedding_model)
            except Exception:
                query_embedding = None

        scored = self._score_buildings(filtered, weights, query_embedding=query_embedding)
        scored.sort(key=lambda x: x["total_score"], reverse=True)
        top_n = scored[:return_top_n]  # 支持可配置的top_n

        # Prepare GPT selection
        if self._openai_client:
            prompt = self._build_prompt(user_request, top_n, weights)
            gpt_output = self._openai_client.chat(self._prompt_system(), prompt)
            gpt_results = self._parse_gpt_output(gpt_output)
            if not gpt_results:
                # 回退：没有GPT结果时使用top3
                final_ids = [{'id': entry["building_id"], 'reasons': []} for entry in top_n[:3]]
            else:
                final_ids = gpt_results
        else:
            final_ids = [{'id': entry["building_id"], 'reasons': []} for entry in top_n[:3]]

        return {
            "top20": top_n,  # 保持键名为top20以兼容现有代码，但实际可能是top40
            "final_recommendations": final_ids,
        }

    def _select_top_with_gpt(self, candidates: List[Dict[str, Any]], user_request: Dict[str, Any], final_count: int = 3) -> List[Dict[str, Any]]:
        """
        公开方法：使用GPT从候选列表中选择最佳的N个
        用于细化推荐时从40个候选中选择3个
        """
        if not self._openai_client:
            return [{'id': entry["building_id"], 'reasons': []} for entry in candidates[:final_count]]
        
        priorities = ensure_list(user_request.get("top_priorities"))
        weights = self._compute_priority_weights(priorities)
        
        prompt = self._build_prompt(user_request, candidates, weights)
        gpt_output = self._openai_client.chat(self._prompt_system(), prompt)
        gpt_results = self._parse_gpt_output(gpt_output)
        
        if not gpt_results:
            return [{'id': entry["building_id"], 'reasons': []} for entry in candidates[:final_count]]
        
        return gpt_results[:final_count]

    # ------------------------------------------------------------------
    # Filtering
    # ------------------------------------------------------------------

    def _filter_by_location(self, user_request: Dict[str, Any]) -> List[BuildingRecord]:
        radius = parse_float(user_request.get("radius_miles")) or 5.0
        location = user_request.get("location")
        if isinstance(location, dict):
            lat = parse_float(location.get("lat"))
            lon = parse_float(location.get("lon"))
        elif isinstance(location, str):
            coords = geocode_location(location)
            lat, lon = coords if coords else (None, None)
        else:
            lat = lon = None

        if lat is None or lon is None:
            # Fallback: return all buildings (already restricted to Bay Area)
            print(f"⚠️ 地理编码失败，返回所有湾区建筑")
            return list(self._buildings)
        
        # 验证坐标是否在湾区范围内
        # 湾区大致范围: lat 36.9-38.9, lon -123.2 to -121.2
        BAY_AREA_BOUNDS = {
            "lat_min": 36.9, "lat_max": 38.9,
            "lon_min": -123.2, "lon_max": -121.2
        }
        if not (BAY_AREA_BOUNDS["lat_min"] <= lat <= BAY_AREA_BOUNDS["lat_max"] and
                BAY_AREA_BOUNDS["lon_min"] <= lon <= BAY_AREA_BOUNDS["lon_max"]):
            print(f"⚠️ 坐标({lat:.4f}, {lon:.4f})不在湾区范围内")
            print(f"   地址 '{location}' 可能被错误地理编码")
            print(f"   回退到返回所有湾区建筑")
            return list(self._buildings)

        results = []
        for record in self._buildings:
            b_lat = parse_float(record.data.get("lat"))
            b_lon = parse_float(record.data.get("lon"))
            if b_lat is None or b_lon is None:
                continue
            distance = haversine_distance(lat, lon, b_lat, b_lon)
            if distance <= radius:
                results.append(record)
        return results

    def _filter_by_budget(self, buildings: List[BuildingRecord], budget: Optional[Dict[str, Any]]) -> List[BuildingRecord]:
        if not budget:
            return buildings

        max_rent = parse_float(budget.get("max_rent"))
        bedrooms = budget.get("bedrooms")
        if max_rent is None:
            return buildings

        def building_matches(record: BuildingRecord) -> bool:
            rentcast = ensure_list(record.data.get("rentcast_data"))
            candidate_rents = []
            if bedrooms is not None:
                for entry in rentcast:
                    if entry.get("bedrooms") == bedrooms and entry.get("rent"):
                        candidate_rents.append(parse_float(entry.get("rent")))
            else:
                for entry in rentcast:
                    candidate_rents.append(parse_float(entry.get("rent")))

            candidate_rents = [r for r in candidate_rents if r is not None]
            if candidate_rents:
                return any(r <= max_rent for r in candidate_rents)

            # fall back to pricing string like "$1,780 - $6,670"
            pricing = record.data.get("pricing") or record.data.get("Pricing")
            if isinstance(pricing, str):
                numbers = []
                for token in pricing.replace("$", "").replace(",", "").split():
                    try:
                        numbers.append(float(token))
                    except ValueError:
                        continue
                if numbers:
                    return min(numbers) <= max_rent

            return True  # if no pricing info, do not filter out

        return [record for record in buildings if building_matches(record)]

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def _compute_priority_weights(self, priorities: List[str]) -> Dict[str, float]:
        decay = [1.0, 0.8, 0.6, 0.4, 0.2]
        weights: Dict[str, float] = {}
        for idx, tag in enumerate(priorities):
            if idx >= len(decay):
                break
            normalized_tag = tag.strip()
            if normalized_tag:
                weights[normalized_tag] = decay[idx]
        return weights

    def _score_buildings(
        self,
        buildings: List[BuildingRecord],
        weights: Dict[str, float],
        query_embedding: Optional[List[float]] = None,
    ) -> List[Dict[str, Any]]:
        # Collect stats for normalization
        safety_values = []
        transit_values = []
        commute_values = []
        grocery_values = []
        lifestyle_values = []
        amenities_counts = []
        car_scores = []

        for record in buildings:
            data = record.data
            crime = data.get("crime_stats") or {}
            safety_values.append(crime.get("total_incidents", 0))

            transit = data.get("transit_accessibility") or {}
            transit_values.append(transit.get("total_transit", 0))

            commute_values.append(data.get("commute_to_downtown_minutes"))

            pois = (data.get("nearby_pois") or {}).get("categories", {})
            grocery_values.append((pois.get("dining", 0) or 0) + (pois.get("shopping", 0) or 0))
            lifestyle_values.append((pois.get("entertainment", 0) or 0) + (pois.get("fitness", 0) or 0))

            amenities_counts.append(len(ensure_list(data.get("amenities"))))

            car = data.get("car_friendly") or {}
            car_scores.append(car.get("car_score", 0))

        max_safety = max(safety_values) if safety_values else 0
        max_transit = max(transit_values) if transit_values else 0
        finite_commutes = [v for v in commute_values if v is not None and not math.isinf(v)]
        max_commute = max(finite_commutes, default=0)
        max_grocery = max(grocery_values) if grocery_values else 0
        max_lifestyle = max(lifestyle_values) if lifestyle_values else 0
        max_amenities = max(amenities_counts) if amenities_counts else 0
        max_car = max(car_scores) if car_scores else 0

        results = []
        for record in buildings:
            data = record.data
            by_tag = {}

            # Safety
            incidents = ((data.get("crime_stats") or {}).get("total_incidents")) or 0
            safety_score = 1.0 - min(1.0, incidents / (max_safety or 1)) if max_safety else 0.5
            by_tag["Safety"] = safety_score

            # Public Transit
            total_transit = ((data.get("transit_accessibility") or {}).get("total_transit")) or 0
            transit_score = min(1.0, total_transit / (max_transit or 1)) if max_transit else 0.5
            by_tag["Public Transit"] = transit_score

            # Commute
            commute_minutes = data.get("commute_to_downtown_minutes")
            if commute_minutes in (None, "", 0):
                commute_score = 1.0 - transit_score  # fallback
            else:
                commute_score = 1.0 - min(1.0, float(commute_minutes) / (max_commute or float(commute_minutes))) if max_commute else 0.5
            by_tag["Commute"] = commute_score

            # Near Grocery
            pois = (data.get("nearby_pois") or {}).get("categories", {}) or {}
            grocery_count = (pois.get("dining", 0) or 0) + (pois.get("shopping", 0) or 0)
            grocery_score = min(1.0, grocery_count / (max_grocery or 1)) if max_grocery else 0.5
            by_tag["Near Grocery"] = grocery_score

            # Lifestyle
            lifestyle_count = (pois.get("entertainment", 0) or 0) + (pois.get("fitness", 0) or 0)
            lifestyle_score = min(1.0, lifestyle_count / (max_lifestyle or 1)) if max_lifestyle else 0.5
            by_tag["Lifestyle"] = lifestyle_score

            # Car Friendly
            car_score_raw = ((data.get("car_friendly") or {}).get("car_score")) or 0
            car_score = min(1.0, car_score_raw / (max_car or 100)) if max_car else (car_score_raw / 100 if car_score_raw else 0.5)
            by_tag["Car Friendly"] = car_score

            # Pet Friendly
            amenities = [a.lower() for a in ensure_list(data.get("amenities"))]
            pet_score = 1.0 if any("pet" in a or "dog" in a or "cat" in a for a in amenities) else 0.3
            by_tag["Pet Friendly"] = pet_score

            # Amenities
            amenity_count = len(ensure_list(data.get("amenities")))
            amenities_score = min(1.0, amenity_count / (max_amenities or 1)) if max_amenities else 0.5
            by_tag["Amenities"] = amenities_score

            # Weighted total
            total = sum(weights.get(tag, 0) * by_tag.get(tag, 0) for tag in weights)

            if query_embedding is not None and record.embedding:
                similarity = cosine_similarity(query_embedding, record.embedding)
                total = total * 0.8 + similarity * 0.2

            results.append(
                {
                    "building_id": record.building_id,
                    "name": record.data.get("title"),
                    "address": record.data.get("address"),
                    "county": record.county,
                    "total_score": total,
                    "tag_scores": by_tag,
                    "data": record.data,
                }
            )

        return results

    # ------------------------------------------------------------------
    # Prompt engineering
    # ------------------------------------------------------------------

    def _prompt_system(self) -> str:
        """返回系统提示词（从配置文件加载，方便微调）"""
        return build_system_prompt()

    def _build_query_text(self, user_request: Dict[str, Any]) -> str:
        parts = []
        priorities = ensure_list(user_request.get("top_priorities"))
        if priorities:
            parts.append("Top priorities: " + ", ".join(priorities))
        budget = user_request.get("budget") or {}
        if budget.get("max_rent"):
            parts.append(f"Budget up to ${budget['max_rent']}")
        if budget.get("bedrooms"):
            parts.append(f"For {budget['bedrooms']} bedroom units")
        housing_type = user_request.get("housing_type")
        if housing_type:
            parts.append(f"Housing type: {housing_type}")
        roommate = user_request.get("roommate_preference")
        if roommate:
            parts.append(f"Roommate preference: {roommate}")
        layout = user_request.get("layout_requirements") or {}
        if layout:
            parts.append(f"Layout requirements: {json.dumps(layout, ensure_ascii=False)}")
        notes = user_request.get("notes")
        if notes:
            parts.append(f"Additional notes: {notes}")
        return " | ".join(parts)

    def _build_prompt(self, user_request: Dict[str, Any], candidates: List[Dict[str, Any]], weights: Dict[str, float]) -> str:
        """构建用户提示词（使用配置文件中的模板，方便微调）"""
        # 格式化搜索区域
        location = user_request.get("location", "")
        if isinstance(location, dict):
            lat = location.get("lat", "")
            lon = location.get("lon", "")
            location_text = f"Coordinates: ({lat}, {lon})"
        else:
            location_text = str(location)
        
        radius_text = str(user_request.get("radius_miles", 5.0))
        
        # 格式化优先级文本
        priorities_text = ", ".join(f"{tag} (weight {weights.get(tag, 0):.1f})" for tag in weights) or "None"
        
        # 格式化预算文本
        budget = user_request.get("budget") or {}
        budget_text = f"Max rent ${budget.get('max_rent')}" if budget else "No budget preference"
        bedrooms = budget.get("bedrooms")
        if bedrooms is not None:
            budget_text += f" for {bedrooms}-bed units"

        # 格式化房间数量
        layout = user_request.get("layout_requirements", {})
        rooms_list = []
        if layout:
            beds = layout.get("bedrooms")
            if beds:
                rooms_list = beds if isinstance(beds, list) else [beds]
        rooms_text = ", ".join(str(r) for r in rooms_list) if rooms_list else "Flexible"

        # 格式化住房类型和室友偏好
        housing_type = user_request.get("housing_type", "Flexible")
        roommate_text = user_request.get("roommate_preference", "Flexible")
        
        # 格式化布局要求
        layout_text = ""
        if layout:
            parts = []
            beds = layout.get("bedrooms")
            baths = layout.get("bathrooms")
            if beds:
                parts.append(f"Bedrooms: {beds}")
            if baths:
                parts.append(f"Bathrooms: {baths}")
            layout_text = ", ".join(parts)
        
        # 获取额外备注
        notes = user_request.get("notes", "")
        
        # 获取视觉风格偏好（来自问卷卡片）
        style_prefs_text = user_request.get("style_preference", "")

        # 格式化候选建筑列表（使用配置文件中的模板）
        candidate_lines = []
        for idx, entry in enumerate(candidates, start=1):
            data = entry["data"]
            crime = data.get("crime_stats") or {}
            transit = data.get("transit_accessibility") or {}
            pois = (data.get("nearby_pois") or {}).get("categories", {}) or {}
            pricing = data.get("pricing") or data.get("Pricing") or ""
            
            # 使用配置文件中的格式化函数
            line = format_candidate_building(
                idx=idx,
                building_id=entry['building_id'],
                name=entry.get('name', 'N/A'),
                address=entry.get('address', 'N/A'),
                total_score=entry['total_score'],
                safety_incidents=str(crime.get('total_incidents', 'N/A')),
                safety_rating=str(crime.get('safety_score', 'N/A')),
                transit_stops=str(transit.get('total_transit', 'N/A')),
                car_score=str(((data.get('car_friendly') or {}).get('car_score', 'N/A'))),
                amenities_count=len(ensure_list(data.get('amenities'))),
                dining=pois.get('dining', 0),
                shopping=pois.get('shopping', 0),
                fitness=pois.get('fitness', 0),
                entertainment=pois.get('entertainment', 0),
                pricing=pricing if pricing else 'N/A',
                latitude=str(data.get('lat', 'N/A')),
                longitude=str(data.get('lon', 'N/A')),
            )
            candidate_lines.append(line)

        # 组装候选建筑文本
        newline = '\n\n'
        candidates_text = newline.join(candidate_lines)
        
        # 使用配置文件中的函数构建完整提示词
        prompt = build_user_prompt(
            priorities_text=priorities_text,
            budget_text=budget_text,
            housing_type=housing_type,
            roommate_text=roommate_text,
            layout_text=layout_text or 'None',
            notes=notes or 'None',
            candidates_text=candidates_text,
            location_text=location_text,
            radius_text=radius_text,
            rooms_text=rooms_text,
            style_prefs_text=style_prefs_text or '',
        )
        
        return prompt

    def _parse_gpt_output(self, output: str) -> List[Dict[str, Any]]:
        """解析GPT输出，返回包含ID和推荐理由的列表"""
        if not output:
            return []
        
        import json
        import re
        
        # 尝试提取JSON数组
        json_match = re.search(r'\[[\s\S]*\]', output)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                if isinstance(parsed, list):
                    result = []
                    for item in parsed[:3]:  # 只取前3个
                        if isinstance(item, dict) and 'id' in item:
                            result.append({
                                'id': item['id'],
                                'reasons': item.get('reasons', [])
                            })
                    return result
            except json.JSONDecodeError:
                pass
        
        # 回退到旧格式：逗号分隔的ID
        tokens = [token.strip() for token in output.replace("\n", ",").split(",")]
        ids = [t for t in tokens if t]
        seen = set()
        result = []
        for item in ids:
            if item not in seen:
                result.append({'id': item, 'reasons': []})
                seen.add(item)
            if len(result) == 3:
                break
        return result
