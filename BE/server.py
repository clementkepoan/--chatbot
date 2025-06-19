from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import logging

from ai_init import ChatbotAI
from vector_db import VectorDatabase

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant Chatbot API",
    description="A chatbot backend service for restaurant-specific assistance",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    Language: str = "en"
    Query: str
    Session_ID: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str

# Initialize components
chatbot_ai = ChatbotAI()
vector_db = VectorDatabase()

@app.on_event("startup")
async def startup_event():
    """Initialize database connections and vector store"""
    try:
        await chatbot_ai.initialize()
        await vector_db.initialize()
        logger.info("Chatbot backend initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize chatbot backend: {e}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Restaurant Chatbot API is running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "supabase": await chatbot_ai.check_database_connection(),
            "pinecone": await vector_db.check_connection(),
            "gemini": await chatbot_ai.check_gemini_connection()
        }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint for restaurant chatbot
    
    Args:
        request: ChatRequest containing Language, Query, and Session_ID
        
    Returns:
        ChatResponse with the chatbot's response
    """
    try:
        logger.info(f"Received chat request for session {request.Session_ID}")
        
        # Get conversation history
        history = await chatbot_ai.get_chat_history(request.Session_ID)
        
        # Get relevant context from vector database
        context = await vector_db.search_relevant_content(
            query=request.Query,
            language=request.Language
        )
        
        # Generate response using Gemini API
        response_text = await chatbot_ai.generate_response(
            query=request.Query,
            language=request.Language,
            context=context,
            history=history
        )
        
        # Store the interaction in database
        await chatbot_ai.store_interaction(
            session_id=request.Session_ID,
            query=request.Query,
            response=response_text,
            language=request.Language
        )
        
        return ChatResponse(
            response=response_text,
            session_id=request.Session_ID,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/updatedb")
async def update_database():
    """Sync Supabase menu_items and restaurant_details to Pinecone vector DB."""
    try:
        # Ensure both AI and vector DB are initialized
        if not hasattr(chatbot_ai, 'supabase') or chatbot_ai.supabase is None:
            await chatbot_ai.initialize()
        if not hasattr(vector_db, 'index') or vector_db.index is None:
            await vector_db.initialize()
        
        result = await vector_db.sync_supabase_to_pinecone(chatbot_ai.supabase)
        if result:
            return {"status": "success", "message": "Database synced to Pinecone."}
        else:
            return {"status": "error", "message": "Failed to sync database to Pinecone."}
    except Exception as e:
        logger.error(f"Error syncing database: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.get("/summary/{language}")
async def get_summary(language: str):
    """Summarize the restaurant details and menu items, item counts, lacking points, and suggestions to improve."""
    try:
        # Ensure both AI and vector DB are initialized
        if not hasattr(chatbot_ai, 'supabase') or chatbot_ai.supabase is None:
            await chatbot_ai.initialize()
        if not hasattr(vector_db, 'index') or vector_db.index is None:
            await vector_db.initialize()

        # Fetch all menu items and restaurant details from Supabase
        menu_resp = chatbot_ai.supabase.table('menu_items').select('*').execute()
        menu_items = menu_resp.data if hasattr(menu_resp, 'data') else menu_resp.get('data', [])
        details_resp = chatbot_ai.supabase.table('restaurant_details').select('*').execute()
        restaurant_details = details_resp.data if hasattr(details_resp, 'data') else details_resp.get('data', [])

        # Compose a summary prompt for the LLM
        menu_count = len(menu_items)
        details_count = len(restaurant_details)
        menu_text = '\n'.join([
            f"- {item['name']} (Price: {item['price']})\n  Description: {item['description']}" for item in menu_items
        ])
        details_text = '\n'.join([
            f"- {detail['details']}\n  Description: {detail['description']}" for detail in restaurant_details
        ])

        prompt = f"""
You are a restaurant menu and information database analyst specializing in identifying weak points and providing actionable improvements.:
- Identify any missing or lacking information (e.g., working hours, customization options, dietary info, etc.)
-Missing metadata (e.g., opening hours, contact info, location)
-Lack of dietary labels (e.g., vegetarian, vegan, gluten-free)
-Missing allergy warnings
-No indication of portion sizes or calorie/nutritional information
-Inconsistent or unclear naming and description formats
-Missing menu categories or item tagging structure
-Lack of combo options, customizable choices, or upsell suggestions
-Missing language/localization consistency (e.g., multilingual support)
-STRICTLY Respond in the language: {language}

Menu Items ({menu_count}):\n{menu_text}\n\nRestaurant Details ({details_count}):\n{details_text}\n"""

        # Use Gemini to generate the summary
        summary = await chatbot_ai.generate_response(
            query="Summarize and suggest improvements for the restaurant based on the data above.",
            language=language,
            context=[prompt],
            history=[]
        )
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )