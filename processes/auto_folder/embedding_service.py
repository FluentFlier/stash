"""
Embedding Service for Auto-Folder System

Handles:
- Embedding generation using Google Gemini
- Cosine similarity calculations
- Vector search and matching
- Embedding caching
"""

import logging
import hashlib
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
import json
import numpy as np

from .config import get_config, EmbeddingConfig

# Setup logging
logger = logging.getLogger(__name__)

# Try to import google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Run: pip install google-generativeai")


class EmbeddingService:
    """
    Service for generating and managing embeddings.
    Uses Google Gemini text-embedding-004 model.
    """
    
    def __init__(self, config: Optional[EmbeddingConfig] = None):
        """Initialize the embedding service."""
        self.config = config or get_config().embeddings
        self._configured = False
        self._cache: Dict[str, List[float]] = {}
        self._cache_file: Optional[Path] = None
        
        # Initialize cache file path
        config_obj = get_config()
        if config_obj.output_dir:
            self._cache_file = config_obj.output_dir / "embedding_cache.json"
            self._load_cache()
    
    def _configure(self) -> None:
        """Configure Gemini API."""
        if self._configured:
            return
        
        if not GEMINI_AVAILABLE:
            raise ImportError("google-generativeai package not installed")
        
        api_key = get_config().gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        
        genai.configure(api_key=api_key)
        self._configured = True
        logger.info("Gemini embedding service configured")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        return hashlib.md5(text.encode()).hexdigest()
    
    def _load_cache(self) -> None:
        """Load embedding cache from file."""
        if self._cache_file and self._cache_file.exists():
            try:
                with open(self._cache_file, 'r') as f:
                    self._cache = json.load(f)
                logger.info(f"Loaded {len(self._cache)} cached embeddings")
            except Exception as e:
                logger.warning(f"Failed to load embedding cache: {e}")
                self._cache = {}
    
    def _save_cache(self) -> None:
        """Save embedding cache to file."""
        if self._cache_file:
            try:
                self._cache_file.parent.mkdir(parents=True, exist_ok=True)
                with open(self._cache_file, 'w') as f:
                    json.dump(self._cache, f)
            except Exception as e:
                logger.warning(f"Failed to save embedding cache: {e}")
    
    def generate_embedding(self, text: str, use_cache: bool = True) -> List[float]:
        """
        Generate embedding for text using Gemini.
        
        Args:
            text: Text to embed
            use_cache: Whether to use/update cache
            
        Returns:
            Embedding vector as list of floats
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Check cache
        cache_key = self._get_cache_key(text)
        if use_cache and cache_key in self._cache:
            logger.debug(f"Cache hit for embedding: {text[:50]}...")
            return self._cache[cache_key]
        
        # Configure if needed
        self._configure()
        
        # Truncate if too long
        if len(text) > self.config.max_text_length:
            text = text[:self.config.max_text_length]
            logger.debug(f"Truncated text to {self.config.max_text_length} chars")
        
        try:
            # Generate embedding using Gemini
            result = genai.embed_content(
                model=self.config.model_name,
                content=text,
                task_type=self.config.task_type
            )
            
            embedding = result['embedding']
            
            # Cache result
            if use_cache:
                self._cache[cache_key] = embedding
                self._save_cache()
            
            logger.debug(f"Generated embedding for: {text[:50]}...")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(
        self, 
        texts: List[str],
        use_cache: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            use_cache: Whether to use/update cache
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        for text in texts:
            try:
                embedding = self.generate_embedding(text, use_cache)
                embeddings.append(embedding)
            except Exception as e:
                logger.error(f"Failed to embed text: {text[:50]}... Error: {e}")
                # Return zero vector on failure
                embeddings.append([0.0] * self.config.dimension)
        
        return embeddings
    
    @staticmethod
    def cosine_similarity(a: List[float], b: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            a: First embedding vector
            b: Second embedding vector
            
        Returns:
            Cosine similarity score (0-1)
        """
        if len(a) != len(b):
            raise ValueError(f"Embedding dimensions must match: {len(a)} vs {len(b)}")
        
        # Convert to numpy for efficiency
        vec_a = np.array(a)
        vec_b = np.array(b)
        
        # Compute cosine similarity
        dot_product = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        similarity = dot_product / (norm_a * norm_b)
        
        # Ensure result is in [0, 1] range
        return float(max(0.0, min(1.0, similarity)))
    
    def find_most_similar(
        self,
        query_embedding: List[float],
        candidate_embeddings: List[Tuple[str, List[float]]],
        threshold: float = 0.0,
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Find most similar embeddings from candidates.
        
        Args:
            query_embedding: Query embedding vector
            candidate_embeddings: List of (id, embedding) tuples
            threshold: Minimum similarity threshold
            top_k: Number of top results to return
            
        Returns:
            List of (id, similarity_score) tuples, sorted by score descending
        """
        results = []
        
        for candidate_id, candidate_embedding in candidate_embeddings:
            try:
                similarity = self.cosine_similarity(query_embedding, candidate_embedding)
                if similarity >= threshold:
                    results.append((candidate_id, similarity))
            except Exception as e:
                logger.warning(f"Error computing similarity for {candidate_id}: {e}")
        
        # Sort by similarity descending
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results[:top_k]
    
    def compute_text_similarity(self, text_a: str, text_b: str) -> float:
        """
        Compute semantic similarity between two texts.
        
        Args:
            text_a: First text
            text_b: Second text
            
        Returns:
            Similarity score (0-1)
        """
        emb_a = self.generate_embedding(text_a)
        emb_b = self.generate_embedding(text_b)
        return self.cosine_similarity(emb_a, emb_b)
    
    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self._cache = {}
        if self._cache_file and self._cache_file.exists():
            self._cache_file.unlink()
        logger.info("Embedding cache cleared")


# ============================================
# Vector Store Interface (Abstract)
# ============================================

class VectorStore:
    """
    Abstract interface for vector storage and search.
    Concrete implementations can use pgvector, Pinecone, Qdrant, etc.
    """
    
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
    
    def add_vector(
        self,
        vector_id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add a vector to the store."""
        raise NotImplementedError
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Search for similar vectors.
        
        Returns:
            List of (id, score, metadata) tuples
        """
        raise NotImplementedError
    
    def delete_vector(self, vector_id: str) -> bool:
        """Delete a vector from the store."""
        raise NotImplementedError
    
    def get_vector(self, vector_id: str) -> Optional[Tuple[List[float], Dict[str, Any]]]:
        """Get a vector by ID."""
        raise NotImplementedError


class InMemoryVectorStore(VectorStore):
    """
    In-memory vector store implementation.
    Suitable for development and small-scale use.
    """
    
    def __init__(self, embedding_service: EmbeddingService):
        super().__init__(embedding_service)
        self._vectors: Dict[str, Tuple[List[float], Dict[str, Any]]] = {}
        self._persistence_file: Optional[Path] = None
        
        # Setup persistence
        config = get_config()
        if config.output_dir:
            self._persistence_file = config.output_dir / "vector_store.json"
            self._load()
    
    def _load(self) -> None:
        """Load vectors from persistence file."""
        if self._persistence_file and self._persistence_file.exists():
            try:
                with open(self._persistence_file, 'r') as f:
                    data = json.load(f)
                    for vid, (emb, meta) in data.items():
                        self._vectors[vid] = (emb, meta)
                logger.info(f"Loaded {len(self._vectors)} vectors from storage")
            except Exception as e:
                logger.warning(f"Failed to load vector store: {e}")
    
    def _save(self) -> None:
        """Save vectors to persistence file."""
        if self._persistence_file:
            try:
                self._persistence_file.parent.mkdir(parents=True, exist_ok=True)
                with open(self._persistence_file, 'w') as f:
                    json.dump(self._vectors, f)
            except Exception as e:
                logger.warning(f"Failed to save vector store: {e}")
    
    def add_vector(
        self,
        vector_id: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add a vector to the store."""
        self._vectors[vector_id] = (embedding, metadata or {})
        self._save()
        logger.debug(f"Added vector: {vector_id}")
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search for similar vectors."""
        results = []
        
        for vector_id, (embedding, metadata) in self._vectors.items():
            # Apply metadata filter if provided
            if filter_metadata:
                match = all(
                    metadata.get(k) == v 
                    for k, v in filter_metadata.items()
                )
                if not match:
                    continue
            
            try:
                score = self.embedding_service.cosine_similarity(query_embedding, embedding)
                results.append((vector_id, score, metadata))
            except Exception as e:
                logger.warning(f"Error computing similarity for {vector_id}: {e}")
        
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results[:top_k]
    
    def delete_vector(self, vector_id: str) -> bool:
        """Delete a vector from the store."""
        if vector_id in self._vectors:
            del self._vectors[vector_id]
            self._save()
            return True
        return False
    
    def get_vector(self, vector_id: str) -> Optional[Tuple[List[float], Dict[str, Any]]]:
        """Get a vector by ID."""
        return self._vectors.get(vector_id)
    
    def get_all_vectors(self) -> Dict[str, Tuple[List[float], Dict[str, Any]]]:
        """Get all vectors."""
        return self._vectors.copy()
    
    def clear(self) -> None:
        """Clear all vectors."""
        self._vectors = {}
        self._save()
        logger.info("Vector store cleared")


# ============================================
# Factory Functions
# ============================================

_embedding_service: Optional[EmbeddingService] = None
_vector_store: Optional[VectorStore] = None


def get_embedding_service() -> EmbeddingService:
    """Get the global embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


def get_vector_store() -> VectorStore:
    """Get the global vector store instance."""
    global _vector_store
    if _vector_store is None:
        config = get_config()
        embedding_service = get_embedding_service()
        
        if config.database.vector_db_type == 'memory':
            _vector_store = InMemoryVectorStore(embedding_service)
        # TODO: Add other vector store implementations
        # elif config.database.vector_db_type == 'pgvector':
        #     _vector_store = PgVectorStore(embedding_service, config.database.connection_string)
        # elif config.database.vector_db_type == 'pinecone':
        #     _vector_store = PineconeVectorStore(embedding_service)
        else:
            logger.warning(f"Unknown vector db type: {config.database.vector_db_type}, using memory")
            _vector_store = InMemoryVectorStore(embedding_service)
    
    return _vector_store


def check_embedding_availability() -> Dict[str, Any]:
    """Check if embedding service is available and configured."""
    config = get_config()
    has_api_key = bool(config.gemini_api_key)
    
    result = {
        'sdk_installed': GEMINI_AVAILABLE,
        'api_key_set': has_api_key,
        'available': False,
        'message': ''
    }
    
    if not GEMINI_AVAILABLE:
        result['message'] = "google-generativeai not installed. Run: pip install google-generativeai"
    elif not has_api_key:
        result['message'] = "GEMINI_API_KEY not set in environment"
    else:
        result['available'] = True
        result['message'] = "Embedding service is ready"
    
    return result
