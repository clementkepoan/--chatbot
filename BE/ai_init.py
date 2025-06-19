import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

# Third-party imports
import google.generativeai as genai
from supabase import create_client, Client
import httpx

logger = logging.getLogger(__name__)

class ChatbotAI:
    """Handles AI operations including Gemini API calls and Supabase database operations"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.gemini_model = None
        
    async def initialize(self):
        """Initialize Supabase client and Gemini model"""
        try:
            # Initialize Supabase
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("Supabase credentials not found in environment variables")
            
            self.supabase = create_client(supabase_url, supabase_key)
            
            # Initialize Gemini
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if not gemini_api_key:
                raise ValueError("Gemini API key not found in environment variables")
            
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel('models/gemini-2.5-flash-preview-05-20')
            
            # Create chat_history table if it doesn't exist
            await self._create_chat_history_table()
            
            logger.info("ChatbotAI initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChatbotAI: {e}")
            raise
    
    async def _create_chat_history_table(self):
        """Create the chat_history table in Supabase if it doesn't exist"""
        try:
            # Check if table exists and create if needed
            result = self.supabase.table('chat_history').select('id').limit(1).execute()
            logger.info("chat_history table exists or was created successfully")
        except Exception as e:
            logger.warning(f"Note: chat_history table may need to be created manually: {e}")
    
    async def get_chat_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieve chat history for a session"""
        try:
            result = self.supabase.table('chat_history').select('*').eq('session_id', session_id).order('timestamp', desc=True).limit(limit).execute()
            
            # Reverse to get chronological order
            history = list(reversed(result.data))
            logger.info(f"Retrieved {len(history)} messages for session {session_id}")
            return history
            
        except Exception as e:
            logger.error(f"Error retrieving chat history: {e}")
            return []
    
    async def store_interaction(self, session_id: str, query: str, response: str, language: str):
        """Store a chat interaction in the database"""
        try:
            data = {
                "session_id": session_id,
                "query": query,
                "response": response,
                "language": language,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('chat_history').insert(data).execute()
            logger.info(f"Stored interaction for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error storing interaction: {e}")
            raise
    
    async def generate_response(self, query: str, language: str, context: List[str], history: List[Dict[str, Any]]) -> str:
        """Generate a response using Gemini API with context and history"""
        try:
            # Build conversation context
            conversation_context = self._build_conversation_context(history)
            logger.info(f"Building conversation context for query: {conversation_context}")
            
            # Build knowledge context
            knowledge_context = "\n".join(context) if context else "No specific restaurant information available."
            
            # Debug logging
            logger.info(f"Query: {query}")
            logger.info(f"Retrieved context pieces: {len(context)}")
            if context:
                logger.info(f"Context preview: {knowledge_context}")
            else:
                logger.info("No context retrieved")
            
            # Create prompt based on language
            prompt = self._create_prompt(query, language, knowledge_context, conversation_context)
            
            # Generate response using Gemini
            response = self.gemini_model.generate_content(prompt)
            
            if response.text:
                logger.info(f"Generated response for query: {query[:50]}...")
                return response.text.strip()
            else:
                logger.warning("Empty response from Gemini API")
                return "I apologize, but I'm having trouble generating a response right now. Please try again."
                
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again later."
    
    def _build_conversation_context(self, history: List[Dict[str, Any]]) -> str:
        """Build conversation context from chat history"""
        if not history:
            return "This is the start of a new conversation."
        
        context_parts = []
        for interaction in history[-5:]:  # Use last 5 interactions
            context_parts.append(f"User: {interaction['query']}")
            context_parts.append(f"Assistant: {interaction['response']}")
        
        return "\n".join(context_parts)
    
    def _create_prompt(self, query: str, language: str, knowledge_context: str, conversation_context: str) -> str:
        """Create a comprehensive prompt for the Gemini API"""
        
        language_instructions = {
            "en": "Respond in English",
            "zh": "请用中文回答",
            "ja": "日本語で回答してください",
            "ko": "한국어로 답변해주세요"
        }
        
        lang_instruction = language_instructions.get(language, "Respond in English")
        
        prompt = f"""You are a helpful assistant for a restaurant called "麵屋心" (Mian Wu Xin). You specialize in providing information about the restaurant's menu, services, hours, and general dining experience.

{lang_instruction}.

Restaurant Knowledge (USE THIS INFORMATION TO ANSWER):
{knowledge_context}

Conversation History:
{conversation_context}

Current User Question: {query}

Instructions:
- Be friendly, helpful, and professional
- Focus on restaurant-related topics
- ALWAYS use the Restaurant Knowledge provided above to answer questions
- If the Restaurant Knowledge contains relevant information, use it directly in your response
- Only suggest contacting the restaurant if the specific information is not in the Restaurant Knowledge
- Keep responses concise but informative
- STRICTLY follow the language instructions provided
- Maintain the conversational context from previous messages

Response:"""

        return prompt
    
    async def clear_session_history(self, session_id: str):
        """Clear all chat history for a session"""
        try:
            result = self.supabase.table('chat_history').delete().eq('session_id', session_id).execute()
            logger.info(f"Cleared history for session {session_id}")
        except Exception as e:
            logger.error(f"Error clearing session history: {e}")
            raise
    
    async def check_database_connection(self) -> bool:
        """Check if Supabase connection is working"""
        try:
            result = self.supabase.table('chat_history').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
            return False
    
    async def check_gemini_connection(self) -> bool:
        """Check if Gemini API connection is working"""
        try:
            response = self.gemini_model.generate_content("Test connection")
            return bool(response.text)
        except Exception as e:
            logger.error(f"Gemini connection check failed: {e}")
            return False