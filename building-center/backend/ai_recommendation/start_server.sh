#!/bin/bash
# AI推荐服务器启动脚本

cd "$(dirname "$0")"

echo "🚀 启动AI推荐服务器..."
echo "📁 工作目录: $(pwd)"

# 检查Python3是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到python3，请先安装Python 3"
    exit 1
fi

# 检查依赖是否安装
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  警告: 未检测到Flask，正在安装依赖..."
    pip3 install -r requirements.txt
fi

# 检查数据文件
if [ ! -f "data/processed/buildings/san_francisco/buildings_enriched.json" ]; then
    echo "❌ 错误: 数据文件不存在，请确保已复制所有必要文件"
    exit 1
fi

# 设置环境变量（如果存在.env文件）
if [ -f ".env" ]; then
    echo "📝 加载环境变量..."
    export $(cat .env | xargs)
fi

# 检查OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  警告: OPENAI_API_KEY 未设置，将使用基于规则的推荐"
    echo "   如需使用GPT增强推荐，请设置: export OPENAI_API_KEY='your-key-here'"
else
    echo "✅ 检测到 OPENAI_API_KEY"
fi

# 启动服务器
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AI推荐服务器运行中"
echo "  地址: http://localhost:5001"
echo "  健康检查: http://localhost:5001/health"
echo "  推荐接口: http://localhost:5001/api/ai/recommend"
echo "  测试接口: http://localhost:5001/api/ai/test"
echo "  按 Ctrl+C 停止服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 api_server.py

