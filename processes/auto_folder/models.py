"""
Data Models for Auto-Folder System

Contains Pydantic models and dataclasses for:
- Input items (raw data from downloader)
- Taxonomy structures (domain/subdomain/leaf)
- Folder entities (database-ready)
- Matching results
- Final output format
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import uuid
import json


# ============================================
# Enums
# ============================================

class FolderDepth(Enum):
    """Folder hierarchy depth levels."""
    DOMAIN = 1
    SUBDOMAIN = 2
    LEAF = 3


class MatchAction(Enum):
    """Actions to take based on folder matching."""
    REUSE_EXISTING = "reuse_existing"
    CREATE_NEW = "create_new"
    ATTACH_AS_CHILD = "attach_as_child"
    SKIP = "skip"


class ItemSourceType(Enum):
    """Source types for saved items."""
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    YOUTUBE = "youtube"
    WEB = "web"
    LOCAL_FILE = "local_file"
    MANUAL = "manual"
    UNKNOWN = "unknown"


# ============================================
# Input Models
# ============================================

@dataclass
class ItemInput:
    """
    Input item to be categorized.
    This is what comes from the downloader.py output.
    """
    item_id: str
    raw_topic: str
    summary: str
    
    # Optional enrichment fields
    source_app: Optional[str] = None
    url: Optional[str] = None
    domain: Optional[str] = None  # URL domain, not folder domain
    user_note: Optional[str] = None
    timestamp: Optional[datetime] = None
    entities: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    
    # Raw content reference
    content_path: Optional[str] = None
    media_type: Optional[str] = None  # 'video', 'image', 'document', 'text'
    
    def __post_init__(self):
        if not self.item_id:
            self.item_id = str(uuid.uuid4())
        if not self.timestamp:
            self.timestamp = datetime.utcnow()
    
    @classmethod
    def from_downloader_output(cls, output_dir: str) -> "ItemInput":
        """
        Create ItemInput from downloader.py output directory.
        
        Args:
            output_dir: Path to the output directory containing topic.txt and summary.txt
        """
        from pathlib import Path
        
        out_path = Path(output_dir)
        
        # Read topic
        topic_path = out_path / "topic.txt"
        raw_topic = ""
        if topic_path.exists():
            raw_topic = topic_path.read_text(encoding='utf-8').strip()
        
        # Read summary
        summary_path = out_path / "summary.txt"
        summary = ""
        if summary_path.exists():
            summary = summary_path.read_text(encoding='utf-8').strip()
        
        # Determine source from directory name
        dir_name = out_path.name.lower()
        source_app = None
        if "tiktok" in dir_name:
            source_app = ItemSourceType.TIKTOK.value
        elif "instagram" in dir_name:
            source_app = ItemSourceType.INSTAGRAM.value
        elif "twitter" in dir_name:
            source_app = ItemSourceType.TWITTER.value
        elif "youtube" in dir_name:
            source_app = ItemSourceType.YOUTUBE.value
        
        return cls(
            item_id=str(uuid.uuid4()),
            raw_topic=raw_topic,
            summary=summary,
            source_app=source_app,
            content_path=str(out_path)
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "item_id": self.item_id,
            "raw_topic": self.raw_topic,
            "summary": self.summary,
            "source_app": self.source_app,
            "url": self.url,
            "domain": self.domain,
            "user_note": self.user_note,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "entities": self.entities,
            "keywords": self.keywords,
            "content_path": self.content_path,
            "media_type": self.media_type
        }


# ============================================
# Taxonomy Models
# ============================================

@dataclass
class LabelWithAliases:
    """A label with its aliases for search/matching."""
    label: str
    aliases: List[str] = field(default_factory=list)
    optional: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "aliases": self.aliases,
            "optional": self.optional
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LabelWithAliases":
        return cls(
            label=data.get("label", ""),
            aliases=data.get("aliases", []),
            optional=data.get("optional", False)
        )


@dataclass
class TaxonomyCandidate:
    """
    Generated taxonomy candidate from LLM analysis.
    This is the output of the taxonomy generation step.
    """
    domain: LabelWithAliases
    subdomain: LabelWithAliases
    leaf_topic: Optional[LabelWithAliases] = None
    
    tags: List[str] = field(default_factory=list)
    confidence: float = 0.0
    rationale: str = ""
    
    def get_full_path(self, include_leaf: bool = True) -> str:
        """Get the full folder path string."""
        parts = [self.domain.label, self.subdomain.label]
        if include_leaf and self.leaf_topic and not self.leaf_topic.optional:
            parts.append(self.leaf_topic.label)
        return "/".join(parts)
    
    def get_search_text(self, level: FolderDepth) -> str:
        """Get text for embedding/matching at a specific level."""
        if level == FolderDepth.DOMAIN:
            return self.domain.label
        elif level == FolderDepth.SUBDOMAIN:
            return f"{self.domain.label} > {self.subdomain.label}"
        elif level == FolderDepth.LEAF and self.leaf_topic:
            return f"{self.domain.label} > {self.subdomain.label} > {self.leaf_topic.label}"
        return ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "domain": self.domain.to_dict(),
            "subdomain": self.subdomain.to_dict(),
            "leaf_topic": self.leaf_topic.to_dict() if self.leaf_topic else None,
            "tags": self.tags,
            "confidence": self.confidence,
            "rationale": self.rationale
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TaxonomyCandidate":
        return cls(
            domain=LabelWithAliases.from_dict(data.get("domain", {})),
            subdomain=LabelWithAliases.from_dict(data.get("subdomain", {})),
            leaf_topic=LabelWithAliases.from_dict(data["leaf_topic"]) if data.get("leaf_topic") else None,
            tags=data.get("tags", []),
            confidence=data.get("confidence", 0.0),
            rationale=data.get("rationale", "")
        )


# ============================================
# Folder Models
# ============================================

@dataclass
class FolderEntity:
    """
    Database-ready folder entity.
    Represents a folder in the hierarchy.
    """
    folder_id: str
    path: str  # Full path like "Health & Fitness/Weight Loss"
    label: str  # Just this folder's name
    depth: int  # 1 = domain, 2 = subdomain, 3 = leaf
    
    parent_id: Optional[str] = None
    aliases: List[str] = field(default_factory=list)
    embedding_id: Optional[str] = None
    embedding: Optional[List[float]] = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    item_count: int = 0
    is_seed: bool = False
    user_id: Optional[str] = None
    
    def __post_init__(self):
        if not self.folder_id:
            self.folder_id = str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "folder_id": self.folder_id,
            "path": self.path,
            "label": self.label,
            "depth": self.depth,
            "parent_id": self.parent_id,
            "aliases": self.aliases,
            "embedding_id": self.embedding_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "item_count": self.item_count,
            "is_seed": self.is_seed,
            "user_id": self.user_id
        }
    
    def to_db_record(self) -> Dict[str, Any]:
        """Convert to database record format."""
        record = self.to_dict()
        # Don't include embedding in main record (stored separately)
        return record
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FolderEntity":
        return cls(
            folder_id=data.get("folder_id", str(uuid.uuid4())),
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


@dataclass
class ExistingFolder:
    """Simplified folder representation for matching."""
    folder_id: str
    path: str
    embedding_id: Optional[str] = None
    embedding: Optional[List[float]] = None
    item_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "folder_id": self.folder_id,
            "path": self.path,
            "embedding_id": self.embedding_id,
            "item_count": self.item_count
        }


# ============================================
# Matching Results
# ============================================

@dataclass
class MatchResult:
    """Result of matching at a single folder level."""
    level: FolderDepth
    action: MatchAction
    
    matched_folder: Optional[FolderEntity] = None
    new_folder: Optional[FolderEntity] = None
    similarity_score: float = 0.0
    
    label_used: str = ""
    notes: str = ""
    
    def get_folder(self) -> Optional[FolderEntity]:
        """Get the folder to use (either matched or new)."""
        return self.matched_folder or self.new_folder
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level.name,
            "action": self.action.value,
            "matched_folder": self.matched_folder.to_dict() if self.matched_folder else None,
            "new_folder": self.new_folder.to_dict() if self.new_folder else None,
            "similarity_score": self.similarity_score,
            "label_used": self.label_used,
            "notes": self.notes
        }


@dataclass
class HierarchicalMatch:
    """Complete hierarchical matching result."""
    domain_result: MatchResult
    subdomain_result: MatchResult
    leaf_result: Optional[MatchResult] = None
    
    def get_final_path(self) -> str:
        """Get the final folder path."""
        parts = []
        
        domain_folder = self.domain_result.get_folder()
        if domain_folder:
            parts.append(domain_folder.label)
        
        subdomain_folder = self.subdomain_result.get_folder()
        if subdomain_folder:
            parts.append(subdomain_folder.label)
        
        if self.leaf_result:
            leaf_folder = self.leaf_result.get_folder()
            if leaf_folder and self.leaf_result.action != MatchAction.SKIP:
                parts.append(leaf_folder.label)
        
        return "/".join(parts)
    
    def get_created_folders(self) -> List[FolderEntity]:
        """Get list of newly created folders."""
        created = []
        
        if self.domain_result.action == MatchAction.CREATE_NEW and self.domain_result.new_folder:
            created.append(self.domain_result.new_folder)
        
        if self.subdomain_result.action in [MatchAction.CREATE_NEW, MatchAction.ATTACH_AS_CHILD]:
            if self.subdomain_result.new_folder:
                created.append(self.subdomain_result.new_folder)
        
        if self.leaf_result and self.leaf_result.action in [MatchAction.CREATE_NEW, MatchAction.ATTACH_AS_CHILD]:
            if self.leaf_result.new_folder:
                created.append(self.leaf_result.new_folder)
        
        return created
    
    def get_reused_folders(self) -> List[FolderEntity]:
        """Get list of reused folders."""
        reused = []
        
        if self.domain_result.action == MatchAction.REUSE_EXISTING and self.domain_result.matched_folder:
            reused.append(self.domain_result.matched_folder)
        
        if self.subdomain_result.action == MatchAction.REUSE_EXISTING and self.subdomain_result.matched_folder:
            reused.append(self.subdomain_result.matched_folder)
        
        if self.leaf_result and self.leaf_result.action == MatchAction.REUSE_EXISTING:
            if self.leaf_result.matched_folder:
                reused.append(self.leaf_result.matched_folder)
        
        return reused
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "domain_result": self.domain_result.to_dict(),
            "subdomain_result": self.subdomain_result.to_dict(),
            "leaf_result": self.leaf_result.to_dict() if self.leaf_result else None,
            "final_path": self.get_final_path()
        }


# ============================================
# Final Output Model
# ============================================

@dataclass
class AutoFolderOutput:
    """
    Final output of the auto-folder system.
    This is the JSON that gets returned/stored.
    """
    item_id: str
    final_path: str
    
    created_folders: List[str] = field(default_factory=list)
    reused_folders: List[str] = field(default_factory=list)
    
    applied_labels: Dict[str, Optional[str]] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    
    similarity_scores: Dict[str, float] = field(default_factory=dict)
    confidence: float = 0.0
    notes: str = ""
    
    # Processing metadata
    processed_at: datetime = field(default_factory=datetime.utcnow)
    processing_time_ms: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "item_id": self.item_id,
            "final_path": self.final_path,
            "created_folders": self.created_folders,
            "reused_folders": self.reused_folders,
            "applied_labels": self.applied_labels,
            "tags": self.tags,
            "similarity_scores": self.similarity_scores,
            "confidence": self.confidence,
            "notes": self.notes,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "processing_time_ms": self.processing_time_ms
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
    
    @classmethod
    def from_hierarchical_match(
        cls,
        item_id: str,
        match: HierarchicalMatch,
        taxonomy: TaxonomyCandidate,
        processing_time_ms: int = 0
    ) -> "AutoFolderOutput":
        """Create output from hierarchical match result."""
        
        created = [f.path for f in match.get_created_folders()]
        reused = [f.path for f in match.get_reused_folders()]
        
        applied_labels = {
            "domain": match.domain_result.label_used,
            "subdomain": match.subdomain_result.label_used,
            "leaf_topic": match.leaf_result.label_used if match.leaf_result else None
        }
        
        similarity_scores = {
            "domain_best": match.domain_result.similarity_score,
            "subdomain_best": match.subdomain_result.similarity_score,
            "leaf_best": match.leaf_result.similarity_score if match.leaf_result else 0.0
        }
        
        notes_parts = []
        if match.domain_result.notes:
            notes_parts.append(match.domain_result.notes)
        if match.subdomain_result.notes:
            notes_parts.append(match.subdomain_result.notes)
        if match.leaf_result and match.leaf_result.notes:
            notes_parts.append(match.leaf_result.notes)
        
        return cls(
            item_id=item_id,
            final_path=match.get_final_path(),
            created_folders=created,
            reused_folders=reused,
            applied_labels=applied_labels,
            tags=taxonomy.tags,
            similarity_scores=similarity_scores,
            confidence=taxonomy.confidence,
            notes="; ".join(notes_parts) if notes_parts else taxonomy.rationale,
            processing_time_ms=processing_time_ms
        )


# ============================================
# Batch Processing Models
# ============================================

@dataclass
class BatchInput:
    """Input for batch processing multiple items."""
    items: List[ItemInput]
    existing_folders: List[ExistingFolder] = field(default_factory=list)
    user_id: Optional[str] = None


@dataclass
class BatchOutput:
    """Output from batch processing."""
    results: List[AutoFolderOutput]
    total_items: int = 0
    successful: int = 0
    failed: int = 0
    
    new_folders_created: int = 0
    folders_reused: int = 0
    
    processing_time_ms: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "results": [r.to_dict() for r in self.results],
            "total_items": self.total_items,
            "successful": self.successful,
            "failed": self.failed,
            "new_folders_created": self.new_folders_created,
            "folders_reused": self.folders_reused,
            "processing_time_ms": self.processing_time_ms
        }
