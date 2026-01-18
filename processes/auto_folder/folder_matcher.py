"""
Folder Matcher for Auto-Folder System

Handles:
- Hierarchical folder matching (domain -> subdomain -> leaf)
- Vector similarity search against existing folders
- Decision logic for reuse vs create
- Sanity checks and guardrails
"""

import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Tuple, Set
import re

from .config import get_config, ThresholdConfig, SEED_DOMAINS, ALIAS_MAP
from .models import (
    TaxonomyCandidate,
    FolderEntity,
    ExistingFolder,
    FolderDepth,
    MatchAction,
    MatchResult,
    HierarchicalMatch,
    LabelWithAliases
)
from .embedding_service import (
    get_embedding_service,
    get_vector_store,
    EmbeddingService,
    VectorStore
)

# Setup logging
logger = logging.getLogger(__name__)


class FolderMatcher:
    """
    Matches taxonomy candidates to existing folders using
    vector similarity and hierarchical decision logic.
    """
    
    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStore] = None,
        thresholds: Optional[ThresholdConfig] = None
    ):
        """Initialize the folder matcher."""
        self.embedding_service = embedding_service or get_embedding_service()
        self.vector_store = vector_store or get_vector_store()
        self.thresholds = thresholds or get_config().thresholds
        
        # Cache for loaded folders
        self._folder_cache: Dict[str, FolderEntity] = {}
        self._folders_by_depth: Dict[int, List[FolderEntity]] = {1: [], 2: [], 3: []}
    
    def load_existing_folders(self, folders: List[ExistingFolder]) -> None:
        """
        Load existing folders into the matcher.
        
        Args:
            folders: List of existing folders with embeddings
        """
        for folder in folders:
            # Determine depth from path
            depth = len(folder.path.split('/'))
            
            entity = FolderEntity(
                folder_id=folder.folder_id,
                path=folder.path,
                label=folder.path.split('/')[-1],
                depth=depth,
                embedding_id=folder.embedding_id,
                embedding=folder.embedding,
                item_count=folder.item_count
            )
            
            self._folder_cache[folder.folder_id] = entity
            
            if depth <= 3:
                self._folders_by_depth[depth].append(entity)
        
        logger.info(
            f"Loaded {len(folders)} folders: "
            f"{len(self._folders_by_depth[1])} domains, "
            f"{len(self._folders_by_depth[2])} subdomains, "
            f"{len(self._folders_by_depth[3])} leaves"
        )
    
    def load_folders_from_store(self) -> None:
        """Load folders from vector store."""
        vectors = self.vector_store.get_all_vectors()
        
        folders = []
        for vector_id, (embedding, metadata) in vectors.items():
            if metadata.get('type') == 'folder':
                folders.append(ExistingFolder(
                    folder_id=metadata.get('folder_id', vector_id),
                    path=metadata.get('path', ''),
                    embedding_id=vector_id,
                    embedding=embedding,
                    item_count=metadata.get('item_count', 0)
                ))
        
        self.load_existing_folders(folders)
    
    def initialize_seed_folders(self) -> List[FolderEntity]:
        """
        Initialize the seed taxonomy folders.
        Creates folder entities and embeddings for all seed domains/subdomains.
        
        Returns:
            List of created seed folders
        """
        created_folders = []
        
        for domain in SEED_DOMAINS:
            # Create domain folder
            domain_entity = FolderEntity(
                folder_id=str(uuid.uuid4()),
                path=domain["label"],
                label=domain["label"],
                depth=1,
                aliases=domain.get("aliases", []),
                is_seed=True
            )
            
            # Generate and store embedding
            try:
                embedding = self.embedding_service.generate_embedding(domain["label"])
                embedding_id = f"folder_{domain_entity.folder_id}"
                
                self.vector_store.add_vector(
                    vector_id=embedding_id,
                    embedding=embedding,
                    metadata={
                        'type': 'folder',
                        'folder_id': domain_entity.folder_id,
                        'path': domain_entity.path,
                        'depth': 1,
                        'is_seed': True
                    }
                )
                
                domain_entity.embedding_id = embedding_id
                domain_entity.embedding = embedding
                
            except Exception as e:
                logger.warning(f"Failed to create embedding for domain {domain['label']}: {e}")
            
            created_folders.append(domain_entity)
            self._folder_cache[domain_entity.folder_id] = domain_entity
            self._folders_by_depth[1].append(domain_entity)
            
            # Create subdomain folders
            for subdomain in domain.get("subdomains", []):
                subdomain_path = f"{domain['label']}/{subdomain['label']}"
                subdomain_entity = FolderEntity(
                    folder_id=str(uuid.uuid4()),
                    path=subdomain_path,
                    label=subdomain["label"],
                    depth=2,
                    parent_id=domain_entity.folder_id,
                    aliases=subdomain.get("aliases", []),
                    is_seed=True
                )
                
                # Generate and store embedding
                try:
                    # Use hierarchical embedding text
                    embed_text = f"{domain['label']} > {subdomain['label']}"
                    embedding = self.embedding_service.generate_embedding(embed_text)
                    embedding_id = f"folder_{subdomain_entity.folder_id}"
                    
                    self.vector_store.add_vector(
                        vector_id=embedding_id,
                        embedding=embedding,
                        metadata={
                            'type': 'folder',
                            'folder_id': subdomain_entity.folder_id,
                            'path': subdomain_entity.path,
                            'depth': 2,
                            'parent_id': domain_entity.folder_id,
                            'is_seed': True
                        }
                    )
                    
                    subdomain_entity.embedding_id = embedding_id
                    subdomain_entity.embedding = embedding
                    
                except Exception as e:
                    logger.warning(f"Failed to create embedding for subdomain {subdomain_path}: {e}")
                
                created_folders.append(subdomain_entity)
                self._folder_cache[subdomain_entity.folder_id] = subdomain_entity
                self._folders_by_depth[2].append(subdomain_entity)
        
        logger.info(f"Initialized {len(created_folders)} seed folders")
        return created_folders
    
    def _extract_keywords(self, text: str) -> Set[str]:
        """Extract keywords from text for sanity checking."""
        # Normalize and split
        text = text.lower()
        words = re.findall(r'\b\w+\b', text)
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = {w for w in words if len(w) > 2 and w not in stop_words}
        
        return keywords
    
    def _keyword_overlap(self, text_a: str, text_b: str) -> float:
        """Calculate keyword overlap ratio between two texts."""
        keywords_a = self._extract_keywords(text_a)
        keywords_b = self._extract_keywords(text_b)
        
        if not keywords_a or not keywords_b:
            return 0.0
        
        intersection = keywords_a & keywords_b
        union = keywords_a | keywords_b
        
        return len(intersection) / len(union) if union else 0.0
    
    def _sanity_check(
        self,
        candidate_label: str,
        matched_label: str,
        similarity: float
    ) -> bool:
        """
        Perform sanity check to prevent false matches.
        Returns True if the match is valid.
        """
        # If similarity is very high, trust it
        if similarity > 0.95:
            return True
        
        # Check keyword overlap
        overlap = self._keyword_overlap(candidate_label, matched_label)
        
        # If high similarity but no keyword overlap, be suspicious
        if similarity > 0.85 and overlap < self.thresholds.min_keyword_overlap:
            logger.warning(
                f"Sanity check failed: {candidate_label} vs {matched_label} "
                f"(sim={similarity:.2f}, overlap={overlap:.2f})"
            )
            return False
        
        # Check for obviously wrong matches (different domains)
        # These are common false positive patterns
        false_positive_pairs = [
            ("cooking", "computer"),
            ("health", "computer"),
            ("finance", "fitness"),
            ("travel", "technology"),
        ]
        
        label_a_lower = candidate_label.lower()
        label_b_lower = matched_label.lower()
        
        for pair in false_positive_pairs:
            if (pair[0] in label_a_lower and pair[1] in label_b_lower) or \
               (pair[1] in label_a_lower and pair[0] in label_b_lower):
                logger.warning(f"Sanity check: rejecting likely false positive {candidate_label} vs {matched_label}")
                return False
        
        return True
    
    def _find_best_match(
        self,
        search_text: str,
        depth: int,
        parent_id: Optional[str] = None,
        threshold: float = 0.8
    ) -> Tuple[Optional[FolderEntity], float]:
        """
        Find the best matching folder at a given depth.
        
        Args:
            search_text: Text to search for
            depth: Folder depth level
            parent_id: Optional parent folder ID for subdomain/leaf searches
            threshold: Minimum similarity threshold
            
        Returns:
            Tuple of (matched_folder, similarity_score)
        """
        # Generate embedding for search text
        try:
            query_embedding = self.embedding_service.generate_embedding(search_text)
        except Exception as e:
            logger.error(f"Failed to generate embedding for search: {e}")
            return None, 0.0
        
        # Build filter
        filter_metadata = {'type': 'folder', 'depth': depth}
        if parent_id:
            filter_metadata['parent_id'] = parent_id
        
        # Search vector store
        results = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=5,
            filter_metadata=filter_metadata
        )
        
        # Also search in-memory cache if vector store returns few results
        if len(results) < 3:
            candidates = self._folders_by_depth.get(depth, [])
            
            if parent_id:
                candidates = [f for f in candidates if f.parent_id == parent_id]
            
            for folder in candidates:
                if folder.embedding:
                    try:
                        score = self.embedding_service.cosine_similarity(
                            query_embedding, folder.embedding
                        )
                        # Add to results if not already present
                        if not any(r[0] == folder.embedding_id for r in results):
                            results.append((folder.embedding_id, score, {
                                'folder_id': folder.folder_id,
                                'path': folder.path
                            }))
                    except Exception:
                        pass
        
        # Sort and filter
        results.sort(key=lambda x: x[1], reverse=True)
        
        best_match = None
        best_score = 0.0
        
        for embedding_id, score, metadata in results:
            if score < threshold:
                continue
            
            folder_id = metadata.get('folder_id')
            folder = self._folder_cache.get(folder_id)
            
            if not folder:
                # Try to reconstruct from metadata
                path = metadata.get('path', '')
                if path:
                    folder = FolderEntity(
                        folder_id=folder_id or str(uuid.uuid4()),
                        path=path,
                        label=path.split('/')[-1],
                        depth=depth,
                        embedding_id=embedding_id
                    )
            
            if folder:
                # Sanity check
                if self._sanity_check(search_text, folder.path, score):
                    best_match = folder
                    best_score = score
                    break
        
        return best_match, best_score
    
    def _create_folder(
        self,
        label: str,
        depth: int,
        parent: Optional[FolderEntity] = None,
        aliases: List[str] = None
    ) -> FolderEntity:
        """Create a new folder entity."""
        if parent:
            path = f"{parent.path}/{label}"
        else:
            path = label
        
        folder = FolderEntity(
            folder_id=str(uuid.uuid4()),
            path=path,
            label=label,
            depth=depth,
            parent_id=parent.folder_id if parent else None,
            aliases=aliases or [],
            is_seed=False
        )
        
        # Generate and store embedding
        try:
            embed_text = path.replace('/', ' > ')
            embedding = self.embedding_service.generate_embedding(embed_text)
            embedding_id = f"folder_{folder.folder_id}"
            
            self.vector_store.add_vector(
                vector_id=embedding_id,
                embedding=embedding,
                metadata={
                    'type': 'folder',
                    'folder_id': folder.folder_id,
                    'path': folder.path,
                    'depth': depth,
                    'parent_id': folder.parent_id,
                    'is_seed': False
                }
            )
            
            folder.embedding_id = embedding_id
            folder.embedding = embedding
            
        except Exception as e:
            logger.warning(f"Failed to create embedding for new folder {path}: {e}")
        
        # Add to cache
        self._folder_cache[folder.folder_id] = folder
        if depth <= 3:
            self._folders_by_depth[depth].append(folder)
        
        logger.info(f"Created new folder: {path}")
        return folder
    
    def match_domain(self, candidate: TaxonomyCandidate) -> MatchResult:
        """
        Match or create domain (top-level) folder.
        
        Args:
            candidate: Taxonomy candidate with domain info
            
        Returns:
            MatchResult for domain level
        """
        search_text = candidate.domain.label
        threshold = self.thresholds.domain_threshold
        
        # Try to find existing match
        matched_folder, similarity = self._find_best_match(
            search_text=search_text,
            depth=1,
            threshold=threshold
        )
        
        if matched_folder:
            return MatchResult(
                level=FolderDepth.DOMAIN,
                action=MatchAction.REUSE_EXISTING,
                matched_folder=matched_folder,
                similarity_score=similarity,
                label_used=matched_folder.label,
                notes=f"Reused existing domain '{matched_folder.label}' (similarity: {similarity:.2f})"
            )
        
        # Create new domain
        new_folder = self._create_folder(
            label=candidate.domain.label,
            depth=1,
            aliases=candidate.domain.aliases
        )
        
        return MatchResult(
            level=FolderDepth.DOMAIN,
            action=MatchAction.CREATE_NEW,
            new_folder=new_folder,
            similarity_score=0.0,
            label_used=new_folder.label,
            notes=f"Created new domain '{new_folder.label}'"
        )
    
    def match_subdomain(
        self,
        candidate: TaxonomyCandidate,
        domain_result: MatchResult
    ) -> MatchResult:
        """
        Match or create subdomain folder under domain.
        
        Args:
            candidate: Taxonomy candidate with subdomain info
            domain_result: Result from domain matching
            
        Returns:
            MatchResult for subdomain level
        """
        domain_folder = domain_result.get_folder()
        if not domain_folder:
            raise ValueError("Domain folder required for subdomain matching")
        
        # Search text includes domain for better context
        search_text = f"{domain_folder.label} > {candidate.subdomain.label}"
        threshold = self.thresholds.subdomain_threshold
        
        # First try to find under specific domain
        matched_folder, similarity = self._find_best_match(
            search_text=search_text,
            depth=2,
            parent_id=domain_folder.folder_id,
            threshold=threshold
        )
        
        if matched_folder:
            return MatchResult(
                level=FolderDepth.SUBDOMAIN,
                action=MatchAction.REUSE_EXISTING,
                matched_folder=matched_folder,
                similarity_score=similarity,
                label_used=matched_folder.label,
                notes=f"Reused existing subdomain '{matched_folder.label}' (similarity: {similarity:.2f})"
            )
        
        # Try global search at depth 2 (might find similar subdomain under different domain)
        matched_folder, similarity = self._find_best_match(
            search_text=candidate.subdomain.label,
            depth=2,
            threshold=threshold
        )
        
        if matched_folder and similarity > threshold + 0.05:
            # Found similar elsewhere, but we want to create under our domain
            logger.info(f"Found similar subdomain '{matched_folder.label}' under different domain")
        
        # Create new subdomain under domain
        new_folder = self._create_folder(
            label=candidate.subdomain.label,
            depth=2,
            parent=domain_folder,
            aliases=candidate.subdomain.aliases
        )
        
        return MatchResult(
            level=FolderDepth.SUBDOMAIN,
            action=MatchAction.ATTACH_AS_CHILD,
            new_folder=new_folder,
            similarity_score=0.0,
            label_used=new_folder.label,
            notes=f"Created subdomain '{new_folder.label}' under '{domain_folder.label}'"
        )
    
    def match_leaf(
        self,
        candidate: TaxonomyCandidate,
        subdomain_result: MatchResult
    ) -> Optional[MatchResult]:
        """
        Match or create leaf folder (optional third level).
        
        Args:
            candidate: Taxonomy candidate with leaf info
            subdomain_result: Result from subdomain matching
            
        Returns:
            MatchResult for leaf level, or None if leaf should be skipped
        """
        # Check if leaf topic exists and should be created
        if not candidate.leaf_topic:
            return None
        
        # Check confidence threshold
        if candidate.leaf_topic.optional and candidate.confidence < self.thresholds.leaf_confidence_threshold:
            return MatchResult(
                level=FolderDepth.LEAF,
                action=MatchAction.SKIP,
                similarity_score=0.0,
                label_used=candidate.leaf_topic.label,
                notes=f"Skipped leaf topic - confidence too low ({candidate.confidence:.2f})"
            )
        
        subdomain_folder = subdomain_result.get_folder()
        if not subdomain_folder:
            return None
        
        # Search text includes full path
        search_text = f"{subdomain_folder.path} > {candidate.leaf_topic.label}"
        threshold = self.thresholds.leaf_threshold
        
        # Try to find existing leaf
        matched_folder, similarity = self._find_best_match(
            search_text=search_text,
            depth=3,
            parent_id=subdomain_folder.folder_id,
            threshold=threshold
        )
        
        if matched_folder:
            return MatchResult(
                level=FolderDepth.LEAF,
                action=MatchAction.REUSE_EXISTING,
                matched_folder=matched_folder,
                similarity_score=similarity,
                label_used=matched_folder.label,
                notes=f"Reused existing leaf '{matched_folder.label}' (similarity: {similarity:.2f})"
            )
        
        # Check max depth
        if subdomain_folder.depth >= self.thresholds.max_depth:
            return MatchResult(
                level=FolderDepth.LEAF,
                action=MatchAction.SKIP,
                similarity_score=0.0,
                label_used=candidate.leaf_topic.label,
                notes=f"Skipped leaf - max depth {self.thresholds.max_depth} reached"
            )
        
        # For optional leaves, skip unless very confident
        if candidate.leaf_topic.optional:
            return MatchResult(
                level=FolderDepth.LEAF,
                action=MatchAction.SKIP,
                similarity_score=0.0,
                label_used=candidate.leaf_topic.label,
                notes="Skipped optional leaf topic - stored as tag instead"
            )
        
        # Create new leaf folder
        new_folder = self._create_folder(
            label=candidate.leaf_topic.label,
            depth=3,
            parent=subdomain_folder,
            aliases=candidate.leaf_topic.aliases
        )
        
        return MatchResult(
            level=FolderDepth.LEAF,
            action=MatchAction.ATTACH_AS_CHILD,
            new_folder=new_folder,
            similarity_score=0.0,
            label_used=new_folder.label,
            notes=f"Created leaf folder '{new_folder.label}' under '{subdomain_folder.label}'"
        )
    
    def match(self, candidate: TaxonomyCandidate) -> HierarchicalMatch:
        """
        Perform complete hierarchical matching for a taxonomy candidate.
        
        Args:
            candidate: Taxonomy candidate from LLM analysis
            
        Returns:
            Complete hierarchical match result
        """
        logger.info(f"Matching taxonomy: {candidate.get_full_path()}")
        
        # Match domain
        domain_result = self.match_domain(candidate)
        
        # Match subdomain
        subdomain_result = self.match_subdomain(candidate, domain_result)
        
        # Match leaf (optional)
        leaf_result = self.match_leaf(candidate, subdomain_result)
        
        match = HierarchicalMatch(
            domain_result=domain_result,
            subdomain_result=subdomain_result,
            leaf_result=leaf_result
        )
        
        logger.info(f"Final path: {match.get_final_path()}")
        logger.info(f"Created: {[f.path for f in match.get_created_folders()]}")
        logger.info(f"Reused: {[f.path for f in match.get_reused_folders()]}")
        
        return match
    
    def get_folder_tree(self) -> Dict[str, Dict]:
        """
        Get the current folder tree structure.
        
        Returns:
            Dictionary representing the folder hierarchy
        """
        tree = {}
        
        for folder in self._folders_by_depth[1]:
            tree[folder.path] = {
                'id': folder.folder_id,
                'label': folder.label,
                'item_count': folder.item_count,
                'children': {}
            }
        
        for folder in self._folders_by_depth[2]:
            parent_path = '/'.join(folder.path.split('/')[:-1])
            if parent_path in tree:
                tree[parent_path]['children'][folder.label] = {
                    'id': folder.folder_id,
                    'label': folder.label,
                    'path': folder.path,
                    'item_count': folder.item_count,
                    'children': {}
                }
        
        for folder in self._folders_by_depth[3]:
            parts = folder.path.split('/')
            if len(parts) >= 3:
                domain_path = parts[0]
                subdomain_label = parts[1]
                
                if domain_path in tree:
                    if subdomain_label in tree[domain_path]['children']:
                        tree[domain_path]['children'][subdomain_label]['children'][folder.label] = {
                            'id': folder.folder_id,
                            'label': folder.label,
                            'path': folder.path,
                            'item_count': folder.item_count
                        }
        
        return tree


# ============================================
# Factory Function
# ============================================

_folder_matcher: Optional[FolderMatcher] = None


def get_folder_matcher() -> FolderMatcher:
    """Get the global folder matcher instance."""
    global _folder_matcher
    if _folder_matcher is None:
        _folder_matcher = FolderMatcher()
    return _folder_matcher
