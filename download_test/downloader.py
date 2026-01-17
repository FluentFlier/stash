import requests
import sys
import os
import re
import json

# Insert your RapidAPI key here
RAPIDAPI_KEY = "35c5169ed5msh6abfaf2b5ac5453p1100afjsn0c25c39fc5b8"


def extract_youtube_video_id(url):
    """Extract video ID from various YouTube URL formats"""
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


def parse_subtitles_to_text(subtitle_content):
    """Parse subtitle content (SRT/VTT/XML) and extract plain text as words separated by spaces"""
    # Remove XML tags (YouTube uses XML format for auto-captions)
    text = re.sub(r'<[^>]+>', '', subtitle_content)
    # Remove timestamp lines (SRT format: 00:00:00,000 --> 00:00:00,000)
    text = re.sub(r'\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}', '', text)
    # Remove VTT header
    text = re.sub(r'^WEBVTT.*?\n\n', '', text, flags=re.DOTALL)
    # Remove sequence numbers (standalone numbers on their own line)
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
    # Remove HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    # Replace newlines and multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    # Clean up and strip
    text = text.strip()
    return text


def download_tiktok(url):
    """Download TikTok video using RapidAPI"""
    api_url = "https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index"
    
    headers = {
        "X-RapidAPI-Host": "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    print("Fetching video info...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    video_url = None
    if isinstance(data, dict):
        video_url = data.get("video") or data.get("video_url") or data.get("play") or data.get("download_url")
        if not video_url and "data" in data:
            video_url = data["data"].get("video") or data["data"].get("play")
    
    # Handle case where video_url is returned as a list
    if isinstance(video_url, list) and len(video_url) > 0:
        video_url = video_url[0]
    
    if video_url:
        print("Downloading video...")
        video_response = requests.get(video_url)
        filename = "tiktok_video.mp4"
        with open(filename, "wb") as f:
            f.write(video_response.content)
        print(f"Done! Saved as: {os.path.abspath(filename)}")
    else:
        print("Could not find video URL.")
        print("API Response:", data)


def download_instagram(url):
    """Download Instagram video/reel using RapidAPI"""
    api_url = "https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi"
    
    headers = {
        "X-RapidAPI-Host": "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    print("Fetching video info...")
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
    
    # Handle case where video_url is returned as a list
    if isinstance(video_url, list) and len(video_url) > 0:
        video_url = video_url[0]
    
    if video_url and isinstance(video_url, str) and video_url.startswith("http"):
        print("Downloading video...")
        video_response = requests.get(video_url)
        filename = "instagram_video.mp4"
        with open(filename, "wb") as f:
            f.write(video_response.content)
        print(f"Done! Saved as: {os.path.abspath(filename)}")
    else:
        print("Could not find video URL.")
        print("API Response:", data)


def download_twitter(url):
    """Export Twitter/X tweet text and metadata using RapidAPI"""
    api_url = "https://twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com/tweetgrab"
    
    headers = {
        "X-RapidAPI-Host": "twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com",
        "X-RapidAPI-Key": RAPIDAPI_KEY
    }
    
    params = {"url": url}
    
    print("Fetching tweet info...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    # Export tweet data to text file (simple format)
    if isinstance(data, dict):
        print("Exporting tweet data...")
        
        # Extract tweet information from various possible structures
        tweet_text = None
        author = None
        likes = None
        
        # Try to extract from top level
        tweet_text = (data.get("text") or data.get("tweet_text") or 
                     data.get("content") or data.get("message") or data.get("description"))
        author = (data.get("author") or data.get("name") or data.get("author_name") or
                 data.get("username") or data.get("screen_name") or data.get("author_username"))
        likes = data.get("likes") or data.get("like_count") or data.get("favorite_count")
        
        # Check nested 'tweet' field
        if "tweet" in data and isinstance(data["tweet"], dict):
            tweet = data["tweet"]
            tweet_text = tweet_text or (tweet.get("text") or tweet.get("content") or 
                                       tweet.get("message") or tweet.get("description"))
            author = author or (tweet.get("author") or tweet.get("name") or tweet.get("author_name") or
                               tweet.get("username") or tweet.get("screen_name") or tweet.get("author_username"))
            likes = likes or tweet.get("likes") or tweet.get("like_count") or tweet.get("favorite_count")
        
        # Check nested 'data' field
        if "data" in data and isinstance(data["data"], dict):
            nested = data["data"]
            tweet_text = tweet_text or (nested.get("text") or nested.get("content") or nested.get("description"))
            author = author or (nested.get("author") or nested.get("name") or
                               nested.get("username") or nested.get("screen_name"))
            likes = likes or nested.get("likes") or nested.get("like_count") or nested.get("favorite_count")
        
        # Build simple tweet data text
        tweet_data_lines = []
        tweet_data_lines.append(f"Author: {author or 'N/A'}")
        tweet_data_lines.append(f"Likes: {likes or 'N/A'}")
        tweet_data_lines.append(f"Tweet: {tweet_text or 'N/A'}")
        
        # Write to file
        filename = "twitter_tweet_data.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write("\n".join(tweet_data_lines))
        print(f"Tweet data saved as: {os.path.abspath(filename)}")


def download_youtube(url):
    """Download YouTube video using RapidAPI"""
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Error: Could not extract video ID from URL.")
        return
    
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
    
    print(f"Fetching video info for ID: {video_id}...")
    response = requests.get(api_url, headers=headers, params=params)
    data = response.json()
    
    # Try to find the video download URL in the response (prefer 480p with audio)
    video_url = None
    target_quality = "480p"
    
    if isinstance(data, dict):
        # Check for 'videos' dict with 'items' array (the actual API structure)
        if "videos" in data and isinstance(data["videos"], dict):
            items = data["videos"].get("items", [])
            if items and len(items) > 0:
                # First, try to find target quality (480p) with audio
                for item in items:
                    if item.get("quality") == target_quality and item.get("hasAudio") and item.get("url"):
                        video_url = item["url"]
                        print(f"Found video: {item.get('quality', 'unknown')} ({item.get('sizeText', 'unknown size')})")
                        break
                
                # Fallback: any video with audio
                if not video_url:
                    for item in items:
                        if item.get("hasAudio") and item.get("url"):
                            video_url = item["url"]
                            print(f"Found video: {item.get('quality', 'unknown')} ({item.get('sizeText', 'unknown size')})")
                            break
                
                # Last fallback: first video
                if not video_url:
                    video_url = items[0].get("url")
                    print(f"Found video: {items[0].get('quality', 'unknown')} ({items[0].get('sizeText', 'unknown size')})")
        
        # Check for 'videos' as direct array (fallback)
        if not video_url and "videos" in data and isinstance(data["videos"], list) and len(data["videos"]) > 0:
            video_url = data["videos"][0].get("url")
        
        # Direct URL fields
        if not video_url:
            video_url = data.get("url") or data.get("video_url") or data.get("downloadUrl")
    
    # Handle case where video_url is returned as a list
    if isinstance(video_url, list) and len(video_url) > 0:
        video_url = video_url[0]
    
    if video_url and isinstance(video_url, str) and video_url.startswith("http"):
        print("Downloading video...")
        video_response = requests.get(video_url)
        filename = "youtube_video.mp4"
        with open(filename, "wb") as f:
            f.write(video_response.content)
        print(f"Done! Saved as: {os.path.abspath(filename)}")
    else:
        print("Could not find video URL.")
        print("API Response:", data)
    
    # Download captions/subtitles if available
    if isinstance(data, dict) and "subtitles" in data:
        subtitles_data = data["subtitles"]
        if isinstance(subtitles_data, dict) and "items" in subtitles_data:
            items = subtitles_data["items"]
            if items and len(items) > 0:
                # Get the first available subtitle (usually English)
                subtitle_url = items[0].get("url")
                subtitle_lang = items[0].get("code", "unknown")
                
                if subtitle_url:
                    print(f"Downloading captions ({subtitle_lang})...")
                    try:
                        subtitle_response = requests.get(subtitle_url)
                        subtitle_content = subtitle_response.text
                        
                        # Parse subtitles to plain text
                        plain_text = parse_subtitles_to_text(subtitle_content)
                        
                        if plain_text:
                            caption_filename = "youtube_captions.txt"
                            with open(caption_filename, "w", encoding="utf-8") as f:
                                f.write(plain_text)
                            print(f"Captions saved as: {os.path.abspath(caption_filename)}")
                        else:
                            print("Captions were empty after parsing.")
                    except Exception as e:
                        print(f"Failed to download captions: {e}")
            else:
                print("No captions available for this video.")
        else:
            print("No captions available for this video.")


def main():
    if len(sys.argv) < 2:
        url = input("Enter the TikTok, Instagram, Twitter/X, or YouTube URL: ").strip()
    else:
        url = sys.argv[1]
    
    url_lower = url.lower()
    
    if "tiktok.com" in url_lower or "vm.tiktok.com" in url_lower:
        download_tiktok(url)
    elif "instagram.com" in url_lower:
        download_instagram(url)
    elif "twitter.com" in url_lower or "x.com" in url_lower:
        download_twitter(url)
    elif "youtube.com" in url_lower or "youtu.be" in url_lower:
        download_youtube(url)
    else:
        print("Error: Please provide a valid TikTok, Instagram, Twitter/X, or YouTube URL.")
        sys.exit(1)


if __name__ == "__main__":
    main()
