"""
Gemini AI Client Module
Handles document, image, AND VIDEO analysis using Google's Gemini API.

For all media types: Generates topic label (1-3 words) and summary.

Gemini supports:
- Videos: Up to 45-60 minutes, uploaded via Files API (no WebRTC required)
- Images: Direct upload or inline
- Documents: Text extraction + analysis

Environment Variables Required:
- GEMINI_API_KEY: Your Google Gemini API key
"""

import os
import logging
import time
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

# Load environment variables from .env file
from dotenv import load_dotenv

# Load .env file from the script directory
SCRIPT_DIR = Path(__file__).parent
load_dotenv(SCRIPT_DIR / '.env')

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to import google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Run: pip install google-generativeai")

# Video extensions supported by Gemini
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v', '.wmv', '.flv', '.3gp', '.mpeg', '.mpg'}
VIDEO_MIME_TYPES = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/x-m4v',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.3gp': 'video/3gpp',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
}


def _get_api_key() -> str:
    """Get Gemini API key from .env file or environment."""
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env file or environment")
    return api_key


def _configure_gemini():
    """Configure Gemini with API key."""
    if not GEMINI_AVAILABLE:
        raise ImportError("google-generativeai package not installed")
    genai.configure(api_key=_get_api_key())


def _is_video_file(file_path: str) -> bool:
    """Check if file is a video based on extension."""
    ext = Path(file_path).suffix.lower()
    return ext in VIDEO_EXTENSIONS


def process_video_with_gemini(video_path: str, out_dir: str) -> Tuple[str, str]:
    """
    Process a video file using Gemini AI to generate topic and summary.
    
    Uses Gemini's Files API for video upload - works without WebRTC.
    This is more reliable than WebRTC-based solutions in restricted networks.
    
    Args:
        video_path: Path to the video file
        out_dir: Directory to save output files
        
    Returns:
        Tuple of (topic_path, summary_path) - paths to the generated files
    """
    _configure_gemini()
    
    # Create output directory
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    topic_path = out_path / "topic.txt"
    summary_path = out_path / "summary.txt"
    video_file = Path(video_path)
    
    if not video_file.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    ext = video_file.suffix.lower()
    mime_type = VIDEO_MIME_TYPES.get(ext, 'video/mp4')
    
    logger.info(f"Processing video with Gemini: {video_path}")
    logger.info(f"Video size: {video_file.stat().st_size / (1024*1024):.2f} MB")
    
    uploaded_file = None
    
    try:
        # Upload the video file using Gemini Files API
        logger.info("Uploading video to Gemini Files API...")
        uploaded_file = genai.upload_file(
            path=str(video_path),
            mime_type=mime_type,
            display_name=video_file.name
        )
        logger.info(f"Upload started, file name: {uploaded_file.name}")
        
        # Wait for the file to be processed
        logger.info("Waiting for video processing...")
        max_wait_time = 300  # 5 minutes max wait
        wait_interval = 5
        total_waited = 0
        
        while uploaded_file.state.name == "PROCESSING":
            if total_waited >= max_wait_time:
                raise TimeoutError(f"Video processing timed out after {max_wait_time} seconds")
            
            time.sleep(wait_interval)
            total_waited += wait_interval
            uploaded_file = genai.get_file(uploaded_file.name)
            
            if total_waited % 15 == 0:  # Log every 15 seconds
                logger.info(f"Still processing... ({total_waited}s elapsed)")
        
        if uploaded_file.state.name == "FAILED":
            raise RuntimeError(f"Video processing failed: {uploaded_file.state.name}")
        
        logger.info(f"Video processed successfully in {total_waited}s")
        
        # Use Gemini model for video analysis
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Generate topic (1-3 words)
        logger.info("Generating topic label from video...")
        topic_prompt = """Watch this video carefully and provide ONLY a topic label.

STRICT REQUIREMENTS:
- Return ONLY 1-3 words maximum
- No punctuation, no extra text, no explanation
- Use generic, stable phrasing that describes the main subject
- Examples: "Cooking Tutorial", "Dance Video", "Product Review", "Travel Vlog", "Comedy Skit", "Nature Scene"

Topic:"""
        
        topic_response = model.generate_content([uploaded_file, topic_prompt])
        topic = topic_response.text.strip()
        
        # Clean topic - ensure 1-3 words, no extra punctuation
        topic = ''.join(c for c in topic if c.isalnum() or c.isspace())
        topic_words = topic.split()
        if len(topic_words) > 3:
            topic = ' '.join(topic_words[:3])
        topic = ' '.join(topic.split())  # Normalize whitespace
        
        if not topic:
            topic = "Video Content"
        
        logger.info(f"Generated topic: {topic}")
        
        # Generate comprehensive summary
        logger.info("Generating video summary...")
        summary_prompt = """Watch this video carefully and provide a comprehensive summary.

Include:
- Main subject and what happens in the video
- Key actions, events, or scenes
- Any text, speech, or audio content if present
- People, objects, or locations shown
- Overall mood, style, or purpose of the video
- Timeline of events if applicable

Provide the summary as well-organized plain text."""
        
        summary_response = model.generate_content([uploaded_file, summary_prompt])
        summary = summary_response.text.strip()
        
        if not summary:
            summary = "Unable to generate summary for this video."
        
        logger.info(f"Generated summary ({len(summary)} characters)")
        
        # Write outputs
        with open(topic_path, 'w', encoding='utf-8') as f:
            f.write(topic)
        logger.info(f"Topic saved to: {topic_path}")
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        logger.info(f"Summary saved to: {summary_path}")
        
        return str(topic_path), str(summary_path)
        
    except Exception as e:
        logger.error(f"Error processing video with Gemini: {e}")
        
        with open(topic_path, 'w', encoding='utf-8') as f:
            f.write("Error")
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(f"Video analysis failed: {str(e)}")
        
        raise
    
    finally:
        # Clean up uploaded file
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
                logger.info("Cleaned up uploaded video file from Gemini")
            except Exception as e:
                logger.warning(f"Could not delete uploaded file: {e}")


def process_document_with_gemini(input_path: str, out_dir: str) -> Tuple[str, str]:
    """
    Process a NON-VIDEO document using Gemini AI to generate topic and summary.
    
    This function is ONLY for non-video files (text, PDF, images).
    Videos should be processed with Overshoot AI.
    
    Args:
        input_path: Path to the input file (text, PDF, or image)
        out_dir: Directory to save output files
        
    Returns:
        Tuple of (topic_path, summary_path) - paths to the generated files
    """
    _configure_gemini()
    
    # Create output directory
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    topic_path = out_path / "topic.txt"
    summary_path = out_path / "summary.txt"
    input_file = Path(input_path)
    
    try:
        # Use Gemini model for text/document analysis
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Determine file type and extract/upload content
        ext = input_file.suffix.lower()
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
        
        if ext in image_extensions:
            # Upload image for visual analysis
            logger.info(f"Processing image: {input_path}")
            uploaded_file = genai.upload_file(path=input_path)
            content_input = uploaded_file
        else:
            # Extract text content
            content = _extract_content(input_path)
            if not content:
                with open(topic_path, 'w', encoding='utf-8') as f:
                    f.write("Unknown")
                with open(summary_path, 'w', encoding='utf-8') as f:
                    f.write("Unable to extract content from this file type.")
                return str(topic_path), str(summary_path)
            
            # Truncate if too long
            max_chars = 30000
            if len(content) > max_chars:
                content = content[:max_chars] + "\n\n[Content truncated...]"
                logger.info(f"Content truncated to {max_chars} characters")
            
            content_input = content
        
        # Generate topic (1-3 words)
        logger.info("Generating topic label...")
        
        if ext in image_extensions:
            topic_prompt = """Analyze this image and provide ONLY a topic label.

STRICT REQUIREMENTS:
- Return ONLY 1-3 words maximum
- No punctuation
- No extra text or explanation
- Use generic, stable phrasing
- Examples: "Nature Photography", "Food", "Document", "Portrait", "Infographic"

Topic:"""
            topic_response = model.generate_content([content_input, topic_prompt])
        else:
            topic_prompt = f"""Analyze this document and provide ONLY a topic label.

STRICT REQUIREMENTS:
- Return ONLY 1-3 words maximum
- No punctuation
- No extra text or explanation
- Use generic, stable phrasing
- Examples: "Technical Report", "News Article", "Recipe", "Legal Document", "Meeting Notes"

Document content:
{content_input}

Topic:"""
            topic_response = model.generate_content(topic_prompt)
        
        topic = topic_response.text.strip()
        
        # Clean topic - ensure 1-3 words, no extra punctuation
        topic = ''.join(c for c in topic if c.isalnum() or c.isspace())
        topic_words = topic.split()
        if len(topic_words) > 3:
            topic = ' '.join(topic_words[:3])
        topic = ' '.join(topic.split())  # Normalize whitespace
        
        logger.info(f"Generated topic: {topic}")
        
        # Generate summary
        logger.info("Generating summary...")
        
        if ext in image_extensions:
            summary_prompt = """Analyze this image and provide a comprehensive summary.

Include:
- Main subject and content of the image
- Key details and elements visible
- Any text visible in the image
- Context or setting if apparent
- Overall mood or style

Provide the summary as plain text."""
            summary_response = model.generate_content([content_input, summary_prompt])
        else:
            summary_prompt = f"""Summarize the following document comprehensively.

Include:
- Main topic and purpose
- Key points and information
- Important details
- Conclusions or takeaways if any

Provide the summary as plain text, well-organized.

Document content:
{content_input}

Summary:"""
            summary_response = model.generate_content(summary_prompt)
        
        summary = summary_response.text.strip()
        
        logger.info(f"Generated summary ({len(summary)} characters)")
        
        # Write outputs
        with open(topic_path, 'w', encoding='utf-8') as f:
            f.write(topic)
        logger.info(f"Topic saved to: {topic_path}")
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        logger.info(f"Summary saved to: {summary_path}")
        
        # Clean up uploaded file if it was an image
        if ext in image_extensions:
            try:
                genai.delete_file(uploaded_file.name)
            except:
                pass
        
        return str(topic_path), str(summary_path)
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        
        with open(topic_path, 'w', encoding='utf-8') as f:
            f.write("Error")
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(f"Document analysis failed: {str(e)}")
        
        raise


def _extract_content(file_path: str) -> Optional[str]:
    """
    Extract text content from various file types.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Extracted text content or None if extraction fails
    """
    path = Path(file_path)
    ext = path.suffix.lower()
    
    # Plain text files
    text_extensions = {'.txt', '.md', '.json', '.csv', '.xml', '.html', '.htm', '.log', '.yaml', '.yml'}
    
    if ext in text_extensions:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading text file: {e}")
            return None
    
    # PDF files
    if ext == '.pdf':
        return _extract_pdf_text(file_path)
    
    return None


def _extract_pdf_text(pdf_path: str) -> Optional[str]:
    """
    Extract text from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text or None if extraction fails
    """
    # Try PyPDF2 first
    try:
        import PyPDF2
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            if text_parts:
                return '\n'.join(text_parts)
    except ImportError:
        logger.warning("PyPDF2 not installed. Run: pip install PyPDF2")
    except Exception as e:
        logger.warning(f"PyPDF2 extraction failed: {e}")
    
    # Try pdfplumber as fallback
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            text_parts = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            if text_parts:
                return '\n'.join(text_parts)
    except ImportError:
        logger.warning("pdfplumber not installed. Run: pip install pdfplumber")
    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}")
    
    logger.error("Could not extract text from PDF. Install PyPDF2 or pdfplumber.")
    return None


def check_gemini_availability() -> Dict[str, Any]:
    """
    Check if Gemini AI is available and configured.
    
    Returns:
        Dict with availability status and details
    """
    has_api_key = bool(os.environ.get('GEMINI_API_KEY'))
    
    result = {
        'sdk_installed': GEMINI_AVAILABLE,
        'api_key_set': has_api_key,
        'available': False,
        'message': ''
    }
    
    if not GEMINI_AVAILABLE:
        result['message'] = "google-generativeai not installed. Run: pip install google-generativeai"
    elif not has_api_key:
        result['message'] = "GEMINI_API_KEY not set in .env file"
    else:
        result['available'] = True
        result['message'] = "Gemini AI is ready"
    
    return result


if __name__ == "__main__":
    # Test the module
    print("Gemini AI Client Module (Non-Video Processing)")
    print("-" * 40)
    status = check_gemini_availability()
    print(f"SDK installed: {status['sdk_installed']}")
    print(f"API key set: {status['api_key_set']}")
    print(f"Available: {status['available']}")
    print(f"Message: {status['message']}")
