# 🚀 Quick Start Guide for 麵屋心 Chatbot

## Prerequisites Checklist

Before running the chatbot, ensure you have:

- ✅ Python 3.10+ installed
- ✅ All dependencies installed (`pip install -r requirements.txt`)
- ✅ API keys for the following services:

### 1. Supabase Setup
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Run the SQL commands from `database_setup.sql` in your Supabase SQL editor

### 2. Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create an API key
3. Copy the key for your `.env` file

### 3. Pinecone Vector Database
1. Create a free account at [pinecone.io](https://www.pinecone.io/)
2. Create an API key
3. Note your environment (usually `us-east-1-aws` for free tier)

## Environment Setup

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=restaurant-knowledge

# App
DEBUG=True
```

## Quick Commands

### 1. Start the Server
```bash
cd /path/to/麵屋心_chatbot
python server.py
```

### 2. Populate Knowledge Base (Optional)
```bash
python populate_knowledge.py
```

### 3. Test the API
```bash
python test_api.py
```

### 4. Docker Setup (Alternative)
```bash
docker-compose up --build
```

## API Usage Examples

### Chat Request
```bash
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{
       "Language": "en",
       "Query": "What are your opening hours?",
       "Session_ID": "user-123"
     }'
```

### Expected Response
```json
{
  "response": "We are open Monday through Sunday from 11:30 AM to 9:30 PM. We are closed on major holidays, and last order is taken 30 minutes before closing time.",
  "session_id": "user-123",
  "timestamp": "2025-05-29T10:30:00Z"
}
```

## Troubleshooting

### Common Issues:

1. **Import errors**: Make sure all dependencies are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **Database connection issues**: Verify your Supabase credentials in `.env`

3. **Pinecone connection issues**: Check your API key and environment

4. **Gemini API issues**: Verify your API key and quota

### Getting Help:
- Check the logs for detailed error messages
- Visit the API documentation at `http://localhost:8000/docs`
- Refer to the full README.md for detailed information

## Next Steps

1. ✅ Set up your environment variables
2. ✅ Run the database setup SQL
3. ✅ Start the server
4. ✅ Test with the provided examples
5. 🍜 Start chatting with your restaurant assistant!
