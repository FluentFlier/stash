# Media Downloader & AI Processor

Download media from social platforms (TikTok, Instagram, Twitter/X, YouTube) and automatically analyze them using AI.

## AI Processing Pipeline

| Input Type | AI Service (Default) | Outputs |
|------------|----------------------|---------|
| **Videos** | **Gemini API** (HTTP upload) | `topic.txt` (1-3 words) + `summary.txt` |
| **Non-Videos** | **Gemini API** | `topic.txt` (1-3 words) + `summary.txt` |

Both produce the **same output format**: `topic.txt` and `summary.txt`.

### Why Gemini for Videos?

**Gemini API** uses simple HTTP file uploads - works on **any network** including:
- University networks (eduroam)
- Corporate firewalls
- Restricted NAT environments

**Overshoot AI** (optional alternative) uses WebRTC streaming which may fail on restricted networks due to blocked UDP traffic.

## Installation

```bash
# From the repository root directory
pip install -r requirements.txt

# For video processing with Overshoot AI, also install:
# 1. Node.js: https://nodejs.org/
# 2. Overshoot SDK: npm install @overshoot/sdk
```

## Configuration

API keys are stored in a `.env` file in the `download_test` directory.

### Quick Setup

The `.env` file is already configured with working API keys. Just run:

```bash
# From repository root
pip install -r requirements.txt

# Then run the downloader (from root or download_test directory)
cd download_test
python downloader.py
```

### Manual Setup

If you need to use your own keys, edit the `.env` file:

```bash
# Copy the example file (if starting fresh)
cp .env.example .env

# Edit .env with your keys
```

**.env file format:**
```
GEMINI_API_KEY=your-gemini-api-key
OVERSHOOT_API_KEY=your-overshoot-api-key
RAPIDAPI_KEY=your-rapidapi-key
VIDEO_PROCESSOR=gemini
```

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GEMINI_API_KEY` | All media | Google Gemini API key (required) |
| `RAPIDAPI_KEY` | Downloads | RapidAPI key for social media downloads |
| `VIDEO_PROCESSOR` | Videos | `gemini` (default, HTTP) or `overshoot` (WebRTC) |
| `OVERSHOOT_API_KEY` | Videos (optional) | Overshoot AI API key (only if using Overshoot) |

## Usage

**Note:** Run commands from the repository root, or from the `download_test` directory.

### Download from URL (with AI processing)

```bash
# From repository root or download_test directory
cd download_test  # if not already there

# Interactive mode
python downloader.py

# Direct URL
python downloader.py https://www.tiktok.com/@user/video/123
python downloader.py https://www.instagram.com/reel/ABC123/
python downloader.py https://twitter.com/user/status/123456
python downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Process Local Files

```bash
# Process a local video (uses Overshoot AI)
python downloader.py --input ./my_video.mp4

# Process a document (uses Gemini API)
python downloader.py --input ./document.pdf

# Process with custom output name
python downloader.py --input ./file.mp4 --output-name my_analysis
```

### Process Existing Downloaded Files

```bash
python downloader.py --process-only ./outputs/tiktok_video/tiktok_video.mp4
```

## Output Structure

All outputs are saved in the `outputs/` directory with **consistent format**:

```
download_test/
├── outputs/
│   ├── tiktok_video/           # VIDEO → Overshoot AI
│   │   ├── tiktok_video.mp4    
│   │   ├── topic.txt           # Topic label (1-3 words)
│   │   └── summary.txt         # Comprehensive summary
│   ├── instagram_video/        # VIDEO → Overshoot AI
│   │   ├── instagram_video.mp4
│   │   ├── topic.txt
│   │   └── summary.txt
│   ├── youtube_ABC123/         # VIDEO → Overshoot AI
│   │   ├── youtube_video.mp4
│   │   ├── youtube_captions.txt
│   │   ├── topic.txt
│   │   └── summary.txt
│   ├── twitter_tweet/          # NON-VIDEO → Gemini API
│   │   ├── twitter_tweet_data.txt
│   │   ├── topic.txt           # Topic label (1-3 words)
│   │   └── summary.txt         # Comprehensive summary
│   └── my_document/            # NON-VIDEO → Gemini API
│       ├── topic.txt
│       └── summary.txt
```

## Output Files (Same for Both AI Services)

- `topic.txt` - Short topic label (1-3 words, e.g., "Cooking Tutorial", "Wildlife", "Tech Review")
- `summary.txt` - Comprehensive summary including key information and details

## Module Structure

| File | Purpose |
|------|---------|
| `downloader.py` | Main entry point, platform downloaders, orchestration |
| `media_classifier.py` | File type detection (video vs non-video) |
| `gemini_client.py` | Gemini API integration for ALL media (videos + documents + images) |
| `overshoot_client.py` | Overshoot AI integration (optional alternative for videos) |
| `requirements.txt` | Python dependencies |

## Supported File Types

### Videos (processed with Gemini API by default)
`.mp4`, `.mov`, `.mkv`, `.webm`, `.avi`, `.m4v`, `.wmv`, `.flv`, `.3gp`, `.mpeg`

### Non-Videos (processed with Gemini API)

**Documents:**
`.txt`, `.md`, `.json`, `.csv`, `.xml`, `.html`, `.pdf`

**Images:**
`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

## API Keys

### Get Overshoot AI Key
1. Go to [Overshoot AI](https://overshoot.ai/)
2. Sign up and get an API key
3. Set as `OVERSHOOT_API_KEY` in your `.env` file
4. **Important**: Overshoot requires Node.js. Install from [nodejs.org](https://nodejs.org/)
5. Install the Overshoot SDK: `npm install @overshoot/sdk`

### Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set as `GEMINI_API_KEY` environment variable

### RapidAPI Key (Optional)
The default key is included for testing. For production:
1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the required APIs
3. Set as `RAPIDAPI_KEY` environment variable

## Examples

### Example 1: Video Input (TikTok)
```
Input: https://www.tiktok.com/@user/video/123
AI Service: Gemini API (HTTP upload)
Outputs:
  topic.txt → "Dance Challenge"
  summary.txt → "This video shows a person performing a popular..."
```

### Example 2: Video Input (YouTube)
```
Input: https://www.youtube.com/watch?v=xyz
AI Service: Gemini API (HTTP upload)
Outputs:
  topic.txt → "Tech Review"
  summary.txt → "The video reviews the latest smartphone..."
```

### Example 3: Non-Video Text Document
```
Input: ./report.pdf
AI Service: Gemini API
Outputs:
  topic.txt → "Financial Report"
  summary.txt → "This quarterly report details the company's financial performance..."
```

### Example 4: Non-Video Image
```
Input: ./photo.jpg
AI Service: Gemini API
Outputs:
  topic.txt → "Nature Photography"
  summary.txt → "A scenic mountain landscape at sunset with snow-capped peaks..."
```

### Example 5: Twitter Post (Non-Video)
```
Input: https://twitter.com/user/status/123
AI Service: Gemini API
Outputs:
  twitter_tweet_data.txt → "Author: @user\nLikes: 1234\nTweet: ..."
  topic.txt → "Tech News"
  summary.txt → "A tweet discussing recent developments in the tech industry..."
```

## Error Handling

- Missing API keys: Clear error message with setup instructions
- Failed downloads: Log API response for debugging
- Failed AI processing: Error details written to output files
- Unsupported file types: Graceful fallback with informative message

## Documentation Links

- [Overshoot AI Documentation](https://docs.overshoot.ai/)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
