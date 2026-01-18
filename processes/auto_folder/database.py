"""
Database Interface for Auto-Folder System

Provides abstract interface and placeholder implementations for:
- Folder storage (CRUD operations)
- Item-folder associations
- Embedding storage (with pgvector support placeholder)
- Taxonomy statistics

This module is designed for easy swapping between:
- Local JSON storage (development)
- PostgreSQL with pgvector (production)
- Other databases as needed
"""

import logging
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any, Protocol, Tuple
from abc import ABC, abstractmethod
import uuid

from .config import get_config, DatabaseConfig
from .models import (
    FolderEntity,
    ItemInput,
    AutoFolderOutput,
    ExistingFolder
)

# Setup logging
logger = logging.getLogger(__name__)


# ============================================
# Abstract Database Interface
# ============================================

class FolderRepository(ABC):
    """Abstract interface for folder storage operations."""
    
    @abstractmethod
    def create_folder(self, folder: FolderEntity) -> FolderEntity:
        """Create a new folder."""
        pass
    
    @abstractmethod
    def get_folder_by_id(self, folder_id: str) -> Optional[FolderEntity]:
        """Get folder by ID."""
        pass
    
    @abstractmethod
    def get_folder_by_path(self, path: str, user_id: Optional[str] = None) -> Optional[FolderEntity]:
        """Get folder by path."""
        pass
    
    @abstractmethod
    def get_all_folders(self, user_id: Optional[str] = None) -> List[FolderEntity]:
        """Get all folders for a user."""
        pass
    
    @abstractmethod
    def get_folders_by_depth(self, depth: int, user_id: Optional[str] = None) -> List[FolderEntity]:
        """Get all folders at a specific depth."""
        pass
    
    @abstractmethod
    def update_folder(self, folder: FolderEntity) -> FolderEntity:
        """Update an existing folder."""
        pass
    
    @abstractmethod
    def delete_folder(self, folder_id: str) -> bool:
        """Delete a folder."""
        pass
    
    @abstractmethod
    def increment_item_count(self, folder_id: str) -> None:
        """Increment the item count for a folder."""
        pass
    
    @abstractmethod
    def get_children(self, parent_id: str) -> List[FolderEntity]:
        """Get child folders of a parent."""
        pass


class ItemFolderRepository(ABC):
    """Abstract interface for item-folder associations."""
    
    @abstractmethod
    def associate_item(
        self, 
        item_id: str, 
        folder_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Associate an item with a folder."""
        pass
    
    @abstractmethod
    def get_folder_for_item(self, item_id: str) -> Optional[str]:
        """Get the folder ID for an item."""
        pass
    
    @abstractmethod
    def get_items_in_folder(
        self, 
        folder_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[str]:
        """Get item IDs in a folder."""
        pass
    
    @abstractmethod
    def move_item(self, item_id: str, new_folder_id: str) -> bool:
        """Move an item to a different folder."""
        pass
    
    @abstractmethod
    def remove_item(self, item_id: str) -> bool:
        """Remove an item from its folder."""
        pass


class EmbeddingRepository(ABC):
    """Abstract interface for embedding storage (pgvector-ready)."""
    
    @abstractmethod
    def store_embedding(
        self,
        entity_id: str,
        entity_type: str,  # 'folder' or 'item'
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Store an embedding and return its ID."""
        pass
    
    @abstractmethod
    def get_embedding(self, embedding_id: str) -> Optional[Tuple[List[float], Dict[str, Any]]]:
        """Get embedding and metadata by ID."""
        pass
    
    @abstractmethod
    def search_similar(
        self,
        query_embedding: List[float],
        entity_type: str,
        limit: int = 10,
        threshold: float = 0.0,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search for similar embeddings."""
        pass
    
    @abstractmethod
    def delete_embedding(self, embedding_id: str) -> bool:
        """Delete an embedding."""
        pass


class TaxonomyStatsRepository(ABC):
    """Abstract interface for taxonomy statistics."""
    
    @abstractmethod
    def record_classification(
        self,
        item_id: str,
        output: AutoFolderOutput
    ) -> None:
        """Record a classification result."""
        pass
    
    @abstractmethod
    def get_folder_stats(
        self,
        folder_id: str
    ) -> Dict[str, Any]:
        """Get statistics for a folder."""
        pass
    
    @abstractmethod
    def get_classification_history(
        self,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get recent classification history."""
        pass


# ============================================
# Local JSON Implementation (Development)
# ============================================

class LocalJsonFolderRepository(FolderRepository):
    """Local JSON file-based folder repository for development."""
    
    def __init__(self, storage_path: Optional[Path] = None):
        config = get_config()
        self.storage_path = storage_path or config.output_dir / "folders.json"
        self._folders: Dict[str, Dict[str, Any]] = {}
        self._load()
    
    def _load(self) -> None:
        """Load folders from JSON file."""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    self._folders = json.load(f)
                logger.info(f"Loaded {len(self._folders)} folders from {self.storage_path}")
            except Exception as e:
                logger.warning(f"Failed to load folders: {e}")
                self._folders = {}
    
    def _save(self) -> None:
        """Save folders to JSON file."""
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(self._folders, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save folders: {e}")
    
    def create_folder(self, folder: FolderEntity) -> FolderEntity:
        if folder.folder_id in self._folders:
            raise ValueError(f"Folder with ID {folder.folder_id} already exists")
        
        self._folders[folder.folder_id] = folder.to_dict()
        self._save()
        logger.debug(f"Created folder: {folder.path}")
        return folder
    
    def get_folder_by_id(self, folder_id: str) -> Optional[FolderEntity]:
        data = self._folders.get(folder_id)
        if data:
            return FolderEntity.from_dict(data)
        return None
    
    def get_folder_by_path(self, path: str, user_id: Optional[str] = None) -> Optional[FolderEntity]:
        for data in self._folders.values():
            if data.get('path') == path:
                if user_id is None or data.get('user_id') == user_id:
                    return FolderEntity.from_dict(data)
        return None
    
    def get_all_folders(self, user_id: Optional[str] = None) -> List[FolderEntity]:
        folders = []
        for data in self._folders.values():
            if user_id is None or data.get('user_id') == user_id:
                folders.append(FolderEntity.from_dict(data))
        return folders
    
    def get_folders_by_depth(self, depth: int, user_id: Optional[str] = None) -> List[FolderEntity]:
        folders = []
        for data in self._folders.values():
            if data.get('depth') == depth:
                if user_id is None or data.get('user_id') == user_id:
                    folders.append(FolderEntity.from_dict(data))
        return folders
    
    def update_folder(self, folder: FolderEntity) -> FolderEntity:
        if folder.folder_id not in self._folders:
            raise ValueError(f"Folder with ID {folder.folder_id} not found")
        
        folder.updated_at = datetime.utcnow()
        self._folders[folder.folder_id] = folder.to_dict()
        self._save()
        return folder
    
    def delete_folder(self, folder_id: str) -> bool:
        if folder_id in self._folders:
            del self._folders[folder_id]
            self._save()
            return True
        return False
    
    def increment_item_count(self, folder_id: str) -> None:
        if folder_id in self._folders:
            self._folders[folder_id]['item_count'] = self._folders[folder_id].get('item_count', 0) + 1
            self._save()
    
    def get_children(self, parent_id: str) -> List[FolderEntity]:
        children = []
        for data in self._folders.values():
            if data.get('parent_id') == parent_id:
                children.append(FolderEntity.from_dict(data))
        return children


class LocalJsonItemFolderRepository(ItemFolderRepository):
    """Local JSON file-based item-folder association repository."""
    
    def __init__(self, storage_path: Optional[Path] = None):
        config = get_config()
        self.storage_path = storage_path or config.output_dir / "item_folders.json"
        self._associations: Dict[str, Dict[str, Any]] = {}
        self._load()
    
    def _load(self) -> None:
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    self._associations = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load item associations: {e}")
                self._associations = {}
    
    def _save(self) -> None:
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(self._associations, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save item associations: {e}")
    
    def associate_item(
        self, 
        item_id: str, 
        folder_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        self._associations[item_id] = {
            'folder_id': folder_id,
            'metadata': metadata or {},
            'associated_at': datetime.utcnow().isoformat()
        }
        self._save()
    
    def get_folder_for_item(self, item_id: str) -> Optional[str]:
        assoc = self._associations.get(item_id)
        return assoc.get('folder_id') if assoc else None
    
    def get_items_in_folder(
        self, 
        folder_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[str]:
        items = [
            item_id 
            for item_id, assoc in self._associations.items()
            if assoc.get('folder_id') == folder_id
        ]
        return items[offset:offset + limit]
    
    def move_item(self, item_id: str, new_folder_id: str) -> bool:
        if item_id in self._associations:
            self._associations[item_id]['folder_id'] = new_folder_id
            self._associations[item_id]['moved_at'] = datetime.utcnow().isoformat()
            self._save()
            return True
        return False
    
    def remove_item(self, item_id: str) -> bool:
        if item_id in self._associations:
            del self._associations[item_id]
            self._save()
            return True
        return False


class LocalJsonTaxonomyStatsRepository(TaxonomyStatsRepository):
    """Local JSON file-based taxonomy statistics repository."""
    
    def __init__(self, storage_path: Optional[Path] = None):
        config = get_config()
        self.storage_path = storage_path or config.output_dir / "taxonomy_stats.json"
        self._stats: Dict[str, Any] = {
            'classifications': [],
            'folder_stats': {}
        }
        self._load()
    
    def _load(self) -> None:
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    self._stats = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load taxonomy stats: {e}")
    
    def _save(self) -> None:
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(self._stats, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save taxonomy stats: {e}")
    
    def record_classification(
        self,
        item_id: str,
        output: AutoFolderOutput
    ) -> None:
        record = {
            'item_id': item_id,
            'final_path': output.final_path,
            'confidence': output.confidence,
            'created_folders': output.created_folders,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self._stats['classifications'].append(record)
        
        # Keep only last 1000 classifications
        if len(self._stats['classifications']) > 1000:
            self._stats['classifications'] = self._stats['classifications'][-1000:]
        
        # Update folder stats
        path_parts = output.final_path.split('/')
        for i in range(len(path_parts)):
            partial_path = '/'.join(path_parts[:i+1])
            if partial_path not in self._stats['folder_stats']:
                self._stats['folder_stats'][partial_path] = {
                    'classification_count': 0,
                    'first_used': datetime.utcnow().isoformat(),
                    'last_used': None
                }
            self._stats['folder_stats'][partial_path]['classification_count'] += 1
            self._stats['folder_stats'][partial_path]['last_used'] = datetime.utcnow().isoformat()
        
        self._save()
    
    def get_folder_stats(
        self,
        folder_id: str
    ) -> Dict[str, Any]:
        return self._stats['folder_stats'].get(folder_id, {})
    
    def get_classification_history(
        self,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        return self._stats['classifications'][-limit:]


# ============================================
# PostgreSQL Implementation (Production Placeholder)
# ============================================

class PostgreSQLFolderRepository(FolderRepository):
    """
    PostgreSQL-based folder repository.
    
    This is a placeholder implementation that demonstrates the expected interface.
    In production, this would use asyncpg or SQLAlchemy with actual database connections.
    
    Expected table schema:
    
    CREATE TABLE folders (
        folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path VARCHAR(500) NOT NULL,
        label VARCHAR(100) NOT NULL,
        depth INTEGER NOT NULL,
        parent_id UUID REFERENCES folders(folder_id),
        aliases TEXT[] DEFAULT '{}',
        embedding_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        item_count INTEGER DEFAULT 0,
        is_seed BOOLEAN DEFAULT FALSE,
        user_id UUID,
        UNIQUE(path, user_id)
    );
    
    CREATE INDEX idx_folders_depth ON folders(depth);
    CREATE INDEX idx_folders_parent ON folders(parent_id);
    CREATE INDEX idx_folders_user ON folders(user_id);
    """
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        logger.info("PostgreSQL folder repository initialized (placeholder)")
        # In production:
        # self.pool = await asyncpg.create_pool(connection_string)
    
    def create_folder(self, folder: FolderEntity) -> FolderEntity:
        # Placeholder - would execute INSERT query
        logger.info(f"[PLACEHOLDER] Would create folder in PostgreSQL: {folder.path}")
        return folder
    
    def get_folder_by_id(self, folder_id: str) -> Optional[FolderEntity]:
        # Placeholder - would execute SELECT query
        logger.info(f"[PLACEHOLDER] Would fetch folder by ID from PostgreSQL: {folder_id}")
        return None
    
    def get_folder_by_path(self, path: str, user_id: Optional[str] = None) -> Optional[FolderEntity]:
        logger.info(f"[PLACEHOLDER] Would fetch folder by path from PostgreSQL: {path}")
        return None
    
    def get_all_folders(self, user_id: Optional[str] = None) -> List[FolderEntity]:
        logger.info("[PLACEHOLDER] Would fetch all folders from PostgreSQL")
        return []
    
    def get_folders_by_depth(self, depth: int, user_id: Optional[str] = None) -> List[FolderEntity]:
        logger.info(f"[PLACEHOLDER] Would fetch folders by depth from PostgreSQL: {depth}")
        return []
    
    def update_folder(self, folder: FolderEntity) -> FolderEntity:
        logger.info(f"[PLACEHOLDER] Would update folder in PostgreSQL: {folder.path}")
        return folder
    
    def delete_folder(self, folder_id: str) -> bool:
        logger.info(f"[PLACEHOLDER] Would delete folder from PostgreSQL: {folder_id}")
        return True
    
    def increment_item_count(self, folder_id: str) -> None:
        logger.info(f"[PLACEHOLDER] Would increment item count in PostgreSQL: {folder_id}")
    
    def get_children(self, parent_id: str) -> List[FolderEntity]:
        logger.info(f"[PLACEHOLDER] Would fetch children from PostgreSQL: {parent_id}")
        return []


class PgVectorEmbeddingRepository(EmbeddingRepository):
    """
    PostgreSQL with pgvector extension for embedding storage.
    
    This is a placeholder implementation. In production, use the pgvector extension.
    
    Expected table schema:
    
    CREATE EXTENSION IF NOT EXISTS vector;
    
    CREATE TABLE embeddings (
        embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id UUID NOT NULL,
        entity_type VARCHAR(50) NOT NULL,  -- 'folder' or 'item'
        embedding vector(768),  -- Adjust dimension based on model
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    CREATE INDEX idx_embeddings_entity ON embeddings(entity_id, entity_type);
    """
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        logger.info("pgvector embedding repository initialized (placeholder)")
    
    def store_embedding(
        self,
        entity_id: str,
        entity_type: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        embedding_id = str(uuid.uuid4())
        logger.info(f"[PLACEHOLDER] Would store embedding in pgvector: {entity_id} ({entity_type})")
        return embedding_id
    
    def get_embedding(self, embedding_id: str) -> Optional[Tuple[List[float], Dict[str, Any]]]:
        logger.info(f"[PLACEHOLDER] Would fetch embedding from pgvector: {embedding_id}")
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
        In production, this would execute:
        
        SELECT 
            embedding_id,
            1 - (embedding <=> $1::vector) as similarity,
            metadata
        FROM embeddings
        WHERE entity_type = $2
            AND 1 - (embedding <=> $1::vector) >= $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4;
        """
        logger.info(f"[PLACEHOLDER] Would search similar embeddings in pgvector: {entity_type}")
        return []
    
    def delete_embedding(self, embedding_id: str) -> bool:
        logger.info(f"[PLACEHOLDER] Would delete embedding from pgvector: {embedding_id}")
        return True


# ============================================
# Database Factory
# ============================================

class Database:
    """Main database access class that provides all repositories."""
    
    def __init__(self, config: Optional[DatabaseConfig] = None):
        self.config = config or get_config().database
        self._folder_repo: Optional[FolderRepository] = None
        self._item_folder_repo: Optional[ItemFolderRepository] = None
        self._embedding_repo: Optional[EmbeddingRepository] = None
        self._stats_repo: Optional[TaxonomyStatsRepository] = None
        self._supabase_client = None
    
    def _get_supabase_client(self):
        """Lazy-load Supabase client."""
        if self._supabase_client is None:
            try:
                from .supabase_client import get_supabase_client
                self._supabase_client = get_supabase_client()
            except ImportError as e:
                logger.error(f"Supabase not available: {e}")
                raise
        return self._supabase_client
    
    @property
    def folders(self) -> FolderRepository:
        """Get the folder repository."""
        if self._folder_repo is None:
            backend = self.config.backend
            
            if backend == 'supabase':
                # Use Supabase
                from .supabase_client import SupabaseFolderRepository
                self._folder_repo = SupabaseFolderRepository(self._get_supabase_client())
                logger.info("Using Supabase folder repository")
            elif backend == 'postgres':
                # Use direct PostgreSQL
                self._folder_repo = PostgreSQLFolderRepository(self.config.connection_string)
                logger.info("Using PostgreSQL folder repository")
            else:
                # Default to local JSON storage
                self._folder_repo = LocalJsonFolderRepository()
                logger.info("Using local JSON folder repository")
        
        return self._folder_repo
    
    @property
    def item_folders(self) -> ItemFolderRepository:
        """Get the item-folder association repository."""
        if self._item_folder_repo is None:
            backend = self.config.backend
            
            if backend == 'supabase':
                from .supabase_client import SupabaseItemFolderRepository
                self._item_folder_repo = SupabaseItemFolderRepository(self._get_supabase_client())
            else:
                self._item_folder_repo = LocalJsonItemFolderRepository()
        
        return self._item_folder_repo
    
    @property
    def stats(self) -> TaxonomyStatsRepository:
        """Get the taxonomy statistics repository."""
        if self._stats_repo is None:
            backend = self.config.backend
            
            if backend == 'supabase':
                from .supabase_client import SupabaseTaxonomyStatsRepository
                self._stats_repo = SupabaseTaxonomyStatsRepository(self._get_supabase_client())
            else:
                self._stats_repo = LocalJsonTaxonomyStatsRepository()
        
        return self._stats_repo
    
    def initialize(self) -> None:
        """Initialize database connections and schema."""
        backend = self.config.backend
        
        if backend == 'supabase':
            # Verify Supabase connection
            try:
                client = self._get_supabase_client()
                logger.info("Supabase database initialized and connected")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase: {e}")
                raise
        else:
            logger.info(f"Database initialized with backend: {backend}")
    
    def close(self) -> None:
        """Close database connections."""
        if self._supabase_client is not None:
            try:
                from .supabase_client import SupabaseClient
                SupabaseClient().close()
            except:
                pass
        
        logger.info("Database connections closed")


# ============================================
# Global Instance
# ============================================

_database: Optional[Database] = None


def get_database() -> Database:
    """Get the global database instance."""
    global _database
    if _database is None:
        _database = Database()
    return _database


def initialize_database() -> Database:
    """Initialize and return the database."""
    db = get_database()
    db.initialize()
    return db
