#!/usr/bin/env python3
"""
提示工程配置文件

"""

# =============================================================================
# 系统提示词 (System Prompt)
# =============================================================================

SYSTEM_PROMPT = """You are a professional U.S. housing recommendation specialist.

Search scope:
- Use the user-provided center location and a straight-line radius (in miles). Ignore candidates outside the radius.
- Perform deduplication only by geo-coordinates: candidates within ~30 meters great-circle distance are the same physical building.

Priority order (strict):
1) Region fit (inside radius, after geo deduplication)
2) User-stated preferences (honor their priority order: earlier = heavier)
3) Budget (soft constraint with limited exceedance)

Budget policy:
- Treat budget as household-level unless explicitly stated otherwise.
- At most ONE of the three recommended buildings may exceed the budget.
- Allowed exceedance cap: 10% over the stated budget.
- Avoid placing the over-budget building as #1 unless it uniquely satisfies the top priority in a way no in-budget option can.

Rooms & roommate coupling (R2 rule):
- If acceptable room counts are provided (e.g., 1,2,3), derive the building’s price range from the prices of those unit types.
- Consider a building "within budget" if ANY acceptable unit price ≤ budget.
- Consider a building "soft over-budget" if ANY acceptable unit price is in (budget, budget * 1.10], and use this status for at most one recommendation.
- If unit prices for an acceptable room type are missing, you may estimate them (see Estimation rules) OR prefer other buildings with known prices.

Estimation rules for missing unit-type prices (adjustable defaults):
- Monotonicity assumption: Studio ≤ 1BR ≤ 2BR ≤ 3BR.
- Interpolation: if price for kBR is missing but prices for (k-1)BR and (k+1)BR exist, estimate as their midpoint.
- Extrapolation upward: if only lower type exists, add +18% per additional bedroom step.
- Extrapolation downward: if only higher type exists, subtract −15% per bedroom step.
- When multiple estimates are possible, choose the most conservative (higher) estimate for affordability checks.

Robustness:
- Select EXACTLY 3 UNIQUE building IDs from the deduplicated, in-radius candidates.
- Output ONLY the three IDs in the exact format: ID1, ID2, ID3 (no extra text).
- Never invent IDs, never relax the radius rule. Budget is soft only within the single 10% allowance as described.

Scoring guidance:
- TotalScore (0–5) reflects weighted preferences—use as a guide, not the sole signal.
- Safety is a comparative dimension (not a hard filter).
- Mobility fit: match the user's preference (transit vs. car).
- Amenities and nearby POIs support lifestyle fit.
- If choices are nearly tied, prefer: higher TotalScore → better match on the TOP priority → budget friendliness (given rooms coupling) → mobility fit → higher amenities → deterministic fallback by lexicographic ID.
- Style preference from facade images is a soft, last-stage tiebreaker only.

Quality bar:
- #1 = best overall match under the above policies.
- #2 and #3 = strong alternatives.
- No geographic diversity requirement.
"""

# =============================================================================
# 用户提示词模板 (User Prompt Template)
# =============================================================================

USER_PROMPT_INTRO = """Recommend the top 3 buildings based on the user's preferences and the candidate list below.

USER PREFERENCES:
"""

USER_PROMPT_SEARCH_AREA_TEMPLATE = """
Search Area:
- Center Location: {location_text}
- Radius: {radius_text} miles (straight-line distance)
"""

USER_PROMPT_PRIORITIES_TEMPLATE = """
Top Priorities (ranked, most important first): {priorities_text}
"""

USER_PROMPT_BUDGET_TEMPLATE = """
Budget (household): {budget_text}
- Soft constraint with at most one pick up to 10% over.
"""

USER_PROMPT_ROOMS_TEMPLATE = """
Acceptable Rooms: {rooms_text}
"""

USER_PROMPT_ROOMMATE_TEMPLATE = """
Roommate Preference: {roommate_text}
"""

USER_PROMPT_HOUSING_TYPE_TEMPLATE = """
Housing Type Preference: {housing_type}
"""

USER_PROMPT_LAYOUT_TEMPLATE = """
Layout Requirements: {layout_text}
"""

USER_PROMPT_STYLE_PREFS_TEMPLATE = """
Facade Style Preferences (from 8 image likes/dislikes; soft preference):
{style_prefs_text}
"""

USER_PROMPT_NOTES_TEMPLATE = """
Additional Notes: {notes}
"""

USER_PROMPT_EXTRA_SECTION_TEMPLATE = """
Additional Constraints:
{extra_text}
"""

USER_PROMPT_INSTRUCTIONS = """

TASK:
Apply the System Prompt policies. Filter by radius (miles), deduplicate buildings by geo-distance ≤ 30 meters, then select 3 buildings.
Respect the priority order: region > user preferences > budget (soft; at most one up to +10%, avoid ranking it #1 unless uniquely satisfying the top priority).
Use rooms/roommate coupling (R2) when evaluating affordability. Style preference is a final soft tiebreaker only.

OUTPUT FORMAT:
Return EXACTLY 3 buildings in JSON format with their IDs and reasons:
[
  {
    "id": "building_xxxx",
    "reasons": ["reason 1", "reason 2", "reason 3"]
  },
  {
    "id": "building_yyyy",
    "reasons": ["reason 1", "reason 2", "reason 3"]
  },
  {
    "id": "building_zzzz",
    "reasons": ["reason 1", "reason 2", "reason 3"]
  }
]

Each building must have EXACTLY 3 concise reasons (max 15 words each) explaining why it's a great match for this user.

CANDIDATE BUILDINGS:
"""

# =============================================================================
# 候选建筑信息模板 (Candidate Building Template)
# =============================================================================

CANDIDATE_BUILDING_TEMPLATE = """
{idx}. ID={building_id}
   Name: {name}
   Address: {address}
   TotalScore: {total_score:.3f}

   Safety: {safety_incidents} incidents, rating={safety_rating}
   Public Transit: {transit_stops} stops nearby
   Car Friendly: {car_score}/100
   Amenities: {amenities_count} total
   Nearby POIs: dining={dining}, shopping={shopping}, fitness={fitness}, entertainment={entertainment}
   Pricing: {pricing}
   Latitude: {latitude}
   Longitude: {longitude}
"""

# =============================================================================
# 提示词组装函数
# =============================================================================

def build_system_prompt() -> str:
    return SYSTEM_PROMPT.strip()


def build_user_prompt(
    priorities_text: str,
    budget_text: str,
    housing_type: str,
    roommate_text: str,
    layout_text: str,
    notes: str,
    candidates_text: str,
    location_text: str,
    radius_text: str,
    rooms_text: str = "",
    extra_fields: dict = None,
    style_prefs_text: str = "", 
) -> str:
    """
    组装完整用户提示词（全国可用 + 半径英里 + 仅经纬度去重 + 预算10%软超且最多1套 + R2 价格匹配 + 风格软偏好）

    参数：
      - location_text / radius_text：如 "San Francisco, CA" / "5"
      - rooms_text：如 "1,2,3" 或 "Flexible"
      - roommate_text：如 "2 persons, household budget"
      - style_prefs_text：将 8 张外立面喜欢/不喜欢的结果总结成简明要点（如 "Likes: modern glass, high-rise; Dislikes: vintage brick"）
    """
    parts = [USER_PROMPT_INTRO]

    parts.append(USER_PROMPT_SEARCH_AREA_TEMPLATE.format(location_text=location_text, radius_text=radius_text))

    if priorities_text and priorities_text != "None":
        parts.append(USER_PROMPT_PRIORITIES_TEMPLATE.format(priorities_text=priorities_text))

    parts.append(USER_PROMPT_BUDGET_TEMPLATE.format(budget_text=budget_text))

    if rooms_text and rooms_text != "None":
        parts.append(USER_PROMPT_ROOMS_TEMPLATE.format(rooms_text=rooms_text))

    if roommate_text and roommate_text != "Flexible":
        parts.append(USER_PROMPT_ROOMMATE_TEMPLATE.format(roommate_text=roommate_text))

    if housing_type and housing_type != "Flexible":
        parts.append(USER_PROMPT_HOUSING_TYPE_TEMPLATE.format(housing_type=housing_type))

    if layout_text and layout_text != "None":
        parts.append(USER_PROMPT_LAYOUT_TEMPLATE.format(layout_text=layout_text))

    if style_prefs_text and style_prefs_text.strip():
        parts.append(USER_PROMPT_STYLE_PREFS_TEMPLATE.format(style_prefs_text=style_prefs_text.strip()))

    if notes and notes != "None":
        parts.append(USER_PROMPT_NOTES_TEMPLATE.format(notes=notes))

    if extra_fields:
        lines = []
        for k, v in extra_fields.items():
            if v is not None and str(v).strip() != "":
                lines.append(f"- {k}: {v}")
        if lines:
            parts.append(USER_PROMPT_EXTRA_SECTION_TEMPLATE.format(extra_text="\n".join(lines)))

    parts.append(USER_PROMPT_INSTRUCTIONS)
    parts.append(candidates_text.strip() if candidates_text else "")

    return "\n".join(parts).strip()


def format_candidate_building(
    idx: int,
    building_id: str,
    name: str,
    address: str,
    total_score: float,
    safety_incidents: str,
    safety_rating: str,
    transit_stops: str,
    car_score: str,
    amenities_count: int,
    dining: int,
    shopping: int,
    fitness: int,
    entertainment: int,
    pricing: str,
    latitude: str = "",
    longitude: str = "",
) -> str:
    """格式化单个候选（包含经纬度，供半径过滤与同址去重使用）"""
    return CANDIDATE_BUILDING_TEMPLATE.format(
        idx=idx,
        building_id=building_id,
        name=name,
        address=address,
        total_score=total_score,
        safety_incidents=safety_incidents,
        safety_rating=safety_rating,
        transit_stops=transit_stops,
        car_score=car_score,
        amenities_count=amenities_count,
        dining=dining,
        shopping=shopping,
        fitness=fitness,
        entertainment=entertainment,
        pricing=pricing,
        latitude=latitude,
        longitude=longitude,
    ).strip()
