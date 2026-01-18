"""
Media Downloader and Processor

This module downloads media from various platforms (TikTok, Instagram, Twitter/X, YouTube)
and processes them using AI:

- VIDEOS: Analyzed with Overshoot AI to generate:
  * topic.txt (1-3 words topic label)
  * summary.txt (comprehensive summary)

- NON-VIDEOS (documents, images, text): Analyzed with Gemini API to generate:
  * topic.txt (1-3 words topic label)
  * summary.txt (comprehensive summary)

Usage:
    python downloader.py                           # Interactive mode - prompts for URL
    python downloader.py <url>                     # Download from URL
    python downloader.py --input <file_path>       # Process local file
    python downloader.py --process-only <file>     # Process existing file without download

Environment Variables:
    RAPIDAPI_KEY      - RapidAPI key for social media downloads
    OVERSHOOT_API_KEY - Overshoot AI API key for video processing
    GEMINI_API_KEY    - Google Gemini API key for non-video processing

Output Structure:
    processes/outputs/<input_stem>/
        topic.txt   - Topic label (1-3 words)
        summary.txt - Full summary
"""

import requests
import sys
import os
import re
import json
import argparse
import logging
from pathlib import Path
from typing import Optional, Tuple

# Load environment variables from .env file
from dotenv import load_dotenv

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent

# Load .env file from the script directory
load_dotenv(SCRIPT_DIR / '.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Import local modules
from media_classifier import is_video, get_file_type
from overshoot_client import (
    process_video_with_overshoot,
    check_overshoot_status,
    OVERSHOOT_AVAILABLE
)
from gemini_client import (
    process_document_with_gemini,
    process_video_with_gemini,  # NEW: Gemini can now process videos too
    check_gemini_availability,
    GEMINI_AVAILABLE
)

# Configuration: Which AI to use for videos
# Set to "gemini" for reliable HTTP-based processing (works on restricted networks like eduroam)
# Set to "overshoot" for WebRTC-based processing (requires unrestricted UDP traffic)
VIDEO_PROCESSOR = os.environ.get('VIDEO_PROCESSOR', 'gemini').lower()

# Configuration - loaded from .env file
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OVERSHOOT_API_KEY = os.environ.get('OVERSHOOT_API_KEY')
OUTPUT_BASE_DIR = SCRIPT_DIR / "outputs"


# ============================================
# Utility Functions
# ============================================

def get_output_dir(input_name: str) -> Path:
    """
    Get the output directory for a given input file/URL.
    
    Args:
        input_name: Name of the input (filename or URL identifier)
        
    Returns:
        Path to the output directory
    """
    # Sanitize the name for use as directory
    safe_name = re.sub(r'[^\w\-_]', '_', input_name)
    safe_name = safe_name[:50]  # Limit length
    
    out_dir = OUTPUT_BASE_DIR / safe_name
    out_dir.mkdir(parents=True, exist_ok=True)
    
    return out_dir


def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/v\/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def parse_subtitles_to_text(subtitle_content: str) -> str:
    """Parse subtitle content (SRT/VTT/XML) and extract plain text."""
    text = re.sub(r'<[^>]+>', '', subtitle_content)
    text = re.sub(r'\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}', '', text)
    text = re.sub(r'^WEBVTT.*?\n\n', '', text, flags=re.DOTALL)
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# ============================================
# Media Processing Pipeline
# ============================================

def process_media(file_path: str, output_name: Optional[str] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Process a media file using the appropriate AI service.
    
    - VIDEOS: Use Overshoot AI -> topic.txt + summary.txt
    - NON-VIDEOS: Use Gemini API -> topic.txt + summary.txt
    
    Args:
        file_path: Path to the media file
        output_name: Optional name for the output directory
        
    Returns:
        Tuple of (topic_path, summary_path, processor_used)
        - For videos: (topic_path, summary_path, "overshoot")
        - For non-videos: (topic_path, summary_path, "gemini")
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None, None, None
    
    # Determine output directory
    if output_name:
        out_dir = get_output_dir(output_name)
    else:
        out_dir = get_output_dir(Path(file_path).stem)
    
    logger.info(f"Processing: {file_path}")
    logger.info(f"Output directory: {out_dir}")
    
    # Classify the file
    file_type = get_file_type(file_path)
    is_video_file = file_type == 'video'
    
    logger.info(f"Detected file type: {file_type}")
    
    if is_video_file:
        # ========================================
        # VIDEO: Use Gemini (default) or Overshoot
        # ========================================
        
        if VIDEO_PROCESSOR == 'overshoot':
            # Try Overshoot (WebRTC-based - may fail on restricted networks like eduroam)
            logger.info("=" * 50)
            logger.info("Processing as VIDEO with OVERSHOOT AI")
            logger.info("NOTE: Overshoot uses WebRTC - may fail on restricted networks")
            logger.info("=" * 50)
            
            if not OVERSHOOT_AVAILABLE:
                logger.warning("Overshoot SDK not available, falling back to Gemini")
            else:
                overshoot_status = check_overshoot_status()
                if not overshoot_status['available']:
                    logger.warning(f"Overshoot not ready: {overshoot_status['message']}, falling back to Gemini")
                else:
                    try:
                        topic_path, summary_path = process_video_with_overshoot(file_path, str(out_dir))
                        logger.info(f"[OK] Topic saved to: {topic_path}")
                        logger.info(f"[OK] Summary saved to: {summary_path}")
                        return topic_path, summary_path, "overshoot"
                    except Exception as e:
                        logger.warning(f"Overshoot failed: {e}")
                        logger.info("Falling back to Gemini for video processing...")
        
        # Use Gemini for video (HTTP-based - works on all networks including eduroam)
        logger.info("=" * 50)
        logger.info("Processing as VIDEO with GEMINI AI")
        logger.info("Using HTTP upload - works on restricted networks")
        logger.info("=" * 50)
        
        if not GEMINI_AVAILABLE:
            logger.error("Gemini SDK not installed. Run: pip install google-generativeai")
            return None, None, None
        
        gemini_status = check_gemini_availability()
        if not gemini_status['available']:
            logger.error(f"Gemini AI not ready: {gemini_status['message']}")
            return None, None, None
        
        try:
            topic_path, summary_path = process_video_with_gemini(file_path, str(out_dir))
            logger.info(f"[OK] Topic saved to: {topic_path}")
            logger.info(f"[OK] Summary saved to: {summary_path}")
            return topic_path, summary_path, "gemini"
        except Exception as e:
            logger.error(f"Gemini video processing failed: {e}")
            return None, None, None
    
    else:
        # ========================================
        # NON-VIDEO: Use Gemini API
        # ========================================
        logger.info("=" * 50)
        logger.info("Processing as NON-VIDEO with GEMINI API")
        logger.info("=" * 50)
        
        if not GEMINI_AVAILABLE:
            logger.error("Gemini SDK not installed. Run: pip install google-generativeai")
            return None, None, None
        
        gemini_status = check_gemini_availability()
        if not gemini_status['available']:
            logger.error(f"Gemini AI not ready: {gemini_status['message']}")
            return None, None, None
        
        try:
            topic_path, summary_path = process_document_with_gemini(file_path, str(out_dir))
            logger.info(f"[OK] Topic saved to: {topic_path}")
            logger.info(f"[OK] Summary saved to: {summary_path}")
            return topic_path, summary_path, "gemini"
        except Exception as e:
            logger.error(f"Gemini processing failed: {e}")
            return None, None, None


# ============================================
# Platform Downloaders
# ============================================

def download_tiktok(url: str) -> Optional[str]:
    """Download TikTok video using RapidAPI."""
    api_url = "https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index"
    
    headers = {
        "X-RapidAPI-Host": "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    logger.info("Fetching TikTok video info...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    video_url = None
    if isinstance(data, dict):
        video_url = data.get("video") or data.get("video_url") or data.get("play") or data.get("download_url")
        if not video_url and "data" in data:
            video_url = data["data"].get("video") or data["data"].get("play")
    
    if isinstance(video_url, list) and len(video_url) > 0:
        video_url = video_url[0]
    
    if video_url:
        logger.info("Downloading TikTok video...")
        video_response = requests.get(video_url)
        
        out_dir = get_output_dir("tiktok_video")
        filename = out_dir / "tiktok_video.mp4"
        
        with open(filename, "wb") as f:
            f.write(video_response.content)
        
        logger.info(f"[OK] Video saved: {filename}")
        return str(filename)
    else:
        logger.error("Could not find TikTok video URL")
        logger.debug(f"API Response: {data}")
        return None


def download_instagram(url: str) -> Optional[str]:
    """Download Instagram video/reel using RapidAPI."""
    api_url = "https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi"
    
    headers = {
        "X-RapidAPI-Host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    logger.info("Fetching Instagram video info...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    video_url = None
    if isinstance(data, dict):
        video_url = (data.get("video") or data.get("video_url") or 
                    data.get("download_url") or data.get("downloadUrl"))
        
        if not video_url and "data" in data:
            nested = data["data"]
            if isinstance(nested, dict):
                video_url = nested.get("video") or nested.get("url") or nested.get("downloadUrl")
            elif isinstance(nested, list) and len(nested) > 0:
                video_url = nested[0].get("video") or nested[0].get("url") if isinstance(nested[0], dict) else nested[0]
        
        if not video_url and "result" in data:
            result = data["result"]
            if isinstance(result, list) and len(result) > 0:
                video_url = result[0].get("url") or result[0].get("video") if isinstance(result[0], dict) else result[0]
            elif isinstance(result, dict):
                video_url = result.get("url") or result.get("video")
    
    if isinstance(video_url, list) and len(video_url) > 0:
        video_url = video_url[0]
    
    if video_url and isinstance(video_url, str) and video_url.startswith("http"):
        logger.info("Downloading Instagram video...")
        video_response = requests.get(video_url)
        
        out_dir = get_output_dir("instagram_video")
        filename = out_dir / "instagram_video.mp4"
        
        with open(filename, "wb") as f:
            f.write(video_response.content)
        
        logger.info(f"[OK] Video saved: {filename}")
        return str(filename)
    else:
        logger.error("Could not find Instagram video URL")
        logger.debug(f"API Response: {data}")
        return None


def download_twitter(url: str) -> Optional[str]:
    """Export Twitter/X tweet text and metadata using RapidAPI."""
    api_url = "https://twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com/tweetgrab"
    
    headers = {
        "X-RapidAPI-Host": "twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    logger.info("Fetching Twitter/X tweet info...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    logger.debug(f"Twitter API response: {json.dumps(data, indent=2)[:1000]}")
    
    out_dir = get_output_dir("twitter_tweet")
    filename = out_dir / "twitter_tweet_data.txt"
    
    if isinstance(data, dict):
        # Check for API error
        if data.get("error") or data.get("status") == 400:
            logger.error(f"Twitter API error: {data.get('error', 'Unknown error')}")
            # Save error info
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"Error: {data.get('error', 'Could not fetch tweet')}\n")
                f.write(f"URL: {url}\n")
            return str(filename)
        
        # Extract tweet information - handle various API response formats
        tweet_text = None
        author = None
        author_handle = None
        likes = None
        created_at = None
        
        # Direct fields (main response format)
        tweet_text = (data.get("description") or data.get("text") or 
                     data.get("tweet_text") or data.get("content") or data.get("message"))
        likes = data.get("favorite_count") or data.get("likes") or data.get("like_count")
        created_at = data.get("created_at")
        
        # User info from nested user object
        user_data = data.get("user", {})
        if isinstance(user_data, dict):
            author = user_data.get("name") or user_data.get("author")
            author_handle = user_data.get("screen_name") or user_data.get("username")
        
        # Fallback to top-level user fields
        if not author:
            author = (data.get("author") or data.get("name") or 
                     data.get("author_name") or data.get("username"))
        if not author_handle:
            author_handle = data.get("screen_name") or data.get("username")
        
        # Check nested 'tweet' field
        if "tweet" in data and isinstance(data["tweet"], dict):
            tweet = data["tweet"]
            tweet_text = tweet_text or tweet.get("text") or tweet.get("description")
            likes = likes or tweet.get("favorite_count") or tweet.get("likes")
            if "user" in tweet and isinstance(tweet["user"], dict):
                author = author or tweet["user"].get("name")
                author_handle = author_handle or tweet["user"].get("screen_name")
        
        # Check nested 'data' field
        if "data" in data and isinstance(data["data"], dict):
            nested = data["data"]
            tweet_text = tweet_text or nested.get("text") or nested.get("description")
            likes = likes or nested.get("favorite_count") or nested.get("likes")
        
        # Build tweet data with all available info
        tweet_data_lines = []
        
        if author:
            author_str = f"{author}"
            if author_handle:
                author_str += f" (@{author_handle})"
            tweet_data_lines.append(f"Author: {author_str}")
        else:
            tweet_data_lines.append("Author: N/A")
        
        if created_at:
            tweet_data_lines.append(f"Date: {created_at}")
        
        tweet_data_lines.append(f"Likes: {likes if likes is not None else 'N/A'}")
        tweet_data_lines.append(f"\nTweet:\n{tweet_text or 'N/A'}")
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write("\n".join(tweet_data_lines))
        
        logger.info(f"[OK] Tweet data saved: {filename}")
        
        # Log what we extracted
        if tweet_text:
            logger.info(f"Tweet preview: {tweet_text[:100]}...")
        
        return str(filename)
    
    logger.error("Could not parse Twitter response")
    return None


def download_youtube(url: str) -> Optional[str]:
    """Download YouTube video using RapidAPI."""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        logger.error("Could not extract YouTube video ID from URL")
        return None
    
    api_url = "https://youtube-media-downloader.p.rapidapi.com/v2/video/details"
    
    headers = {
        "X-RapidAPI-Host": "youtube-media-downloader.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {
        "videoId": video_id,
        "urlAccess": "normal",
        "videos": "auto",
        "audios": "auto"
    }
    
    logger.info(f"Fetching YouTube video info for ID: {video_id}...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    video_url = None
    target_quality = "480p"
    
    if isinstance(data, dict):
        if "videos" in data and isinstance(data["videos"], dict):
            items = data["videos"].get("items", [])
            if items:
                # Try to find 480p with audio
                for item in items:
                    if item.get("quality") == target_quality and item.get("hasAudio") and item.get("url"):
                        video_url = item["url"]
                        logger.info(f"Found video: {item.get('quality')} ({item.get('sizeText', 'unknown size')})")
                        break
                
                # Fallback: any video with audio
                if not video_url:
                    for item in items:
                        if item.get("hasAudio") and item.get("url"):
                            video_url = item["url"]
                            logger.info(f"Found video: {item.get('quality')} ({item.get('sizeText', 'unknown size')})")
                            break
                
                # Last fallback: first video
                if not video_url and items:
                    video_url = items[0].get("url")
        
        if not video_url and "videos" in data and isinstance(data["videos"], list) and data["videos"]:
            video_url = data["videos"][0].get("url")
        
        if not video_url:
            video_url = data.get("url") or data.get("video_url") or data.get("downloadUrl")
    
    if isinstance(video_url, list) and video_url:
        video_url = video_url[0]
    
    out_dir = get_output_dir(f"youtube_{video_id}")
    
    if video_url and isinstance(video_url, str) and video_url.startswith("http"):
        logger.info("Downloading YouTube video...")
        video_response = requests.get(video_url)
        
        filename = out_dir / "youtube_video.mp4"
        with open(filename, "wb") as f:
            f.write(video_response.content)
        
        logger.info(f"[OK] Video saved: {filename}")
        
        # Also download captions if available
        if isinstance(data, dict) and "subtitles" in data:
            subtitles_data = data["subtitles"]
            if isinstance(subtitles_data, dict) and "items" in subtitles_data:
                items = subtitles_data["items"]
                if items:
                    subtitle_url = items[0].get("url")
                    subtitle_lang = items[0].get("code", "unknown")
                    
                    if subtitle_url:
                        logger.info(f"Downloading captions ({subtitle_lang})...")
                        try:
                            subtitle_response = requests.get(subtitle_url)
                            plain_text = parse_subtitles_to_text(subtitle_response.text)
                            
                            if plain_text:
                                caption_filename = out_dir / "youtube_captions.txt"
                                with open(caption_filename, "w", encoding="utf-8") as f:
                                    f.write(plain_text)
                                logger.info(f"[OK] Captions saved: {caption_filename}")
                        except Exception as e:
                            logger.warning(f"Failed to download captions: {e}")
        
        return str(filename)
    else:
        logger.error("Could not find YouTube video URL")
        logger.debug(f"API Response: {data}")
        return None


# ============================================
# Main Entry Point
# ============================================

def download_and_process(url: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Download media from URL and process it with AI.
    
    Args:
        url: URL to download from
        
    Returns:
        Tuple of (downloaded_file_path, topic_path, summary_path, processor_used)
    """
    url_lower = url.lower()
    downloaded_file = None
    
    # Download based on platform
    if "tiktok.com" in url_lower or "vm.tiktok.com" in url_lower:
        downloaded_file = download_tiktok(url)
    elif "instagram.com" in url_lower:
        downloaded_file = download_instagram(url)
    elif "twitter.com" in url_lower or "x.com" in url_lower:
        downloaded_file = download_twitter(url)
    elif "youtube.com" in url_lower or "youtu.be" in url_lower:
        downloaded_file = download_youtube(url)
    else:
        logger.error("Unsupported URL. Supported platforms: TikTok, Instagram, Twitter/X, YouTube")
        return None, None, None, None
    
    if not downloaded_file:
        return None, None, None, None
    
    # Process the downloaded file
    topic_path, summary_path, processor = process_media(downloaded_file)
    
    return downloaded_file, topic_path, summary_path, processor


def main():
    """Main entry point with argument parsing."""
    parser = argparse.ArgumentParser(
        description="Download and process media from social platforms",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
AI Processing:
  - VIDEOS: Processed with Overshoot AI -> topic.txt + summary.txt
  - NON-VIDEOS: Processed with Gemini API -> category.txt + summary.txt

Examples:
  python downloader.py https://www.tiktok.com/@user/video/123
  python downloader.py --input ./my_video.mp4
  python downloader.py --process-only ./existing_file.mp4
        """
    )
    
    parser.add_argument('url', nargs='?', help='URL to download from')
    parser.add_argument('--input', '-i', help='Local file path to process')
    parser.add_argument('--process-only', '-p', help='Process existing file without download')
    parser.add_argument('--output-name', '-o', help='Custom name for output directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("=" * 60)
    print("Media Downloader & AI Processor")
    print("=" * 60)
    print()
    print("AI Services:")
    if VIDEO_PROCESSOR == 'gemini':
        print("  - Videos     -> Gemini API (HTTP upload - works on eduroam/restricted networks)")
    else:
        print("  - Videos     -> Overshoot AI (WebRTC - requires unrestricted network)")
    print("  - Non-Videos -> Gemini API (topic + summary)")
    print()
    print(f"Video Processor: {VIDEO_PROCESSOR.upper()} (set VIDEO_PROCESSOR env var to change)")
    print()
    
    # Check AI service availability
    overshoot_status = check_overshoot_status()
    gemini_status = check_gemini_availability()
    
    print("Service Status:")
    if gemini_status['available']:
        print("  [OK] Gemini API: Ready (primary for videos)")
    else:
        print(f"  [X] Gemini API: {gemini_status['message']}")
    
    if overshoot_status['available']:
        print("  [OK] Overshoot AI: Ready (alternative, requires open network)")
    else:
        print(f"  [--] Overshoot AI: {overshoot_status['message']} (optional)")
    
    print()
    
    # Process based on arguments
    if args.process_only:
        # Process existing file
        logger.info(f"Processing existing file: {args.process_only}")
        topic_path, summary_path, processor = process_media(args.process_only, args.output_name)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        if processor:
            print(f"Processor used: {processor.upper()}")
        if topic_path:
            print(f"Topic file: {topic_path}")
        if summary_path:
            print(f"Summary file: {summary_path}")
        
    elif args.input:
        # Process local file
        logger.info(f"Processing local file: {args.input}")
        topic_path, summary_path, processor = process_media(args.input, args.output_name)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        if processor:
            print(f"Processor used: {processor.upper()}")
        if topic_path:
            print(f"Topic file: {topic_path}")
        if summary_path:
            print(f"Summary file: {summary_path}")
        
    elif args.url:
        # Download and process from URL
        downloaded, topic_path, summary_path, processor = download_and_process(args.url)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        if downloaded:
            print(f"Downloaded file: {downloaded}")
        if processor:
            print(f"Processor used: {processor.upper()}")
        if topic_path:
            print(f"Topic file: {topic_path}")
        if summary_path:
            print(f"Summary file: {summary_path}")
        
    else:
        # Interactive mode
        url = input("Enter the TikTok, Instagram, Twitter/X, or YouTube URL: ").strip()
        
        if not url:
            print("No URL provided. Exiting.")
            sys.exit(1)
        
        downloaded, topic_path, summary_path, processor = download_and_process(url)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        if downloaded:
            print(f"Downloaded file: {downloaded}")
        if processor:
            print(f"Processor used: {processor.upper()}")
        if topic_path:
            print(f"Topic file: {topic_path}")
        if summary_path:
            print(f"Summary file: {summary_path}")


if __name__ == "__main__":
    main()
