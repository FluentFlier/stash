"""
Auto-Folder Main Orchestrator

Main entry point for the hierarchical auto-foldering system.
Coordinates:
- Input processing (from downloader output or direct)
- Taxonomy generation (LLM)
- Folder matching (vector search)
- Database operations
- Output formatting

Usage:
    python auto_folder.py <output_dir>              # Process downloader output
    python auto_folder.py --topic "..." --summary "..."  # Direct input
    python auto_folder.py --batch <json_file>       # Batch processing
    python auto_folder.py --init-seed               # Initialize seed taxonomy
"""

import argparse
import logging
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from .config import get_config, update_config
from .models import (
    ItemInput,
    AutoFolderOutput,
    ExistingFolder,
    BatchInput,
    BatchOutput
)
from .taxonomy_generator import get_taxonomy_generator, TaxonomyGenerator
from .folder_matcher import get_folder_matcher, FolderMatcher
from .embedding_service import get_embedding_service, check_embedding_availability
from .database import get_database, initialize_database

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger(__name__)


class AutoFolder:
    """
    Main orchestrator for the auto-foldering system.
    Provides high-level API for classifying items into folder hierarchies.
    """
    
    def __init__(
        self,
        taxonomy_generator: Optional[TaxonomyGenerator] = None,
        folder_matcher: Optional[FolderMatcher] = None,
        auto_init_seed: bool = True
    ):
        """
        Initialize the AutoFolder system.
        
        Args:
            taxonomy_generator: Custom taxonomy generator (or use default)
            folder_matcher: Custom folder matcher (or use default)
            auto_init_seed: Whether to auto-initialize seed folders if empty
        """
        self.taxonomy_generator = taxonomy_generator or get_taxonomy_generator()
        self.folder_matcher = folder_matcher or get_folder_matcher()
        self.database = get_database()
        
        # Check if we need to initialize
        if auto_init_seed:
            self._ensure_initialized()
    
    def _ensure_initialized(self) -> None:
        """Ensure the system is initialized with seed folders."""
        # Try to load existing folders
        self.folder_matcher.load_folders_from_store()
        
        # If no folders exist, initialize seed taxonomy
        if len(self.folder_matcher._folders_by_depth[1]) == 0:
            logger.info("No existing folders found - initializing seed taxonomy...")
            self.initialize_seed_taxonomy()
    
    def initialize_seed_taxonomy(self) -> List[Dict[str, Any]]:
        """
        Initialize the seed taxonomy folders.
        
        Returns:
            List of created folder dictionaries
        """
        logger.info("Initializing seed taxonomy...")
        
        created_folders = self.folder_matcher.initialize_seed_folders()
        
        # Store in database
        for folder in created_folders:
            try:
                self.database.folders.create_folder(folder)
            except Exception as e:
                logger.debug(f"Folder may already exist in database: {e}")
        
        logger.info(f"Seed taxonomy initialized with {len(created_folders)} folders")
        
        return [f.to_dict() for f in created_folders]
    
    def classify(self, item: ItemInput) -> AutoFolderOutput:
        """
        Classify a single item and return the folder assignment.
        
        Args:
            item: Input item with raw_topic and summary
            
        Returns:
            AutoFolderOutput with classification results
        """
        start_time = time.time()
        
        logger.info(f"Classifying item: {item.item_id}")
        logger.info(f"  Topic: {item.raw_topic[:50]}..." if len(item.raw_topic) > 50 else f"  Topic: {item.raw_topic}")
        
        try:
            # Step 1: Generate taxonomy candidate
            logger.info("Step 1: Generating taxonomy candidate...")
            taxonomy = self.taxonomy_generator.generate(item)
            logger.info(f"  Generated: {taxonomy.get_full_path()} (confidence: {taxonomy.confidence:.2f})")
            
            # Step 2: Match/create folders
            logger.info("Step 2: Matching folders...")
            match = self.folder_matcher.match(taxonomy)
            
            # Step 3: Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Step 4: Create output
            output = AutoFolderOutput.from_hierarchical_match(
                item_id=item.item_id,
                match=match,
                taxonomy=taxonomy,
                processing_time_ms=processing_time_ms
            )
            
            # Step 5: Record in database
            try:
                # Update folder item counts
                final_folder = match.subdomain_result.get_folder()
                if final_folder:
                    self.database.folders.increment_item_count(final_folder.folder_id)
                    self.database.item_folders.associate_item(
                        item_id=item.item_id,
                        folder_id=final_folder.folder_id,
                        metadata={
                            'tags': output.tags,
                            'confidence': output.confidence,
                            'path': output.final_path
                        }
                    )
                
                # Record classification stats
                self.database.stats.record_classification(item.item_id, output)
                
            except Exception as e:
                logger.warning(f"Failed to update database: {e}")
            
            logger.info(f"Classification complete: {output.final_path}")
            logger.info(f"  Created folders: {output.created_folders}")
            logger.info(f"  Reused folders: {output.reused_folders}")
            logger.info(f"  Processing time: {processing_time_ms}ms")
            
            return output
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            
            # Return error output
            return AutoFolderOutput(
                item_id=item.item_id,
                final_path="Uncategorized/Error",
                applied_labels={"domain": "Uncategorized", "subdomain": "Error", "leaf_topic": None},
                tags=[],
                confidence=0.0,
                notes=f"Classification failed: {str(e)}",
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def classify_from_downloader(self, output_dir: str) -> AutoFolderOutput:
        """
        Classify an item from downloader.py output directory.
        
        Args:
            output_dir: Path to the downloader output directory
            
        Returns:
            AutoFolderOutput with classification results
        """
        logger.info(f"Processing downloader output: {output_dir}")
        
        # Create ItemInput from downloader output
        item = ItemInput.from_downloader_output(output_dir)
        
        if not item.raw_topic and not item.summary:
            logger.error("No topic or summary found in output directory")
            return AutoFolderOutput(
                item_id=item.item_id,
                final_path="Uncategorized/Error",
                notes="No content found in output directory",
                confidence=0.0
            )
        
        return self.classify(item)
    
    def classify_batch(self, items: List[ItemInput]) -> BatchOutput:
        """
        Classify multiple items in batch.
        
        Args:
            items: List of items to classify
            
        Returns:
            BatchOutput with all results
        """
        start_time = time.time()
        
        results = []
        successful = 0
        failed = 0
        new_folders = 0
        reused_folders = 0
        
        logger.info(f"Processing batch of {len(items)} items...")
        
        for i, item in enumerate(items):
            logger.info(f"Processing item {i+1}/{len(items)}: {item.item_id}")
            
            try:
                output = self.classify(item)
                results.append(output)
                
                if output.confidence > 0:
                    successful += 1
                else:
                    failed += 1
                
                new_folders += len(output.created_folders)
                reused_folders += len(output.reused_folders)
                
            except Exception as e:
                logger.error(f"Failed to classify item {item.item_id}: {e}")
                failed += 1
                results.append(AutoFolderOutput(
                    item_id=item.item_id,
                    final_path="Uncategorized/Error",
                    notes=f"Classification failed: {str(e)}",
                    confidence=0.0
                ))
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return BatchOutput(
            results=results,
            total_items=len(items),
            successful=successful,
            failed=failed,
            new_folders_created=new_folders,
            folders_reused=reused_folders,
            processing_time_ms=processing_time_ms
        )
    
    def get_folder_tree(self) -> Dict[str, Any]:
        """
        Get the current folder tree structure.
        
        Returns:
            Dictionary representing the folder hierarchy
        """
        return self.folder_matcher.get_folder_tree()
    
    def get_classification_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent classification history.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of classification records
        """
        return self.database.stats.get_classification_history(limit)


# ============================================
# CLI Functions
# ============================================

def process_downloader_output(output_dir: str) -> Dict[str, Any]:
    """
    Process a downloader output directory and classify.
    
    Args:
        output_dir: Path to downloader output directory
        
    Returns:
        Classification result as dictionary
    """
    auto_folder = AutoFolder()
    output = auto_folder.classify_from_downloader(output_dir)
    return output.to_dict()


def process_direct_input(topic: str, summary: str, **kwargs) -> Dict[str, Any]:
    """
    Process direct topic/summary input.
    
    Args:
        topic: Raw topic string
        summary: Summary string
        **kwargs: Additional item fields
        
    Returns:
        Classification result as dictionary
    """
    item = ItemInput(
        item_id=kwargs.get('item_id', str(time.time())),
        raw_topic=topic,
        summary=summary,
        source_app=kwargs.get('source_app'),
        url=kwargs.get('url'),
        user_note=kwargs.get('user_note'),
        keywords=kwargs.get('keywords')
    )
    
    auto_folder = AutoFolder()
    output = auto_folder.classify(item)
    return output.to_dict()


def process_batch_file(batch_file: str) -> Dict[str, Any]:
    """
    Process a batch input JSON file.
    
    Args:
        batch_file: Path to JSON file with items array
        
    Returns:
        Batch output as dictionary
    """
    with open(batch_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    items = []
    for item_data in data.get('items', []):
        items.append(ItemInput(
            item_id=item_data.get('item_id', str(len(items))),
            raw_topic=item_data.get('raw_topic', ''),
            summary=item_data.get('summary', ''),
            source_app=item_data.get('source_app'),
            url=item_data.get('url'),
            keywords=item_data.get('keywords')
        ))
    
    auto_folder = AutoFolder()
    batch_output = auto_folder.classify_batch(items)
    return batch_output.to_dict()


def initialize_seed() -> Dict[str, Any]:
    """
    Initialize the seed taxonomy.
    
    Returns:
        Initialization result
    """
    auto_folder = AutoFolder(auto_init_seed=False)
    folders = auto_folder.initialize_seed_taxonomy()
    return {
        'status': 'success',
        'folders_created': len(folders),
        'folders': folders
    }


def show_folder_tree() -> Dict[str, Any]:
    """
    Show the current folder tree.
    
    Returns:
        Folder tree structure
    """
    auto_folder = AutoFolder()
    return auto_folder.get_folder_tree()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Hierarchical Auto-Folder System for Stash",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process downloader output
  python -m auto_folder outputs/twitter_tweet_data
  
  # Direct input
  python -m auto_folder --topic "calorie deficit" --summary "Notes on maintaining a 500 calorie deficit..."
  
  # Initialize seed taxonomy
  python -m auto_folder --init-seed
  
  # Show folder tree
  python -m auto_folder --tree
  
  # Batch processing
  python -m auto_folder --batch items.json
        """
    )
    
    # Positional argument for output directory
    parser.add_argument(
        'output_dir',
        nargs='?',
        help='Path to downloader output directory'
    )
    
    # Direct input options
    parser.add_argument(
        '--topic', '-t',
        help='Raw topic for direct classification'
    )
    parser.add_argument(
        '--summary', '-s',
        help='Summary for direct classification'
    )
    
    # Other options
    parser.add_argument(
        '--batch', '-b',
        help='Path to batch input JSON file'
    )
    parser.add_argument(
        '--init-seed',
        action='store_true',
        help='Initialize seed taxonomy folders'
    )
    parser.add_argument(
        '--tree',
        action='store_true',
        help='Show current folder tree'
    )
    parser.add_argument(
        '--history',
        type=int,
        nargs='?',
        const=20,
        help='Show classification history (default: 20 items)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    parser.add_argument(
        '--output', '-o',
        help='Output file for results (default: stdout)'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Check embedding service availability
    status = check_embedding_availability()
    if not status['available']:
        logger.error(f"Embedding service not available: {status['message']}")
        sys.exit(1)
    
    result = None
    
    try:
        if args.init_seed:
            logger.info("Initializing seed taxonomy...")
            result = initialize_seed()
            
        elif args.tree:
            logger.info("Fetching folder tree...")
            result = show_folder_tree()
            
        elif args.history is not None:
            logger.info(f"Fetching classification history (last {args.history})...")
            auto_folder = AutoFolder()
            result = auto_folder.get_classification_history(args.history)
            
        elif args.batch:
            logger.info(f"Processing batch file: {args.batch}")
            result = process_batch_file(args.batch)
            
        elif args.topic and args.summary:
            logger.info("Processing direct input...")
            result = process_direct_input(args.topic, args.summary)
            
        elif args.output_dir:
            logger.info(f"Processing downloader output: {args.output_dir}")
            result = process_downloader_output(args.output_dir)
            
        else:
            parser.print_help()
            sys.exit(0)
        
        # Output result
        output_json = json.dumps(result, indent=2, default=str)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output_json)
            logger.info(f"Results written to: {args.output}")
        else:
            print("\n" + "=" * 60)
            print("RESULT")
            print("=" * 60)
            print(output_json)
        
    except Exception as e:
        logger.error(f"Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
