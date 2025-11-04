## Install dependencies

```bash
cd backend/ai_recommendation
pip3 install -r requirements.txt
```

## Start the API server

```bash
# Set OpenAI API Key
export OPENAI_API_KEY="your-key-here"

#  Start serve （Default port 5001）
python3 api_server.py
Start the API server