"""
Overshoot AI Client Module
Handles VIDEO analysis using Overshoot AI's RealtimeVision SDK.

For videos: Generates topic label (1-3 words) and comprehensive summary.

Based on Overshoot SDK documentation:
- https://docs.overshoot.ai/
- https://docs.overshoot.ai/getting-started
- https://docs.overshoot.ai/getting-started/video-input-source
- https://docs.overshoot.ai/getting-started/configuration
- https://docs.overshoot.ai/getting-started/output
- https://docs.overshoot.ai/getting-started/models

GitHub: https://github.com/Overshoot-ai/overshoot-js-sdk

This implementation uses Puppeteer to run the SDK in a real browser
for reliable WebRTC video streaming.

Environment Variables Required:
- OVERSHOOT_API_KEY: Your Overshoot AI API key
"""

import os
import logging
import subprocess
import json
from pathlib import Path
from typing import Tuple, Dict, Any

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).parent
load_dotenv(SCRIPT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OVERSHOOT_AVAILABLE = False

try:
    node_result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
    if node_result.returncode == 0:
        root_dir = Path(__file__).parent.parent
        sdk_path = root_dir / 'node_modules' / '@overshoot' / 'sdk'
        puppeteer_path = root_dir / 'node_modules' / 'puppeteer'
        if sdk_path.exists() and puppeteer_path.exists():
            OVERSHOOT_AVAILABLE = True
            logger.info(f"Overshoot SDK found. Node.js version: {node_result.stdout.strip()}")
except Exception as e:
    logger.warning(f"Error checking dependencies: {e}")


def _get_api_key() -> str:
    api_key = os.environ.get('OVERSHOOT_API_KEY')
    if not api_key:
        raise ValueError("OVERSHOOT_API_KEY not set")
    return api_key


def _get_api_url() -> str:
    return os.environ.get('OVERSHOOT_API_URL', 'https://cluster1.overshoot.ai/api/v0.2')


def check_overshoot_status() -> Dict[str, Any]:
    return {
        'available': OVERSHOOT_AVAILABLE,
        'sdk_installed': OVERSHOOT_AVAILABLE,
        'puppeteer_installed': True,
        'api_key_set': bool(os.environ.get('OVERSHOOT_API_KEY')),
        'message': 'Ready' if (OVERSHOOT_AVAILABLE and os.environ.get('OVERSHOOT_API_KEY')) else 'Missing dependencies'
    }


def process_video_with_overshoot(video_path: str, out_dir: str) -> Tuple[str, str]:
    """
    Process a video file using Overshoot AI.
    
    Based on: https://docs.overshoot.ai/getting-started#using-a-video-file
    """
    api_key = _get_api_key()
    api_url = _get_api_url()
    
    out_path = Path(out_dir).absolute()
    out_path.mkdir(parents=True, exist_ok=True)
    
    topic_path = out_path / "topic.txt"
    summary_path = out_path / "summary.txt"
    video_path_obj = Path(video_path).absolute()
    
    if not video_path_obj.exists():
        raise FileNotFoundError(f"Video not found: {video_path_obj}")
    
    try:
        logger.info(f"Processing video with Overshoot AI: {video_path_obj}")
        return _run_with_puppeteer(str(video_path_obj), str(out_path), api_key, api_url, topic_path, summary_path)
    except Exception as e:
        logger.error(f"Overshoot error: {e}")
        with open(topic_path, 'w') as f:
            f.write("Error")
        with open(summary_path, 'w') as f:
            f.write(f"Failed: {e}")
        raise


def _run_with_puppeteer(video_path: str, out_dir: str, api_key: str, api_url: str,
                        topic_path: Path, summary_path: Path) -> Tuple[str, str]:
    """
    Run Overshoot SDK in a real browser using Puppeteer.
    """
    root_dir = Path(__file__).parent.parent
    out_path = Path(out_dir)
    
    # Create HTML file for the browser
    html_path = _create_html_file(out_path, video_path, api_key, api_url)
    
    # Create Puppeteer runner script
    script_path = _create_puppeteer_script(out_path, html_path, topic_path, summary_path)
    
    logger.info("Running Overshoot via Puppeteer...")
    
    try:
        result = subprocess.run(
            ['node', str(script_path)],
            cwd=str(root_dir),
            capture_output=True,
            text=True,
            timeout=180  # 3 minute timeout
        )
        
        for line in (result.stdout or '').strip().split('\n'):
            if line.strip():
                logger.info(f"[Overshoot] {line}")
        
        for line in (result.stderr or '').strip().split('\n'):
            if line.strip() and not line.startswith('DevTools'):
                logger.warning(f"[Overshoot] {line}")
        
        if result.returncode != 0:
            raise RuntimeError(f"Overshoot failed with code {result.returncode}")
        
        # Verify results were saved
        if not topic_path.exists() or not summary_path.exists():
            raise RuntimeError("Results files not created")
        
        return str(topic_path), str(summary_path)
        
    finally:
        # Cleanup temp files
        for f in [script_path, html_path]:
            try:
                f.unlink()
            except:
                pass


def _create_html_file(out_path: Path, video_path: str, api_key: str, api_url: str) -> Path:
    """Create HTML file that runs the Overshoot SDK."""
    
    # Convert video path to file:// URL
    video_url = Path(video_path).as_uri()
    video_name = Path(video_path).name
    
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <title>Overshoot Video Analysis</title>
</head>
<body>
    <h1>Analyzing Video...</h1>
    <div id="status">Initializing...</div>
    <div id="results"></div>
    
    <script type="module">
        // Results storage
        window.analysisResults = {{
            topics: [],
            summaries: [],
            count: 0,
            error: null,
            done: false
        }};
        
        const status = document.getElementById('status');
        const resultsDiv = document.getElementById('results');
        
        function log(msg) {{
            console.log('[Overshoot] ' + msg);
            status.textContent = msg;
        }}
        
        async function analyzeVideo() {{
            try {{
                log('Loading SDK...');
                
                // Import SDK from CDN
                const {{ RealtimeVision }} = await import('https://cdn.jsdelivr.net/npm/@overshoot/sdk@latest/dist/index.mjs');
                
                log('Fetching video file...');
                
                // Fetch video and create File object
                const response = await fetch('{video_url}');
                if (!response.ok) throw new Error('Failed to fetch video: ' + response.status);
                
                const blob = await response.blob();
                const videoFile = new File([blob], '{video_name}', {{ type: 'video/mp4' }});
                
                log('Video file created: ' + videoFile.size + ' bytes');
                
                // Create RealtimeVision with File source
                log('Creating RealtimeVision...');
                
                const vision = new RealtimeVision({{
                    apiUrl: '{api_url}',
                    apiKey: '{api_key}',
                    prompt: 'First provide a 1-3 word topic label. Then describe what happens in this video.',
                    debug: true,
                    
                    source: {{
                        type: 'video',
                        file: videoFile
                    }},
                    
                    onResult: (r) => {{
                        window.analysisResults.count++;
                        log('Result #' + window.analysisResults.count + ': ' + (r.result ? r.result.substring(0, 50) + '...' : '(empty)'));
                        
                        if (r.result) {{
                            resultsDiv.innerHTML += '<p>' + r.result + '</p>';
                            
                            if (window.analysisResults.topics.length === 0) {{
                                window.analysisResults.topics.push(r.result.split('.')[0].trim());
                            }}
                            window.analysisResults.summaries.push(r.result);
                        }}
                    }},
                    
                    onError: (e) => {{
                        console.error('[Overshoot] SDK Error:', e);
                        window.analysisResults.error = e.message || String(e);
                        log('Error: ' + window.analysisResults.error);
                    }},
                    
                    onEnd: () => {{
                        log('Analysis complete. Total results: ' + window.analysisResults.count);
                        window.analysisResults.done = true;
                    }}
                }});
                
                // Start analysis
                log('Starting analysis...');
                await vision.start();
                log('Stream started - waiting for results...');
                
                // Wait for onEnd callback or timeout (video duration + 60s buffer)
                await new Promise((resolve) => {{
                    const checkDone = setInterval(() => {{
                        if (window.analysisResults.done) {{
                            clearInterval(checkDone);
                            resolve();
                        }}
                    }}, 500);
                    
                    // Timeout after 90 seconds
                    setTimeout(() => {{
                        clearInterval(checkDone);
                        log('Timeout reached');
                        window.analysisResults.done = true;
                        resolve();
                    }}, 90000);
                }});
                
                // Stop vision
                try {{
                    vision.stop();
                    log('Vision stopped');
                }} catch(e) {{}}
                
                log('Done! Results: ' + window.analysisResults.count);
                
            }} catch (err) {{
                console.error('[Overshoot] Analysis failed:', err);
                window.analysisResults.error = err.message || String(err);
                window.analysisResults.done = true;
                log('Failed: ' + err.message);
            }}
        }}
        
        // Start analysis
        analyzeVideo();
    </script>
</body>
</html>'''
    
    html_path = out_path / "overshoot_analysis.html"
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return html_path


def _create_puppeteer_script(out_path: Path, html_path: Path, topic_path: Path, summary_path: Path) -> Path:
    """Create Node.js script to run Puppeteer."""
    
    html_url = html_path.as_uri()
    topic_js = str(topic_path).replace('\\', '/')
    summary_js = str(summary_path).replace('\\', '/')
    
    script_content = f'''
const puppeteer = require('puppeteer');
const fs = require('fs');

async function main() {{
    console.log('Launching browser...');
    
    const browser = await puppeteer.launch({{
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
        ]
    }});
    
    try {{
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {{
            const text = msg.text();
            if (text.includes('[Overshoot]') || text.includes('[RealtimeVision]')) {{
                console.log(text);
            }}
        }});
        
        page.on('pageerror', err => {{
            console.error('Page error:', err.message);
        }});
        
        console.log('Navigating to analysis page...');
        await page.goto('{html_url}', {{
            waitUntil: 'networkidle0',
            timeout: 60000
        }});
        
        console.log('Waiting for analysis to complete...');
        
        // Wait for analysis to complete (max 2 minutes)
        await page.waitForFunction(
            () => window.analysisResults && window.analysisResults.done === true,
            {{ timeout: 120000, polling: 1000 }}
        );
        
        // Get results
        const results = await page.evaluate(() => window.analysisResults);
        
        console.log('Analysis complete!');
        console.log('Results count:', results.count);
        
        // Process topic
        let topic = results.topics[0] || 'Unknown';
        topic = topic.replace(/[^a-zA-Z0-9\\s-]/g, '').trim();
        topic = topic.split(/\\s+/).slice(0, 3).join(' ') || 'Unknown';
        
        // Process summary
        const summary = results.summaries.join('\\n\\n') || 'Unable to generate summary.';
        
        // Save results
        fs.writeFileSync('{topic_js}', topic);
        fs.writeFileSync('{summary_js}', summary);
        
        console.log('Topic:', topic);
        console.log('Summary length:', summary.length, 'chars');
        console.log('Results saved!');
        
    }} finally {{
        await browser.close();
    }}
}}

main().catch(err => {{
    console.error('Fatal error:', err);
    process.exit(1);
}});
'''
    
    script_path = out_path / "overshoot_runner.cjs"
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    return script_path
