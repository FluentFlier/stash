"""
Media Classifier Module
Detects whether a file is a video or non-video based on MIME type and extension.
"""

import os
import mimetypes

# Video file extensions
VIDEO_EXTENSIONS = {
    '.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v',
    '.wmv', '.flv', '.3gp', '.mpeg', '.mpg', '.ogv'
}

# Video MIME type prefixes
VIDEO_MIME_PREFIXES = ('video/',)


def is_video(file_path: str) -> bool:
    """
    Determine if a file is a video.
    
    Uses MIME type detection (preferred) with file extension fallback.
    If ambiguous, defaults to False (not a video).
    
    Args:
        file_path: Path to the file to check
        
    Returns:
        True if the file is a video, False otherwise
    """
    if not file_path or not os.path.exists(file_path):
        return False
    
    # Method 1: Try MIME type detection
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        if mime_type.startswith(VIDEO_MIME_PREFIXES):
            return True
        # If MIME type is detected but not video, return False
        return False
    
    # Method 2: Fallback to extension check
    _, ext = os.path.splitext(file_path)
    if ext.lower() in VIDEO_EXTENSIONS:
        return True
    
    # Default: not a video if ambiguous
    return False


def get_file_type(file_path: str) -> str:
    """
    Get a descriptive file type for the given file.
    
    Args:
        file_path: Path to the file
        
    Returns:
        String describing the file type (e.g., 'video', 'image', 'pdf', 'text', 'unknown')
    """
    if not file_path or not os.path.exists(file_path):
        return 'unknown'
    
    mime_type, _ = mimetypes.guess_type(file_path)
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    
    # Check video first
    if is_video(file_path):
        return 'video'
    
    # Check other types
    if mime_type:
        if mime_type.startswith('image/'):
            return 'image'
        if mime_type == 'application/pdf':
            return 'pdf'
        if mime_type.startswith('text/') or mime_type in ('application/json', 'application/xml'):
            return 'text'
    
    # Extension-based fallback
    text_extensions = {'.txt', '.md', '.json', '.csv', '.xml', '.html', '.htm', '.log', '.yaml', '.yml'}
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico'}
    
    if ext == '.pdf':
        return 'pdf'
    if ext in text_extensions:
        return 'text'
    if ext in image_extensions:
        return 'image'
    
    return 'unknown'


def get_mime_type(file_path: str) -> str:
    """
    Get the MIME type of a file.
    
    Args:
        file_path: Path to the file
        
    Returns:
        MIME type string or 'application/octet-stream' if unknown
    """
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'


if __name__ == "__main__":
    # Test the classifier
    test_files = [
        "test.mp4",
        "test.mov",
        "test.txt",
        "test.pdf",
        "test.jpg",
        "test.unknown"
    ]
    
    print("Media Classifier Test:")
    print("-" * 40)
    for f in test_files:
        print(f"{f}: is_video={is_video(f)}, type={get_file_type(f)}")
