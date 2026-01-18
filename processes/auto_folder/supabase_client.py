"""
Supabase Client Integration for Auto-Folder System

Provides Supabase implementations for:
- Folder storage (CRUD operations)
- Item-folder associations
- Embedding storage with pgvector
- Real-time subscriptions (optional)

Supabase Setup:
1. Create a Supabase project at https://supabase.com
2. Enable the pgvector extension in SQL Editor
3. Run the migration SQL (see migrations/ or README)
4. Set SUPABASE_URL and SUPABASE_KEY in .env
"""

import logging
import json
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
import uuid

from .config import get_config
from .models import FolderEntity, AutoFolderOutput, ExistingFolder

# Setup logging
logger = logging.getLogger(__name__)

# Try to import supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("supabase-py not installed. Run: pip install supabase")


class SupabaseClient:
    """
    Singleton Supabase client manager.
    """
    _instance: Optional["SupabaseClient"] = None
    _client: Optional["Client"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self, url: Optional[str] = None, key: Optional[str] = None) -> "Client":
        """
        Initialize the Supabase client.
        
        Args:
            url: Supabase project URL (or from env)
            key: Supabase anon/service key (or from env)
            
        Returns:
            Supabase client instance
        """
        if self._client is not None:
            return self._client
        
        if not SUPABASE_AVAILABLE:
            raise ImportError("supabase-py not installed. Run: pip install supabase")
        
        config = get_config()
        supabase_url = url or config.database.supabase_url
        supabase_key = key or config.database.supabase_key
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment or .env file"
            )
        
        self._client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")
        
        return self._client
    
    @property
    def client(self) -> "Client":
        """Get the Supabase client, initializing if needed."""
        if self._client is None:
            return self.initialize()
        return self._client
    
    def close(self) -> None:
        """Close the Supabase client."""
        self._client = None


def get_supabase_client() -> "Client":
    """Get the global Supabase client instance."""
    return SupabaseClient().client


# ============================================
# Supabase Repository Implementations
# ============================================

class SupabaseFolderRepository:
    """
    Supabase-based folder repository.
    
    Table: folders
    """
    
    def __init__(self, client: Optional["Client"] = None):
        self.client = client or get_supabase_client()
        self.table = "folders"
    
    def create_folder(self, folder: FolderEntity) -> FolderEntity:
        """Create a new folder in Supabase."""
        # Build data dict, excluding None values and letting Supabase set defaults
        data = {
            "folder_id": folder.folder_id,
            "path": folder.path,
            "label": folder.label,
            "depth": folder.depth,
            "aliases": folder.aliases or [],
            "item_count": folder.item_count or 0,
            "is_seed": folder.is_seed or False,
        }
        
        # Only include optional fields if they have values
        if folder.parent_id:
            data["parent_id"] = folder.parent_id
        if folder.embedding_id:
            data["embedding_id"] = folder.embedding_id
        if folder.user_id:
            data["user_id"] = folder.user_id
        
        try:
            result = self.client.table(self.table).insert(data).execute()
            
            if result.data:
                logger.debug(f"Created folder in Supabase: {folder.path}")
                return folder
            else:
                raise Exception(f"Failed to create folder: {result}")
        except Exception as e:
            logger.warning(f"Failed to create folder {folder.path}: {e}")
            raise
    
    def get_folder_by_id(self, folder_id: str) -> Optional[FolderEntity]:
        """Get folder by ID from Supabase."""
        result = self.client.table(self.table)\
            .select("*")\
            .eq("folder_id", folder_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return self._to_entity(result.data[0])
        return None
    
    def get_folder_by_path(
        self, 
        path: str, 
        user_id: Optional[str] = None
    ) -> Optional[FolderEntity]:
        """Get folder by path from Supabase."""
        query = self.client.table(self.table).select("*").eq("path", path)
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.execute()
        
        if result.data and len(result.data) > 0:
            return self._to_entity(result.data[0])
        return None
    
    def get_all_folders(self, user_id: Optional[str] = None) -> List[FolderEntity]:
        """Get all folders from Supabase."""
        query = self.client.table(self.table).select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.order("depth").execute()
        
        return [self._to_entity(row) for row in result.data] if result.data else []
    
    def get_folders_by_depth(
        self, 
        depth: int, 
        user_id: Optional[str] = None
    ) -> List[FolderEntity]:
        """Get folders at a specific depth from Supabase."""
        query = self.client.table(self.table).select("*").eq("depth", depth)
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.execute()
        
        return [self._to_entity(row) for row in result.data] if result.data else []
    
    def update_folder(self, folder: FolderEntity) -> FolderEntity:
        """Update a folder in Supabase."""
        data = {
            "path": folder.path,
            "label": folder.label,
            "aliases": folder.aliases,
            "item_count": folder.item_count,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = self.client.table(self.table)\
            .update(data)\
            .eq("folder_id", folder.folder_id)\
            .execute()
        
        if result.data:
            folder.updated_at = datetime.utcnow()
            return folder
        else:
            raise Exception(f"Failed to update folder: {result}")
    
    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder from Supabase."""
        result = self.client.table(self.table)\
            .delete()\
            .eq("folder_id", folder_id)\
            .execute()
        
        return bool(result.data)
    
    def increment_item_count(self, folder_id: str) -> None:
        """Increment the item count for a folder using RPC."""
        # Using raw SQL via RPC for atomic increment
        # You'll need to create this function in Supabase
        try:
            self.client.rpc(
                "increment_folder_item_count",
                {"p_folder_id": folder_id}
            ).execute()
        except Exception as e:
            # Fallback to read-update if RPC not available
            logger.warning(f"RPC not available, using fallback: {e}")
            folder = self.get_folder_by_id(folder_id)
            if folder:
                folder.item_count += 1
                self.update_folder(folder)
    
    def get_children(self, parent_id: str) -> List[FolderEntity]:
        """Get child folders of a parent from Supabase."""
        result = self.client.table(self.table)\
            .select("*")\
            .eq("parent_id", parent_id)\
            .execute()
        
        return [self._to_entity(row) for row in result.data] if result.data else []
    
    def _to_entity(self, data: Dict[str, Any]) -> FolderEntity:
        """Convert Supabase row to FolderEntity."""
        return FolderEntity(
            folder_id=data.get("folder_id"),
            path=data.get("path", ""),
            label=data.get("label", ""),
            depth=data.get("depth", 1),
            parent_id=data.get("parent_id"),
            aliases=data.get("aliases", []),
            embedding_id=data.get("embedding_id"),
            item_count=data.get("item_count", 0),
            is_seed=data.get("is_seed", False),
            user_id=data.get("user_id")
        )


class SupabaseItemFolderRepository:
    """
    Supabase-based item-folder association repository.
    
    Table: item_folders
    """
    
    def __init__(self, client: Optional["Client"] = None):
        self.client = client or get_supabase_client()
        self.table = "item_folders"
    
    def _ensure_uuid(self, value: str) -> str:
        """Ensure value is a valid UUID, converting if necessary."""
        try:
            # Check if already a valid UUID
            uuid.UUID(value)
            return value
        except (ValueError, AttributeError):
            # Generate deterministic UUID from string
            return str(uuid.uuid5(uuid.NAMESPACE_OID, value))
    
    def associate_item(
        self,
        item_id: str,
        folder_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Associate an item with a folder."""
        # Ensure item_id is a valid UUID (convert if needed)
        item_uuid = self._ensure_uuid(item_id)
        
        data = {
            "item_id": item_uuid,
            "folder_id": folder_id,
            "metadata": metadata or {},
        }
        
        try:
            # Upsert to handle re-classification
            self.client.table(self.table).upsert(data).execute()
            logger.debug(f"Associated item {item_id} ({item_uuid}) with folder {folder_id}")
        except Exception as e:
            logger.warning(f"Failed to associate item {item_id}: {e}")
    
    def get_folder_for_item(self, item_id: str) -> Optional[str]:
        """Get the folder ID for an item."""
        result = self.client.table(self.table)\
            .select("folder_id")\
            .eq("item_id", item_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0].get("folder_id")
        return None
    
    def get_items_in_folder(
        self,
        folder_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[str]:
        """Get item IDs in a folder."""
        result = self.client.table(self.table)\
            .select("item_id")\
            .eq("folder_id", folder_id)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return [row["item_id"] for row in result.data] if result.data else []
    
    def move_item(self, item_id: str, new_folder_id: str) -> bool:
        """Move an item to a different folder."""
        data = {
            "folder_id": new_folder_id,
            "moved_at": datetime.utcnow().isoformat()
        }
        
        result = self.client.table(self.table)\
            .update(data)\
            .eq("item_id", item_id)\
            .execute()
        
        return bool(result.data)
    
    def remove_item(self, item_id: str) -> bool:
        """Remove an item from its folder."""
        result = self.client.table(self.table)\
            .delete()\
            .eq("item_id", item_id)\
            .execute()
        
        return bool(result.data)


class SupabaseEmbeddingRepository:
    """
    Supabase-based embedding repository using pgvector.
    
    Table: embeddings
    
    Requires pgvector extension enabled in Supabase:
    CREATE EXTENSION IF NOT EXISTS vector;
    """
    
    def __init__(self, client: Optional["Client"] = None):
        self.client = client or get_supabase_client()
        self.table = "embeddings"
    
    def store_embedding(
        self,
        entity_id: str,
        entity_type: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Store an embedding in Supabase with pgvector."""
        embedding_id = str(uuid.uuid4())
        
        data = {
            "embedding_id": embedding_id,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "embedding": embedding,  # pgvector handles the vector type
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = self.client.table(self.table).insert(data).execute()
        
        if result.data:
            logger.debug(f"Stored embedding for {entity_type}: {entity_id}")
            return embedding_id
        else:
            raise Exception(f"Failed to store embedding: {result}")
    
    def get_embedding(
        self, 
        embedding_id: str
    ) -> Optional[Tuple[List[float], Dict[str, Any]]]:
        """Get embedding and metadata by ID."""
        result = self.client.table(self.table)\
            .select("embedding, metadata")\
            .eq("embedding_id", embedding_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            row = result.data[0]
            return (row.get("embedding", []), row.get("metadata", {}))
        return None
    
    def search_similar(
        self,
        query_embedding: List[float],
        entity_type: str,
        limit: int = 10,
        threshold: float = 0.0,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Search for similar embeddings using pgvector.
        
        Uses the match_embeddings RPC function for vector similarity search.
        """
        try:
            # Use RPC for vector similarity search
            result = self.client.rpc(
                "match_embeddings",
                {
                    "query_embedding": query_embedding,
                    "match_entity_type": entity_type,
                    "match_threshold": threshold,
                    "match_count": limit
                }
            ).execute()
            
            if result.data:
                return [
                    (
                        row["entity_id"],
                        row["similarity"],
                        row.get("metadata", {})
                    )
                    for row in result.data
                ]
            return []
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    def delete_embedding(self, embedding_id: str) -> bool:
        """Delete an embedding from Supabase."""
        result = self.client.table(self.table)\
            .delete()\
            .eq("embedding_id", embedding_id)\
            .execute()
        
        return bool(result.data)
    
    def delete_by_entity(self, entity_id: str, entity_type: str) -> bool:
        """Delete all embeddings for an entity."""
        result = self.client.table(self.table)\
            .delete()\
            .eq("entity_id", entity_id)\
            .eq("entity_type", entity_type)\
            .execute()
        
        return bool(result.data)


class SupabaseTaxonomyStatsRepository:
    """
    Supabase-based taxonomy statistics repository.
    
    Table: taxonomy_stats
    """
    
    def __init__(self, client: Optional["Client"] = None):
        self.client = client or get_supabase_client()
        self.table = "taxonomy_stats"
    
    def _ensure_uuid(self, value: str) -> str:
        """Ensure value is a valid UUID, converting if necessary."""
        try:
            uuid.UUID(value)
            return value
        except (ValueError, AttributeError):
            return str(uuid.uuid5(uuid.NAMESPACE_OID, value))
    
    def record_classification(
        self,
        item_id: str,
        output: AutoFolderOutput
    ) -> None:
        """Record a classification result."""
        # Ensure item_id is a valid UUID
        item_uuid = self._ensure_uuid(item_id)
        
        data = {
            "id": str(uuid.uuid4()),
            "item_id": item_uuid,
            "final_path": output.final_path,
            "confidence": output.confidence,
            "created_folders": output.created_folders,
            "reused_folders": output.reused_folders,
            "tags": output.tags,
            "processing_time_ms": output.processing_time_ms,
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.client.table(self.table).insert(data).execute()
    
    def get_folder_stats(self, folder_path: str) -> Dict[str, Any]:
        """Get statistics for a folder path."""
        # Count classifications that include this path
        result = self.client.table(self.table)\
            .select("*", count="exact")\
            .like("final_path", f"{folder_path}%")\
            .execute()
        
        return {
            "classification_count": result.count or 0,
            "path": folder_path
        }
    
    def get_classification_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent classification history."""
        result = self.client.table(self.table)\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        return result.data if result.data else []


# ============================================
# SQL Migrations for Supabase
# ============================================

SUPABASE_MIGRATIONS = """
-- ===========================================
-- Supabase Migration for Auto-Folder System
-- ===========================================
-- Run this in your Supabase SQL Editor

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create folders table
CREATE TABLE IF NOT EXISTS folders (
    folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(500) NOT NULL,
    label VARCHAR(100) NOT NULL,
    depth INTEGER NOT NULL DEFAULT 1,
    parent_id UUID REFERENCES folders(folder_id) ON DELETE SET NULL,
    aliases TEXT[] DEFAULT '{}',
    embedding_id UUID,
    item_count INTEGER DEFAULT 0,
    is_seed BOOLEAN DEFAULT FALSE,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(path, user_id)
);

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_depth ON folders(depth);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);

-- 3. Create embeddings table with pgvector
CREATE TABLE IF NOT EXISTS embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- 'folder' or 'item'
    embedding vector(768),  -- Gemini text-embedding-004 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_entity 
    ON embeddings(entity_id, entity_type);

-- Vector similarity index (IVFFlat for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
    ON embeddings USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- 4. Create item_folders association table
CREATE TABLE IF NOT EXISTS item_folders (
    item_id UUID PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES folders(folder_id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    associated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_at TIMESTAMP WITH TIME ZONE
);

-- Index for item_folders
CREATE INDEX IF NOT EXISTS idx_item_folders_folder ON item_folders(folder_id);

-- 5. Create taxonomy_stats table
CREATE TABLE IF NOT EXISTS taxonomy_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    final_path VARCHAR(500) NOT NULL,
    confidence FLOAT DEFAULT 0,
    created_folders TEXT[] DEFAULT '{}',
    reused_folders TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for taxonomy_stats
CREATE INDEX IF NOT EXISTS idx_taxonomy_stats_path ON taxonomy_stats(final_path);
CREATE INDEX IF NOT EXISTS idx_taxonomy_stats_created ON taxonomy_stats(created_at DESC);

-- 6. Create RPC function for atomic item count increment
CREATE OR REPLACE FUNCTION increment_folder_item_count(p_folder_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE folders 
    SET item_count = item_count + 1,
        updated_at = NOW()
    WHERE folder_id = p_folder_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(768),
    match_entity_type VARCHAR(50),
    match_threshold FLOAT DEFAULT 0.0,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    entity_id UUID,
    entity_type VARCHAR(50),
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_id,
        e.entity_type,
        1 - (e.embedding <=> query_embedding) AS similarity,
        e.metadata
    FROM embeddings e
    WHERE e.entity_type = match_entity_type
        AND 1 - (e.embedding <=> query_embedding) >= match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Row Level Security (RLS) - Optional but recommended
-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
-- For seed folders (no user_id), allow read access to all
CREATE POLICY "Seed folders are viewable by everyone"
    ON folders FOR SELECT
    USING (is_seed = true OR user_id IS NULL);

-- For user folders, only the owner can access
CREATE POLICY "Users can manage their own folders"
    ON folders FOR ALL
    USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Customize based on your authentication setup)

-- 9. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Migration complete!
-- ===========================================
"""


def get_migration_sql() -> str:
    """Get the SQL migration script for Supabase setup."""
    return SUPABASE_MIGRATIONS


def check_supabase_availability() -> Dict[str, Any]:
    """Check if Supabase client is available and configured."""
    config = get_config()
    has_url = bool(config.database.supabase_url)
    has_key = bool(config.database.supabase_key)
    
    result = {
        'sdk_installed': SUPABASE_AVAILABLE,
        'url_set': has_url,
        'key_set': has_key,
        'available': False,
        'message': ''
    }
    
    if not SUPABASE_AVAILABLE:
        result['message'] = "supabase-py not installed. Run: pip install supabase"
    elif not has_url:
        result['message'] = "SUPABASE_URL not set in environment"
    elif not has_key:
        result['message'] = "SUPABASE_KEY not set in environment"
    else:
        result['available'] = True
        result['message'] = "Supabase is ready"
    
    return result
