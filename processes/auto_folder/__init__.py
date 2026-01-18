"""
Auto-Folder System for Stash

A hierarchical auto-foldering system that takes AI-analyzed items (topic + summary)
and places them into an intelligently organized folder structure.

Key Features:
- LLM-powered taxonomy generation using Google Gemini
- Vector similarity matching for folder reuse
- Hierarchical folder structure (domain -> subdomain -> leaf)
- Smart folder creation with deduplication
- Supabase integration with pgvector for production
- Local JSON storage for development

Database Backends:
- 'supabase' - Supabase with pgvector (recommended for production)
- 'postgres' - Direct PostgreSQL connection
- 'memory' - In-memory with JSON persistence (development)

Usage:
    from auto_folder import AutoFolder, ItemInput
    
    # Initialize the system
    auto_folder = AutoFolder()
    
    # Classify an item
    item = ItemInput(
        item_id="123",
        raw_topic="calorie deficit",
        summary="Notes on maintaining a calorie deficit while strength training..."
    )
    
    result = auto_folder.classify(item)
    print(result.to_json())

Supabase Setup:
    1. Set SUPABASE_URL and SUPABASE_KEY in .env
    2. Set DATABASE_BACKEND=supabase
    3. Run the SQL migration from supabase_client.get_migration_sql()

CLI Usage:
    python -m processes.auto_folder <output_dir>
    python -m processes.auto_folder --topic "..." --summary "..."
    python -m processes.auto_folder --init-seed
    python -m processes.auto_folder --tree
"""

from .config import (
    get_config,
    update_config,
    AutoFolderConfig,
    ThresholdConfig,
    EmbeddingConfig,
    TaxonomyConfig,
    DatabaseConfig,
    SEED_DOMAINS,
    ALIAS_MAP
)

from .models import (
    # Enums
    FolderDepth,
    MatchAction,
    ItemSourceType,
    
    # Input models
    ItemInput,
    
    # Taxonomy models
    LabelWithAliases,
    TaxonomyCandidate,
    
    # Folder models
    FolderEntity,
    ExistingFolder,
    
    # Matching models
    MatchResult,
    HierarchicalMatch,
    
    # Output models
    AutoFolderOutput,
    BatchInput,
    BatchOutput
)

from .embedding_service import (
    EmbeddingService,
    VectorStore,
    InMemoryVectorStore,
    get_embedding_service,
    get_vector_store,
    check_embedding_availability
)

from .taxonomy_generator import (
    TaxonomyGenerator,
    get_taxonomy_generator
)

from .folder_matcher import (
    FolderMatcher,
    get_folder_matcher
)

from .database import (
    Database,
    FolderRepository,
    ItemFolderRepository,
    EmbeddingRepository,
    TaxonomyStatsRepository,
    LocalJsonFolderRepository,
    get_database,
    initialize_database
)

from .auto_folder import (
    AutoFolder,
    process_downloader_output,
    process_direct_input,
    process_batch_file,
    initialize_seed,
    show_folder_tree
)

# Supabase integration (optional import)
try:
    from .supabase_client import (
        SupabaseClient,
        SupabaseFolderRepository,
        SupabaseItemFolderRepository,
        SupabaseEmbeddingRepository,
        SupabaseTaxonomyStatsRepository,
        get_supabase_client,
        get_migration_sql,
        check_supabase_availability
    )
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    # Define stubs for missing Supabase classes
    SupabaseClient = None
    SupabaseFolderRepository = None
    SupabaseItemFolderRepository = None
    SupabaseEmbeddingRepository = None
    SupabaseTaxonomyStatsRepository = None
    get_supabase_client = None
    get_migration_sql = None
    check_supabase_availability = None

__version__ = "1.0.0"
__author__ = "Stash Team"

__all__ = [
    # Main class
    "AutoFolder",
    
    # Configuration
    "get_config",
    "update_config",
    "AutoFolderConfig",
    "ThresholdConfig",
    "EmbeddingConfig",
    "TaxonomyConfig",
    "DatabaseConfig",
    "SEED_DOMAINS",
    "ALIAS_MAP",
    
    # Models - Enums
    "FolderDepth",
    "MatchAction",
    "ItemSourceType",
    
    # Models - Data
    "ItemInput",
    "LabelWithAliases",
    "TaxonomyCandidate",
    "FolderEntity",
    "ExistingFolder",
    "MatchResult",
    "HierarchicalMatch",
    "AutoFolderOutput",
    "BatchInput",
    "BatchOutput",
    
    # Services
    "EmbeddingService",
    "VectorStore",
    "InMemoryVectorStore",
    "TaxonomyGenerator",
    "FolderMatcher",
    
    # Database - Core
    "Database",
    "FolderRepository",
    "ItemFolderRepository",
    "EmbeddingRepository",
    "TaxonomyStatsRepository",
    "LocalJsonFolderRepository",
    
    # Database - Supabase
    "SUPABASE_AVAILABLE",
    "SupabaseClient",
    "SupabaseFolderRepository",
    "SupabaseItemFolderRepository",
    "SupabaseEmbeddingRepository",
    "SupabaseTaxonomyStatsRepository",
    "get_supabase_client",
    "get_migration_sql",
    "check_supabase_availability",
    
    # Factory functions
    "get_embedding_service",
    "get_vector_store",
    "get_taxonomy_generator",
    "get_folder_matcher",
    "get_database",
    "initialize_database",
    "check_embedding_availability",
    
    # CLI functions
    "process_downloader_output",
    "process_direct_input",
    "process_batch_file",
    "initialize_seed",
    "show_folder_tree",
]
