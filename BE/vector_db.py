import os
import logging
from typing import List, Dict, Any, Optional
import asyncio

# Third-party imports
import pinecone
from pinecone import Pinecone, ServerlessSpec
import google.generativeai as genai

logger = logging.getLogger(__name__)

class VectorDatabase:
    """Handles Pinecone vector database operations for RAG functionality"""
    
    def __init__(self):
        self.pc: Optional[Pinecone] = None
        self.index = None
        self.index_name = os.getenv("PINECONE_INDEX_NAME")
        self.embedding_model = None
        
    async def initialize(self):
        """Initialize Pinecone client and index"""
        try:
            # Initialize Pinecone
            api_key = os.getenv("PINECONE_API_KEY")
            if not api_key:
                raise ValueError("Pinecone API key not found in environment variables")
            
            self.pc = Pinecone(api_key=api_key)
            
            # Check if index exists, create if not
            await self._ensure_index_exists()
            
            # Get the index
            self.index = self.pc.Index(self.index_name)
            
            # Initialize Google Generative AI for embeddings
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if gemini_api_key:
                genai.configure(api_key=gemini_api_key)
                logger.info("Google Generative AI configured for embeddings")
            
            logger.info("VectorDatabase initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize VectorDatabase: {e}")
            raise
    
    async def _ensure_index_exists(self):
        """Create index if it doesn't exist"""
        try:
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                logger.info(f"Creating new Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=768,  # Google's text-embedding-004 dimension
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                # Wait for index to be ready
                await asyncio.sleep(10)
            else:
                logger.info(f"Using existing Pinecone index: {self.index_name}")
                
        except Exception as e:
            logger.error(f"Error ensuring index exists: {e}")
            raise
    
    async def search_relevant_content(self, query: str, language: str = "en", top_k: int = 5) -> List[str]:
        """Search for relevant content based on query"""
        try:
            if not self.index:
                logger.warning("Pinecone index not initialized")
                return []

            # Generate multiple query variations for better matching
            query_lower = query.lower()
            
            # Extract important terms
            key_terms = []
            for word in query_lower.split():
                if len(word) > 2 and word not in ['how', 'much', 'does', 'the', 'cost', 'what', 'price']:
                    key_terms.append(word)
            
            query_variations = [
                query,
                " ".join(key_terms),  # Key terms only
                # Add restaurant-specific terms
                f"ramen {' '.join(key_terms)}",
                f"menu {' '.join(key_terms)}",
                f"price {' '.join(key_terms)}"
            ]
            
            # Special handling for pricing questions
            if any(word in query_lower for word in ['cost', 'price', 'much', 'expensive']):
                # Add specific menu item searches
                if 'black garlic' in query_lower or 'garlic oil' in query_lower:
                    query_variations.extend([
                        "Black Garlic Oil Ramen",
                        "Black Garlic Oil Ramen price",
                        "1480 ramen"
                    ])
                elif 'ramen' in query_lower:
                    query_variations.extend([
                        "ramen price",
                        "ramen menu",
                        "ramen cost"
                    ])
            
            logger.info(f"Search query variations: {query_variations}")
            
            all_results = []
            seen_content = set()  # To avoid duplicates
            
            for variation in query_variations:
                # Generate embedding for the query variation
                query_embedding = await self._generate_embedding(variation)
                
                if not query_embedding:
                    continue
                
                # Search in Pinecone with more results
                search_results = self.index.query(
                    vector=query_embedding,
                    top_k=top_k * 2,  # Get more results to increase chances
                    include_metadata=True,
                    filter={"language": language} if language else None
                )
                
                # Extract relevant content with very low threshold
                for match in search_results.matches:
                    if match.score > 0.005:  # Very low threshold for hash-based embeddings
                        content = match.metadata.get('content', '')
                        if content and content not in seen_content:
                            all_results.append((match.score, content))
                            seen_content.add(content)
            
            # Sort by score and take top results
            all_results.sort(reverse=True, key=lambda x: x[0])
            relevant_content = [content for score, content in all_results[:top_k]]
            
            logger.info(f"Found {len(relevant_content)} relevant content pieces for query")
            return relevant_content
            
        except Exception as e:
            logger.error(f"Error searching relevant content: {e}")
            return []
    
    async def add_document(self, content: str, metadata: Dict[str, Any]) -> bool:
        """Add a document to the vector database"""
        try:
            if not self.index:
                logger.warning("Pinecone index not initialized")
                return False
            
            # Generate embedding
            embedding = await self._generate_embedding(content)
            if not embedding:
                return False
            
            # Create unique ID for the document
            doc_id = f"doc_{hash(content)}_{metadata.get('language', 'en')}"
            
            # Prepare metadata
            full_metadata = {
                "content": content,
                "timestamp": metadata.get("timestamp", ""),
                "language": metadata.get("language", "en"),
                "document_type": metadata.get("document_type", "general")
            }
            
            # Upsert to Pinecone
            self.index.upsert([(doc_id, embedding, full_metadata)])
            
            logger.info(f"Added document to vector database: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document to vector database: {e}")
            return False
    
    async def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]]) -> bool:
        """Add multiple documents to the vector database (for PDF upload)"""
        try:
            if not self.index:
                logger.warning("Pinecone index not initialized")
                return False
            
            if len(texts) != len(metadatas):
                logger.error("Number of texts and metadatas must match")
                return False
            
            vectors_to_upsert = []
            
            for i, (text, metadata) in enumerate(zip(texts, metadatas)):
                # Generate embedding
                embedding = await self._generate_embedding(text)
                if not embedding:
                    logger.warning(f"Failed to generate embedding for text {i}")
                    continue
                
                # Create unique ID for the document
                source = metadata.get('source', 'unknown')
                chunk_index = metadata.get('chunk_index', i)
                doc_id = f"doc_{source}_{chunk_index}_{hash(text[:100])}"
                
                # Prepare metadata
                full_metadata = {
                    "content": text,
                    "source": source,
                    "document_type": metadata.get("document_type", "general"),
                    "language": metadata.get("language", "en"),
                    "chunk_index": chunk_index,
                    "total_chunks": metadata.get("total_chunks", 1),
                    "file_path": metadata.get("file_path", ""),
                    "timestamp": metadata.get("timestamp", "")
                }
                
                vectors_to_upsert.append((doc_id, embedding, full_metadata))
            
            if vectors_to_upsert:
                # Upsert in batches (Pinecone recommends batches of 100)
                batch_size = 100
                for i in range(0, len(vectors_to_upsert), batch_size):
                    batch = vectors_to_upsert[i:i + batch_size]
                    self.index.upsert(batch)
                    logger.info(f"Uploaded batch {i//batch_size + 1} with {len(batch)} vectors")
                
                logger.info(f"Successfully added {len(vectors_to_upsert)} documents to vector database")
                return True
            else:
                logger.error("No valid embeddings generated")
                return False
            
        except Exception as e:
            logger.error(f"Error adding documents to vector database: {e}")
            return False

    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using Google's Text Embedding API"""
        try:
            # Clean and prepare text for embedding
            text = text.strip()
            if not text:
                logger.warning("Empty text provided for embedding")
                return None
            
            # Truncate text if too long (Google has token limits)
            if len(text) > 8000:  # Conservative limit
                text = text[:8000]
                logger.warning("Text truncated to 8000 characters for embedding")
            
            # Use Google's text embedding model
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",  # Optimized for document retrieval
                title="Restaurant Document"  # Optional title for better context
            )
            
            # Extract the embedding vector
            embedding = result['embedding']
            
            # Validate embedding dimensions
            if len(embedding) != 768:
                logger.error(f"Unexpected embedding dimension: {len(embedding)}, expected 768")
                return None
            
            logger.debug(f"Generated embedding for text: {text[:50]}...")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating Google embedding: {e}")
            # Return None to allow fallback behavior
            return None

    

    async def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the index"""
        try:
            if not self.index:
                return {}
            
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness
            }
            
        except Exception as e:
            logger.error(f"Error getting index stats: {e}")
            return {}
    
    async def check_connection(self) -> bool:
        """Check if Pinecone connection is working"""
        try:
            if not self.pc:
                return False
            
            # Try to list indexes
            indexes = self.pc.list_indexes()
            return True
            
        except Exception as e:
            logger.error(f"Pinecone connection check failed: {e}")
            return False
    


    async def reset_pinecone_index(self):
        """Delete all vectors in the Pinecone index (namespace '__default__')."""
        try:
            if not self.index:
                logger.warning("Pinecone index not initialized")
                return False
            self.index.delete(delete_all=True, namespace="__default__")
            logger.info("All vectors in '__default__' namespace have been deleted.")
            return True
        except Exception as e:
            logger.error(f"Error resetting Pinecone index: {e}")
            return False

    async def sync_supabase_to_pinecone(self, supabase_client) -> bool:
        """Fetch menu_items and restaurant_details from Supabase and upload to Pinecone."""
        try:
            # Reset Pinecone index before uploading new data
            await self.reset_pinecone_index()

            # Fetch menu items
            menu_resp = supabase_client.table('menu_items').select('*').execute()
            menu_items = menu_resp.data if hasattr(menu_resp, 'data') else menu_resp.get('data', [])

            # Fetch restaurant details
            details_resp = supabase_client.table('restaurant_details').select('*').execute()
            restaurant_details = details_resp.data if hasattr(details_resp, 'data') else details_resp.get('data', [])

            texts = []
            metadatas = []

            # Prepare menu items
            # Chunk menu items in groups of 5
            chunk_size = 5
            for i in range(0, len(menu_items), chunk_size):
                chunk = menu_items[i:i+chunk_size]
                names = '\n'.join([f"Menu Item: {item['name']}\nPrice: {item['price']}\nDescription: {item['description']}" for item in chunk])
                texts.append(names)
                metadatas.append({
                    "source": "supabase_menu_items",
                    "document_type": "menu_item_chunk",
                    "language": "en",
                    "chunk_index": i // chunk_size,
                    "total_chunks": (len(menu_items) + chunk_size - 1) // chunk_size,
                    "supabase_ids": [item['id'] for item in chunk]
                })

            # Chunk restaurant details in groups of 5
            for i in range(0, len(restaurant_details), chunk_size):
                chunk = restaurant_details[i:i+chunk_size]
                details = '\n'.join([f"Restaurant Detail: {detail['details']}\nDescription: {detail['description']}" for detail in chunk])
                texts.append(details)
                metadatas.append({
                    "source": "supabase_restaurant_details",
                    "document_type": "restaurant_detail_chunk",
                    "language": "en",
                    "chunk_index": i // chunk_size,
                    "total_chunks": (len(restaurant_details) + chunk_size - 1) // chunk_size,
                    "supabase_ids": [detail['id'] for detail in chunk]
                })

            if not texts:
                logger.warning("No data found in Supabase to upload to Pinecone.")
                return False

            logger.info(f"Uploading {len(texts)} records from Supabase to Pinecone...")
            result = await self.add_documents(texts, metadatas)
            logger.info(f"Upload result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error syncing Supabase to Pinecone: {e}")
            return False