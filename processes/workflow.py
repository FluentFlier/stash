"""
Complete Workflow: Download -> Classify -> Auto-Folder

This script chains downloader.py and auto_folder.py to:
1. Download media from a URL (Instagram, TikTok, Twitter, YouTube)
2. Process with AI (Gemini/Overshoot) -> topic.txt + summary.txt
3. Classify into folders using auto_folder -> creates folders in Supabase

Usage:
    python workflow.py <url>                           # Process single URL
    python workflow.py <url1> <url2> ...              # Process multiple URLs
    python workflow.py --output-dir <dir>             # Process existing output directory

Examples:
    python workflow.py https://www.instagram.com/p/DNs58us4txJ/
    python workflow.py outputs/instagram_video
"""

import sys
import os
import argparse
from pathlib import Path
from typing import List, Optional

# Add processes directory to path
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from dotenv import load_dotenv
load_dotenv(SCRIPT_DIR / '.env')

# Import downloader
import downloader

# Import auto_folder
from auto_folder import AutoFolder

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger(__name__)


def process_url(url: str) -> Optional[str]:
    """
    Download and process a URL, then classify into folders.
    
    Args:
        url: URL to download and process
        
    Returns:
        Path to output directory if successful, None otherwise
    """
    print("\n" + "=" * 80)
    print(f"STEP 1: DOWNLOADING & PROCESSING")
    print("=" * 80)
    print(f"URL: {url}\n")
    
    # Step 1: Download and process with downloader.py
    try:
        downloaded_file, topic_path, summary_path, processor = downloader.download_and_process(url)
        
        if not topic_path or not summary_path:
            logger.error("Failed to generate topic.txt or summary.txt")
            return None
        
        # Determine output directory from topic_path
        output_dir = str(Path(topic_path).parent)
        logger.info(f"Generated files in: {output_dir}")
        logger.info(f"  - topic.txt: {topic_path}")
        logger.info(f"  - summary.txt: {summary_path}")
        
    except Exception as e:
        logger.error(f"Download/processing failed: {e}")
        return None
    
    # Step 2: Classify into folders using auto_folder
    print("\n" + "=" * 80)
    print(f"STEP 2: CLASSIFYING INTO FOLDERS")
    print("=" * 80)
    print(f"Output directory: {output_dir}\n")
    
    try:
        auto_folder = AutoFolder()
        result = auto_folder.classify_from_downloader(output_dir)
        
        print("\n" + "=" * 80)
        print("CLASSIFICATION RESULT")
        print("=" * 80)
        print(result.to_json())
        print("=" * 80)
        
        return output_dir
        
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return None


def process_existing_output(output_dir: str) -> bool:
    """
    Process an existing downloader output directory.
    
    Args:
        output_dir: Path to output directory
        
    Returns:
        True if successful, False otherwise
    """
    output_path = Path(output_dir)
    
    if not output_path.exists():
        logger.error(f"Output directory not found: {output_dir}")
        return False
    
    # Check for required files
    topic_file = output_path / "topic.txt"
    summary_file = output_path / "summary.txt"
    
    if not topic_file.exists() and not summary_file.exists():
        logger.error(f"Neither topic.txt nor summary.txt found in {output_dir}")
        return False
    
    print("\n" + "=" * 80)
    print(f"CLASSIFYING EXISTING OUTPUT")
    print("=" * 80)
    print(f"Directory: {output_dir}\n")
    
    try:
        auto_folder = AutoFolder()
        result = auto_folder.classify_from_downloader(output_dir)
        
        print("\n" + "=" * 80)
        print("CLASSIFICATION RESULT")
        print("=" * 80)
        print(result.to_json())
        print("=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Complete workflow: Download -> Classify -> Auto-Folder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process single Instagram post
  python workflow.py https://www.instagram.com/p/DNs58us4txJ/
  
  # Process multiple URLs
  python workflow.py https://instagram.com/p/abc123/ https://twitter.com/user/status/123
  
  # Process existing output directory
  python workflow.py --output-dir outputs/instagram_video
        """
    )
    
    parser.add_argument('urls', nargs='*', help='URL(s) to process')
    parser.add_argument('--output-dir', '-o', help='Process existing output directory instead of URL')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("=" * 80)
    print("STASH WORKFLOW: Download -> Classify -> Auto-Folder")
    print("=" * 80)
    print()
    print("This workflow will:")
    print("  1. Download media from URL (Instagram, TikTok, Twitter, YouTube)")
    print("  2. Process with AI -> topic.txt + summary.txt")
    print("  3. Classify into folders -> creates folders in Supabase")
    print()
    
    # Process based on arguments
    if args.output_dir:
        # Process existing output directory
        success = process_existing_output(args.output_dir)
        sys.exit(0 if success else 1)
        
    elif args.urls:
        # Process URL(s)
        success_count = 0
        failed_count = 0
        
        for i, url in enumerate(args.urls, 1):
            print(f"\n{'='*80}")
            print(f"PROCESSING {i}/{len(args.urls)}")
            print(f"{'='*80}")
            
            result = process_url(url)
            if result:
                success_count += 1
                print(f"\n✅ Successfully processed: {url}")
            else:
                failed_count += 1
                print(f"\n❌ Failed to process: {url}")
        
        # Summary
        print("\n" + "=" * 80)
        print("WORKFLOW SUMMARY")
        print("=" * 80)
        print(f"Total URLs: {len(args.urls)}")
        print(f"[OK] Successful: {success_count}")
        print(f"[FAIL] Failed: {failed_count}")
        print("=" * 80)
        
        sys.exit(0 if failed_count == 0 else 1)
        
    else:
        # Interactive mode
        print("Enter URLs to process (one per line, empty line to finish):")
        urls = []
        
        while True:
            url = input().strip()
            if not url:
                break
            urls.append(url)
        
        if not urls:
            print("No URLs provided. Exiting.")
            sys.exit(1)
        
        success_count = 0
        failed_count = 0
        
        for i, url in enumerate(urls, 1):
            print(f"\n{'='*80}")
            print(f"PROCESSING {i}/{len(urls)}")
            print(f"{'='*80}")
            
            result = process_url(url)
            if result:
                success_count += 1
            else:
                failed_count += 1
        
        # Summary
        print("\n" + "=" * 80)
        print("WORKFLOW SUMMARY")
        print("=" * 80)
        print(f"Total URLs: {len(urls)}")
        print(f"[OK] Successful: {success_count}")
        print(f"[FAIL] Failed: {failed_count}")
        print("=" * 80)


if __name__ == "__main__":
    main()
