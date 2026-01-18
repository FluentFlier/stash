# Complete Workflow Example: Download → Classify → Auto-Folder

This document shows how to use the complete workflow to download media from social platforms, process it with AI, and automatically classify it into folders.

## Overview

The workflow consists of three main steps:

1. **Download**: Use `downloader.py` to download media from Instagram, TikTok, Twitter, or YouTube
2. **Process**: AI (Gemini/Overshoot) analyzes the content and generates `topic.txt` and `summary.txt`
3. **Classify**: `auto_folder` uses these files to classify the item into a hierarchical folder structure

## Example: Processing an Instagram Post

### Step 1: Run the Workflow

```bash
cd processes
python workflow.py https://www.instagram.com/p/DNs58us4txJ/
```

### What Happens:

#### Step 1: Download & Process
- `downloader.py` downloads the Instagram post
- Detects it's a video or image
- Sends to Gemini AI for analysis
- Creates `outputs/instagram_video/topic.txt` (e.g., "Fitness Tips")
- Creates `outputs/instagram_video/summary.txt` (full summary of content)

#### Step 2: Classify into Folders
- `auto_folder` reads `topic.txt` and `summary.txt`
- Gemini LLM generates taxonomy: `Health & Fitness / Workout Routines`
- Vector similarity matching finds existing folders or creates new ones
- Item is associated with the folder in Supabase
- Classification stats are recorded

### Expected Output:

```json
{
  "item_id": "fc2eb5d9-9c78-49b7-9af3-c55b668f40a2",
  "final_path": "Health & Fitness / Workout Routines",
  "created_folders": [],
  "reused_folders": [
    "Health & Fitness",
    "Health & Fitness / Workout Routines"
  ],
  "applied_labels": {
    "domain": "Health & Fitness",
    "subdomain": "Workout Routines",
    "leaf_topic": null
  },
  "tags": ["fitness", "workout", "exercise", "instagram"],
  "confidence": 0.95,
  "notes": "Reused existing domain 'Health & Fitness' (similarity: 1.00); Reused existing subdomain 'Workout Routines' (similarity: 1.00)",
  "processed_at": "2026-01-18T07:30:53.769242",
  "processing_time_ms": 6422
}
```

## Alternative Workflows

### Process Existing Output Directory

If you've already downloaded and processed content:

```bash
python workflow.py --output-dir outputs/instagram_video
```

### Process Multiple URLs

```bash
python workflow.py \
  https://www.instagram.com/p/abc123/ \
  https://twitter.com/user/status/456 \
  https://www.tiktok.com/@user/video/789
```

### Interactive Mode

```bash
python workflow.py
# Then paste URLs one per line, press Enter twice when done
```

## File Structure After Processing

```
processes/
├── outputs/
│   └── instagram_video/
│       ├── instagram_video.mp4          # Downloaded media
│       ├── topic.txt                    # AI-generated topic (1-3 words)
│       └── summary.txt                  # AI-generated summary
├── workflow.py                          # Main workflow script
├── downloader.py                        # Media downloader
└── auto_folder/                         # Auto-folder system
    ├── auto_folder.py
    └── ...
```

## Manual Workflow (Step-by-Step)

If you want to run each step separately:

### 1. Download and Process

```bash
python downloader.py https://www.instagram.com/p/DNs58us4txJ/
```

This creates `outputs/instagram_video/topic.txt` and `summary.txt`.

### 2. Classify into Folders

```bash
# Using the auto_folder CLI
python -m auto_folder outputs/instagram_video

# Or using Python
python -c "
from auto_folder import AutoFolder
af = AutoFolder()
result = af.classify_from_downloader('outputs/instagram_video')
print(result.to_json())
"
```

## Database Storage

After classification, the data is stored in Supabase:

- **`folders` table**: Folder hierarchy (domain → subdomain → leaf)
- **`item_folders` table**: Association between items and folders
- **`taxonomy_stats` table**: Classification history and statistics
- **`embeddings` table**: Vector embeddings for similarity matching (pgvector)

## Troubleshooting

### Instagram URL not working?

- Ensure `RAPIDAPI_KEY` is set in `.env`
- Check if the post is public and accessible
- Some posts may require authentication

### Classification failed?

- Ensure `GEMINI_API_KEY` is set in `.env`
- Check that `topic.txt` and `summary.txt` exist in the output directory
- Verify Supabase connection (`SUPABASE_URL` and `SUPABASE_KEY`)

### Folders not created?

- Check Supabase database connection
- Verify migration SQL has been run
- Check folder matcher logs for similarity thresholds

## See Also

- `downloader.py --help` - Downloader options
- `python -m auto_folder --help` - Auto-folder CLI options
- `processes/auto_folder/README.md` - Auto-folder documentation
