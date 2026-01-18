"""
Auto-Folder Configuration Module

Contains all configuration settings, thresholds, and seed taxonomy
for the hierarchical auto-foldering system.
"""

import os
from pathlib import Path
from typing import Dict, List, Set
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = Path(__file__).parent
load_dotenv(SCRIPT_DIR.parent / '.env')


@dataclass
class ThresholdConfig:
    """Similarity thresholds for folder matching at different depths."""
    
    # Domain (top-level) threshold - higher means fewer top-level folders
    domain_threshold: float = 0.82
    
    # Subdomain (second-level) threshold
    subdomain_threshold: float = 0.80
    
    # Leaf (third-level) threshold
    leaf_threshold: float = 0.75
    
    # Minimum confidence for creating leaf folders
    leaf_confidence_threshold: float = 0.70
    
    # Minimum items required before creating a leaf folder
    leaf_recurrence_threshold: int = 3
    
    # Maximum folder depth allowed
    max_depth: int = 3
    
    # Minimum keyword overlap for sanity check
    min_keyword_overlap: float = 0.20


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation."""
    
    # Embedding model to use (Gemini)
    model_name: str = "models/text-embedding-004"
    
    # Embedding dimension (Gemini text-embedding-004 uses 768)
    dimension: int = 768
    
    # Task type for embeddings
    task_type: str = "SEMANTIC_SIMILARITY"
    
    # Maximum text length for embeddings
    max_text_length: int = 8000


@dataclass
class TaxonomyConfig:
    """Configuration for taxonomy generation."""
    
    # LLM model for taxonomy generation
    model_name: str = "gemini-2.5-flash"
    
    # Temperature for taxonomy generation (lower = more consistent)
    temperature: float = 0.3
    
    # Maximum domain label length (words)
    max_domain_words: int = 4
    
    # Maximum subdomain label length (words)
    max_subdomain_words: int = 4
    
    # Maximum leaf label length (words)
    max_leaf_words: int = 4


@dataclass
class DatabaseConfig:
    """Configuration for database connections."""
    
    # Database backend type: 'supabase', 'postgres', 'memory'
    # 'supabase' - Use Supabase with pgvector (recommended for production)
    # 'postgres' - Use direct PostgreSQL connection
    # 'memory' - Use in-memory storage with JSON persistence (development)
    backend: str = field(
        default_factory=lambda: os.environ.get('DATABASE_BACKEND', 'memory')
    )
    
    # Supabase configuration
    supabase_url: str = field(
        default_factory=lambda: os.environ.get('SUPABASE_URL', '')
    )
    supabase_key: str = field(
        default_factory=lambda: os.environ.get('SUPABASE_KEY', '')
    )
    
    # Direct PostgreSQL connection string (for non-Supabase deployments)
    connection_string: str = field(
        default_factory=lambda: os.environ.get(
            'DATABASE_URL', 
            'postgresql://localhost:5432/stash'
        )
    )
    
    # Redis connection for caching (optional)
    redis_url: str = field(
        default_factory=lambda: os.environ.get(
            'REDIS_URL',
            'redis://localhost:6379'
        )
    )
    
    # Vector database type (options: 'supabase', 'pgvector', 'pinecone', 'qdrant', 'memory')
    # When backend='supabase', this is automatically set to 'supabase'
    vector_db_type: str = field(
        default_factory=lambda: os.environ.get('VECTOR_DB_TYPE', 'memory')
    )
    
    def __post_init__(self):
        # Auto-configure vector_db_type when using Supabase
        if self.backend == 'supabase' and self.vector_db_type == 'memory':
            self.vector_db_type = 'supabase'


# ============================================
# Seed Taxonomy - Default Top-Level Domains
# ============================================

SEED_DOMAINS: List[Dict] = [
    {
        "label": "Health & Fitness",
        "aliases": ["health", "fitness", "wellness", "exercise", "workout", "gym"],
        "subdomains": [
            {"label": "Weight Loss", "aliases": ["fat loss", "cutting", "calorie deficit", "diet"]},
            {"label": "Bulking", "aliases": ["muscle gain", "mass building", "weight gain"]},
            {"label": "Exercise", "aliases": ["workout", "training", "cardio", "strength"]},
            {"label": "Nutrition", "aliases": ["diet", "food", "eating", "macros", "calories"]},
            {"label": "Recovery", "aliases": ["rest", "sleep", "stretching", "mobility"]},
            {"label": "Mental Health", "aliases": ["anxiety", "depression", "stress", "meditation"]},
        ]
    },
    {
        "label": "Computer Science",
        "aliases": ["programming", "coding", "software", "tech", "development", "engineering"],
        "subdomains": [
            {"label": "Frontend", "aliases": ["ui", "ux", "react", "vue", "css", "html", "web design"]},
            {"label": "Backend", "aliases": ["server", "api", "nodejs", "python", "java", "database"]},
            {"label": "Cloud", "aliases": ["aws", "azure", "gcp", "devops", "kubernetes", "docker"]},
            {"label": "Databases", "aliases": ["sql", "nosql", "postgres", "mongodb", "redis"]},
            {"label": "Security", "aliases": ["cybersecurity", "encryption", "authentication", "hacking"]},
            {"label": "AI & ML", "aliases": ["machine learning", "artificial intelligence", "deep learning", "nlp"]},
            {"label": "Programming Languages", "aliases": ["python", "javascript", "rust", "go", "typescript"]},
            {"label": "Mobile Development", "aliases": ["ios", "android", "react native", "flutter", "swift"]},
        ]
    },
    {
        "label": "Work",
        "aliases": ["job", "career", "professional", "business", "office"],
        "subdomains": [
            {"label": "Meetings", "aliases": ["call", "standup", "sync", "conference"]},
            {"label": "Projects", "aliases": ["task", "deadline", "deliverable", "milestone"]},
            {"label": "Career Development", "aliases": ["promotion", "skills", "growth", "interview"]},
            {"label": "Management", "aliases": ["leadership", "team", "hiring", "feedback"]},
            {"label": "Networking", "aliases": ["connections", "linkedin", "contacts"]},
        ]
    },
    {
        "label": "Cooking",
        "aliases": ["food", "recipes", "culinary", "kitchen", "meal prep"],
        "subdomains": [
            {"label": "Recipes", "aliases": ["dish", "meal", "instructions"]},
            {"label": "Techniques", "aliases": ["method", "skill", "how to cook"]},
            {"label": "Cuisines", "aliases": ["italian", "asian", "mexican", "indian"]},
            {"label": "Baking", "aliases": ["desserts", "bread", "pastry", "cakes"]},
            {"label": "Meal Planning", "aliases": ["prep", "weekly meals", "grocery"]},
        ]
    },
    {
        "label": "Personal Finance",
        "aliases": ["money", "finance", "budget", "investing", "savings"],
        "subdomains": [
            {"label": "Budgeting", "aliases": ["spending", "expenses", "tracking money"]},
            {"label": "Investing", "aliases": ["stocks", "crypto", "bonds", "portfolio"]},
            {"label": "Savings", "aliases": ["emergency fund", "retirement", "saving money"]},
            {"label": "Taxes", "aliases": ["tax return", "deductions", "irs"]},
            {"label": "Debt", "aliases": ["loans", "credit card", "mortgage", "paying off"]},
        ]
    },
    {
        "label": "Travel",
        "aliases": ["vacation", "trip", "tourism", "adventure", "destination"],
        "subdomains": [
            {"label": "Destinations", "aliases": ["places", "cities", "countries", "locations"]},
            {"label": "Planning", "aliases": ["itinerary", "booking", "flights", "hotels"]},
            {"label": "Tips", "aliases": ["hacks", "advice", "recommendations"]},
            {"label": "Reviews", "aliases": ["experiences", "recommendations", "ratings"]},
        ]
    },
    {
        "label": "Shopping & Gifts",
        "aliases": ["buying", "products", "gifts", "purchases", "wishlist"],
        "subdomains": [
            {"label": "Wishlist", "aliases": ["want list", "to buy", "save for later"]},
            {"label": "Gift Ideas", "aliases": ["presents", "birthday gifts", "christmas gifts"]},
            {"label": "Deals", "aliases": ["sales", "discounts", "coupons", "offers"]},
            {"label": "Reviews", "aliases": ["product reviews", "ratings", "comparisons"]},
        ]
    },
    {
        "label": "Relationships",
        "aliases": ["social", "family", "friends", "dating", "love"],
        "subdomains": [
            {"label": "Family", "aliases": ["parents", "kids", "siblings", "relatives"]},
            {"label": "Friends", "aliases": ["friendship", "social life", "hanging out"]},
            {"label": "Dating", "aliases": ["romance", "love", "partner", "relationship advice"]},
            {"label": "Communication", "aliases": ["talking", "listening", "conflict resolution"]},
        ]
    },
    {
        "label": "Productivity",
        "aliases": ["efficiency", "organization", "time management", "getting things done"],
        "subdomains": [
            {"label": "Time Management", "aliases": ["scheduling", "calendar", "planning"]},
            {"label": "Tools", "aliases": ["apps", "software", "systems"]},
            {"label": "Habits", "aliases": ["routines", "discipline", "consistency"]},
            {"label": "Focus", "aliases": ["concentration", "deep work", "distraction"]},
        ]
    },
    {
        "label": "Hobbies",
        "aliases": ["interests", "leisure", "fun", "activities", "pastimes"],
        "subdomains": [
            {"label": "Gaming", "aliases": ["video games", "games", "esports"]},
            {"label": "Music", "aliases": ["songs", "instruments", "bands", "listening"]},
            {"label": "Art", "aliases": ["drawing", "painting", "design", "creativity"]},
            {"label": "Sports", "aliases": ["athletics", "teams", "playing"]},
            {"label": "Reading", "aliases": ["books", "articles", "literature"]},
            {"label": "Photography", "aliases": ["photos", "camera", "editing"]},
        ]
    },
    {
        "label": "Education",
        "aliases": ["learning", "school", "courses", "study", "knowledge"],
        "subdomains": [
            {"label": "Courses", "aliases": ["classes", "tutorials", "lessons"]},
            {"label": "Research", "aliases": ["papers", "studies", "articles"]},
            {"label": "Notes", "aliases": ["study notes", "summaries", "key points"]},
            {"label": "Languages", "aliases": ["foreign languages", "learning languages"]},
        ]
    },
    {
        "label": "News & Current Events",
        "aliases": ["news", "current events", "politics", "world events"],
        "subdomains": [
            {"label": "Politics", "aliases": ["government", "elections", "policy"]},
            {"label": "Technology News", "aliases": ["tech news", "gadgets", "innovation"]},
            {"label": "Business News", "aliases": ["economy", "markets", "companies"]},
            {"label": "Science", "aliases": ["discoveries", "research", "breakthroughs"]},
        ]
    },
    {
        "label": "Entertainment",
        "aliases": ["movies", "tv", "shows", "media", "fun"],
        "subdomains": [
            {"label": "Movies", "aliases": ["films", "cinema", "movie reviews"]},
            {"label": "TV Shows", "aliases": ["series", "streaming", "episodes"]},
            {"label": "Podcasts", "aliases": ["audio", "shows", "episodes"]},
            {"label": "YouTube", "aliases": ["videos", "channels", "creators"]},
        ]
    },
    {
        "label": "Personal",
        "aliases": ["me", "self", "diary", "journal", "thoughts"],
        "subdomains": [
            {"label": "Journal", "aliases": ["diary", "thoughts", "reflections"]},
            {"label": "Goals", "aliases": ["resolutions", "targets", "aspirations"]},
            {"label": "Ideas", "aliases": ["thoughts", "brainstorm", "concepts"]},
            {"label": "Memories", "aliases": ["photos", "events", "nostalgia"]},
        ]
    },
]


# ============================================
# Alias Map - Maps variations to canonical names
# ============================================

def build_alias_map() -> Dict[str, str]:
    """Build a mapping from aliases to canonical domain/subdomain names."""
    alias_map: Dict[str, str] = {}
    
    for domain in SEED_DOMAINS:
        canonical_domain = domain["label"]
        
        # Add domain aliases
        alias_map[canonical_domain.lower()] = canonical_domain
        for alias in domain.get("aliases", []):
            alias_map[alias.lower()] = canonical_domain
        
        # Add subdomain aliases
        for subdomain in domain.get("subdomains", []):
            canonical_subdomain = f"{canonical_domain}/{subdomain['label']}"
            alias_map[subdomain["label"].lower()] = canonical_subdomain
            for alias in subdomain.get("aliases", []):
                alias_map[alias.lower()] = canonical_subdomain
    
    return alias_map


ALIAS_MAP: Dict[str, str] = build_alias_map()


# ============================================
# Forbidden Words - Words to exclude from labels
# ============================================

FORBIDDEN_LABEL_WORDS: Set[str] = {
    "saved", "stash", "stashed", "bookmark", "bookmarked",
    "like", "liked", "favorite", "favourited", "favorited",
    "share", "shared", "post", "posted", "tweet", "tweeted",
    "instagram", "tiktok", "youtube", "twitter", "facebook",
    "video", "image", "photo", "picture", "link", "url",
    "content", "item", "thing", "stuff", "misc", "miscellaneous",
    "other", "general", "various", "random", "untitled", "unknown"
}


# ============================================
# Configuration Instance
# ============================================

@dataclass
class AutoFolderConfig:
    """Main configuration for the auto-folder system."""
    
    thresholds: ThresholdConfig = field(default_factory=ThresholdConfig)
    embeddings: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    taxonomy: TaxonomyConfig = field(default_factory=TaxonomyConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    
    # API Keys
    gemini_api_key: str = field(
        default_factory=lambda: os.environ.get('GEMINI_API_KEY', '')
    )
    
    # Logging
    log_level: str = field(
        default_factory=lambda: os.environ.get('LOG_LEVEL', 'INFO')
    )
    
    # Output directory for local storage
    output_dir: Path = field(
        default_factory=lambda: SCRIPT_DIR / "data"
    )


# Global config instance
config = AutoFolderConfig()


def get_config() -> AutoFolderConfig:
    """Get the global configuration instance."""
    return config


def update_config(**kwargs) -> AutoFolderConfig:
    """Update configuration with new values."""
    global config
    
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)
        elif hasattr(config.thresholds, key):
            setattr(config.thresholds, key, value)
        elif hasattr(config.embeddings, key):
            setattr(config.embeddings, key, value)
        elif hasattr(config.taxonomy, key):
            setattr(config.taxonomy, key, value)
        elif hasattr(config.database, key):
            setattr(config.database, key, value)
    
    return config
