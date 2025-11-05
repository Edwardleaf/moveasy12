#!/bin/bash
# 查看当前使用的提示词配置

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AI推荐系统 - 提示词配置查看器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"

echo "📍 配置文件位置: src/recommendation/prompts_config.py"
echo ""

# 显示系统提示词
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1️⃣  系统提示词 (SYSTEM_PROMPT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
python3 << 'EOF'
from src.recommendation.prompts_config import build_system_prompt
print(build_system_prompt())
EOF
echo ""

# 显示用户提示词示例
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2️⃣  用户提示词模板 (部分示例)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
python3 << 'EOF'
from src.recommendation.prompts_config import USER_PROMPT_INTRO, USER_PROMPT_INSTRUCTIONS
print(">>> 开头部分:")
print(USER_PROMPT_INTRO)
print("\n>>> 任务说明部分:")
print(USER_PROMPT_INSTRUCTIONS[:500] + "...")
EOF
echo ""

# 显示候选建筑模板
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3️⃣  候选建筑信息模板 (CANDIDATE_BUILDING_TEMPLATE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
python3 << 'EOF'
from src.recommendation.prompts_config import format_candidate_building
example = format_candidate_building(
    idx=1,
    building_id="SF_DEMO_001",
    name="Modern Luxury Apartments",
    address="123 Market St, San Francisco, CA",
    total_score=4.25,
    safety_incidents="12",
    safety_rating="8.5",
    transit_stops="5",
    car_score="75",
    amenities_count=15,
    dining=8,
    shopping=5,
    fitness=3,
    entertainment=6,
    pricing="$2,500 - $4,200"
)
print(example)
EOF
echo ""

# 显示模型配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4️⃣  模型配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  GPT模型: gpt-4o"
echo "  Embedding模型: text-embedding-3-small"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示: 编辑 src/recommendation/prompts_config.py 来微调提示词"
echo "📖 详细指南: cat PROMPTS_GUIDE.md"
echo ""

