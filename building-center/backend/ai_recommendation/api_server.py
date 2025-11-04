#!/usr/bin/env python3
"""
Flask API服务器接收前端问卷数据并返回AI推荐结果

使用方法：
    python api_server.py

前端POST数据格式：
{
  "stylePreferences": ["liked_building_1.jpg", ...],
  "location": {
    "address": "San Francisco State University",
    "coordinates": {"lat": 37.7, "lon": -122.4},
    "radius": 5
  },
  "budget": {"min": 1500, "max": 2500},
  "priorities": ["Commute", "Lifestyle", "Near Grocery", "Amenities", "Pet Friendly"],
  "housingType": ["Entire Apartment", "Studio"],
  "roommatePreference": "I prefer to live alone",
  "bedrooms": [2],
  "bathrooms": [2],
  "moveInTimeline": "Within 3 months",
  "leaseTerm": "12+ months"
}
"""

import json
import os
from pathlib import Path
from typing import Any, Dict

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

from src.recommendation import HousingRecommender

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置
BASE_DIR = Path(__file__).parent
ENRICHED_PATHS = [
    BASE_DIR / "data/processed/buildings/san_francisco/buildings_enriched.json",
    BASE_DIR / "data/processed/buildings/san_mateo/buildings_enriched.json",
    BASE_DIR / "data/processed/buildings/santa_clara/buildings_enriched.json",
]
EMBEDDING_PATHS = [
    BASE_DIR / "data/processed/buildings/san_francisco/buildings_with_embeddings.json",
    BASE_DIR / "data/processed/buildings/san_mateo/buildings_with_embeddings.json",
    BASE_DIR / "data/processed/buildings/santa_clara/buildings_with_embeddings.json",
]

# 初始化推荐器（全局单例，避免重复加载数据）
recommender = None


def init_recommender():
    """延迟初始化推荐器"""
    global recommender
    if recommender is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️  警告: OPENAI_API_KEY 未设置，将使用基于规则的推荐")
        
        recommender = HousingRecommender(
            enriched_paths=[str(p) for p in ENRICHED_PATHS],
            embedding_paths=[str(p) for p in EMBEDDING_PATHS],
            openai_api_key=api_key,
            gpt_model="gpt-5",  # 使用gpt-5模型
        )
        print("✅ AI推荐器初始化完成")


def convert_questionnaire_to_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    将前端问卷格式转换为AI模块需要的格式
    """
    location_data = data.get("location", {})
    location = location_data.get("address")
    if not location and "coordinates" in location_data:
        coords = location_data["coordinates"]
        location = {"lat": coords.get("lat"), "lon": coords.get("lon")}
    
    budget_data = data.get("budget", {})
    max_rent = budget_data.get("max")
    
    bedrooms = data.get("bedrooms", [])
    bedroom_count = bedrooms[0] if bedrooms and len(bedrooms) == 1 else None
    
    # 处理风格偏好
    style_preferences = data.get("stylePreferences", [])
    style_preference_text = None
    if style_preferences:
        # 构建风格偏好描述
        counties = {}
        for pref in style_preferences:
            county = pref.get("county", "unknown")
            counties[county] = counties.get(county, 0) + 1
        
        style_preference_text = f"User liked {len(style_preferences)} building styles from the questionnaire cards"
        if counties:
            county_details = ", ".join([f"{count} from {county.replace('_', ' ').title()}" 
                                       for county, count in counties.items()])
            style_preference_text += f" ({county_details})"
    
    request_data = {
        "location": location,
        "radius_miles": location_data.get("radius", 5.0),
        "top_priorities": data.get("priorities", []),
        "budget": {
            "max_rent": max_rent,
            "bedrooms": bedroom_count,
        } if max_rent else None,
        "housing_type": ", ".join(data.get("housingType", [])) if data.get("housingType") else None,
        "roommate_preference": data.get("roommatePreference"),
        "layout_requirements": {
            "bedrooms": data.get("bedrooms", []),
            "bathrooms": data.get("bathrooms", []),
        } if (data.get("bedrooms") or data.get("bathrooms")) else None,
        "timeline": {
            "move_in": data.get("moveInTimeline"),
            "lease_term": data.get("leaseTerm"),
        } if (data.get("moveInTimeline") or data.get("leaseTerm")) else None,
        "style_preference": style_preference_text,  # 添加风格偏好
    }
    
    # 移除空值
    request_data = {k: v for k, v in request_data.items() if v is not None}
    
    return request_data


@app.route("/health", methods=["GET"])
def health_check():
    """健康检查接口"""
    return jsonify({"status": "ok", "service": "ai_recommendation"})


@app.route("/api/ai/recommend", methods=["POST"])
def recommend():
    """
    AI推荐接口
    接收问卷数据，返回推荐的建筑列表
    """
    try:
        # 确保推荐器已初始化
        init_recommender()
        
        # 获取前端数据
        questionnaire_data = request.get_json()
        if not questionnaire_data:
            return jsonify({"error": "请提供问卷数据"}), 400
        
        # 转换格式
        ai_request = convert_questionnaire_to_request(questionnaire_data)
        
        print(f"📥 收到推荐请求: {json.dumps(ai_request, indent=2, ensure_ascii=False)}")
        
        # 调用推荐器
        result = recommender.recommend(ai_request)
        
        # 提取推荐结果（现在包含ID和推荐理由）
        final_recommendations = result.get("final_recommendations", [])
        top20 = result.get("top20", [])
        
        # 获取完整的建筑信息
        recommendations = []
        for rec in final_recommendations:
            # rec 现在是 {'id': 'building_xxxx', 'reasons': ['reason1', 'reason2', 'reason3']}
            building_id = rec.get('id') if isinstance(rec, dict) else rec
            reasons = rec.get('reasons', []) if isinstance(rec, dict) else []
            
            # 从top20中找到对应的建筑
            building = next((b for b in top20 if b["building_id"] == building_id), None)
            if building:
                recommendations.append({
                    "building_id": building["building_id"],
                    "name": building.get("name"),
                    "address": building.get("address"),
                    "county": building.get("county"),
                    "score": building.get("total_score"),
                    "tag_scores": building.get("tag_scores", {}),
                    "data": building.get("data", {}),
                    "reasons": reasons,  # 添加推荐理由
                })
        
        print(f"✅ 推荐完成: {len(recommendations)} 个建筑")
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "top20": [
                {
                    "building_id": b["building_id"],
                    "name": b.get("name"),
                    "address": b.get("address"),
                    "county": b.get("county"),
                    "score": b.get("total_score"),
                }
                for b in top20
            ],
        })
    
    except Exception as e:
        print(f"❌ 推荐失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/recommend/refine", methods=["POST"])
def refine_recommend():
    """
    细化推荐接口：基于用户的细化偏好，返回40个候选给GPT重新推荐
    """
    try:
        init_recommender()
        
        data = request.get_json()
        original = data.get("original", {})
        refined = data.get("refined", {})
        
        print(f"🔍 收到细化推荐请求:")
        print(f"  原始偏好: {json.dumps(original, indent=2, ensure_ascii=False)}")
        print(f"  细化偏好: {json.dumps(refined, indent=2, ensure_ascii=False)}")
        
        # 转换为recommender需要的格式
        request_data = convert_questionnaire_to_request(data)
        
        # 添加细化偏好到请求
        refined_text_parts = []
        
        # 设施偏好
        if refined.get("amenities"):
            amenities_text = ", ".join(refined["amenities"])
            refined_text_parts.append(f"Required amenities: {amenities_text}")
        
        if refined.get("customAmenities"):
            refined_text_parts.append(f"Additional amenities: {refined['customAmenities']}")
        
        # 通勤偏好
        if refined.get("commuteDestination"):
            max_time = refined.get("maxCommuteTime", 30)
            refined_text_parts.append(f"Commute to {refined['commuteDestination']} within {max_time} minutes")
        
        # 其他需求
        if refined.get("additionalNotes"):
            refined_text_parts.append(f"Additional requirements: {refined['additionalNotes']}")
        
        # 合并细化偏好文本
        refined_text = "; ".join(refined_text_parts) if refined_text_parts else None
        if refined_text:
            # 将细化偏好添加到notes字段
            existing_notes = request_data.get("notes", "")
            request_data["notes"] = f"{existing_notes}; REFINED PREFERENCES: {refined_text}" if existing_notes else f"REFINED PREFERENCES: {refined_text}"
        
        print(f"📝 转换后的请求数据: {json.dumps(request_data, indent=2, ensure_ascii=False)}")
        
        # 获取推荐结果（返回top40）
        result = recommender.recommend(request_data, return_top_n=40)  # 请求40个候选
        
        # 从top40中提取前20个和后20个
        top40 = result.get("top20", [])  # 实际是top40
        first_20 = top40[:20]
        second_20 = top40[20:40] if len(top40) > 20 else []
        
        print(f"✅ 获得 {len(first_20)} + {len(second_20)} = {len(top40)} 个候选建筑")
        
        # 让GPT从40个中选择最佳3个
        gpt_results = recommender._select_top_with_gpt(
            top40, 
            request_data,
            final_count=3
        )
        
        # 提取推荐结果
        final_recommendations = result.get("final_recommendations", gpt_results)
        
        # 获取完整的建筑信息
        recommendations = []
        for rec in final_recommendations:
            building_id = rec.get('id') if isinstance(rec, dict) else rec
            reasons = rec.get('reasons', []) if isinstance(rec, dict) else []
            
            building = next((b for b in top40 if b["building_id"] == building_id), None)
            if building:
                recommendations.append({
                    "building_id": building["building_id"],
                    "name": building.get("name"),
                    "address": building.get("address"),
                    "county": building.get("county"),
                    "score": building.get("total_score"),
                    "tag_scores": building.get("tag_scores", {}),
                    "data": building.get("data", {}),
                    "reasons": reasons,
                })
        
        print(f"🎯 最终返回 {len(recommendations)} 个细化推荐")
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "top40_count": len(top40),
            "refined_preferences": refined,
        })
    
    except Exception as e:
        print(f"❌ 细化推荐失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai/test", methods=["POST"])
def test_recommend():
    """
    测试接口，使用简化的参数
    """
    try:
        init_recommender()
        
        # 使用简单的测试数据
        test_request = {
            "location": "San Francisco State University",
            "radius_miles": 5,
            "top_priorities": ["Commute", "Lifestyle", "Near Grocery", "Amenities", "Pet Friendly"],
            "budget": {"max_rent": 2500, "bedrooms": 2},
        }
        
        print(f"🧪 测试推荐请求: {json.dumps(test_request, indent=2, ensure_ascii=False)}")
        
        result = recommender.recommend(test_request)
        
        return jsonify({
            "success": True,
            "final_recommendations": result.get("final_recommendations", []),
            "top20_count": len(result.get("top20", [])),
        })
    
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 启动AI推荐服务器...")
    print(f"📁 数据目录: {BASE_DIR / 'data'}")
    
    # 预加载推荐器
    init_recommender()
    
    # 启动服务器
    app.run(host="0.0.0.0", port=5001, debug=True)

