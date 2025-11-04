#!/bin/bash
# AI推荐API测试脚本

BASE_URL="http://localhost:5001"

echo "🧪 测试AI推荐API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试1: 健康检查
echo "📌 测试1: 健康检查"
echo "GET $BASE_URL/health"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""
echo ""

# 测试2: 简单测试接口
echo "📌 测试2: 简单测试接口（无需参数）"
echo "POST $BASE_URL/api/ai/test"
curl -s -X POST "$BASE_URL/api/ai/test" | python3 -m json.tool
echo ""
echo ""

# 测试3: 完整推荐接口
echo "📌 测试3: 完整推荐接口（模拟问卷数据）"
echo "POST $BASE_URL/api/ai/recommend"

# 创建测试数据
TEST_DATA=$(cat <<EOF
{
  "stylePreferences": ["modern.jpg", "luxury.jpg"],
  "location": {
    "address": "San Francisco State University",
    "coordinates": {"lat": 37.7225, "lon": -122.4777},
    "radius": 5
  },
  "budget": {
    "min": 1500,
    "max": 2500
  },
  "priorities": ["Commute", "Lifestyle", "Near Grocery", "Amenities", "Pet Friendly"],
  "housingType": ["Entire Apartment", "Studio"],
  "roommatePreference": "I prefer to live alone",
  "bedrooms": [2],
  "bathrooms": [2],
  "moveInTimeline": "Within 3 months",
  "leaseTerm": "12+ months"
}
EOF
)

echo "$TEST_DATA" | python3 -m json.tool
echo ""
echo "发送请求..."
echo ""

curl -s -X POST "$BASE_URL/api/ai/recommend" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" | python3 -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成"

