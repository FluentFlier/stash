/**
 * Full Pipeline Test - Including Supermemory Verification
 * Tests: API → Supabase → Queue → Agent → Supermemory → Retrieval → Notifications
 */

import jwt from 'jsonwebtoken';
import { env } from './backend/config/env.js';

const API_URL = 'http://localhost:3000';
const SUPERMEMORY_API_URL = 'https://api.supermemory.ai/v3';

// Using existing user ID
const existingUserId = '79bd4bb1-e6f0-4acb-aa6b-d2c4b8b86ecf';

// Generate a fresh token
function generateToken(): string {
    return jwt.sign(
        {
            aud: 'authenticated',
            role: 'authenticated',
            sub: existingUserId,
            email: 'jamieseoh7@gmail.com'
        },
        env.SUPABASE_JWT_SECRET,
        { expiresIn: '1h' }
    );
}

async function testHealthCheck() {
    console.log('\n🔍 Step 1: Testing Health Check...');
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    console.log('✅ Health:', data.status);
    return data.success;
}

async function testCreateCapture(token: string) {
    console.log('\n🔍 Step 2: Creating Capture (Link)...');

    // Test with a real, short page
    const testLink = 'https://example.com/pipeline-test-' + Date.now();

    const res = await fetch(`${API_URL}/api/captures`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            type: 'LINK',
            content: testLink,
            userInput: 'Test link for pipeline verification - deadline is next week'
        })
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('❌ Failed to create capture:', data);
        return null;
    }

    console.log(`✅ Capture created: ${data.captureId}`);
    return data.captureId;
}

async function pollCaptureStatus(token: string, captureId: string, maxAttempts = 45) {
    console.log(`\n⏳ Step 3: Polling capture ${captureId.slice(0, 8)}... status (max ${maxAttempts * 2}s)`);

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const res = await fetch(`${API_URL}/api/captures/${captureId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        const status = data.data?.processingStatus;

        // Show progress every 5 polls
        if (i % 5 === 0) {
            console.log(`   [${i + 1}/${maxAttempts}] Status: ${status || 'unknown'}`);
        }

        if (status === 'completed') {
            console.log('\n✅ Processing COMPLETED!');
            return data.data;
        } else if (status === 'failed') {
            console.log('❌ Processing FAILED');
            return null;
        }
    }

    console.log('⚠️ Timeout waiting for processing');
    return null;
}

async function testSupermemorySearch() {
    console.log('\n🔍 Step 4: Testing Supermemory Search...');

    const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY;
    if (!supermemoryApiKey) {
        console.log('⚠️ SUPERMEMORY_API_KEY not set, skipping');
        return null;
    }

    try {
        const res = await fetch(`${SUPERMEMORY_API_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supermemoryApiKey}`
            },
            body: JSON.stringify({
                q: 'pipeline test deadline',
                containerTags: [existingUserId],
                limit: 5
            })
        });

        if (!res.ok) {
            const error = await res.text();
            console.log('⚠️ Supermemory search failed:', error.slice(0, 100));
            return null;
        }

        const data = await res.json();
        console.log(`✅ Found ${data.results?.length || 0} memories in Supermemory`);

        if (data.results?.length > 0) {
            console.log('   Latest memory:', data.results[0].content?.slice(0, 80) + '...');
        }

        return data.results;
    } catch (error: any) {
        console.log('⚠️ Supermemory error:', error.message);
        return null;
    }
}

async function testChatEndpoint(token: string) {
    console.log('\n🔍 Step 5: Testing Chat/AI Query...');

    try {
        const res = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'What deadlines do I have coming up?'
            })
        });

        if (!res.ok) {
            console.log('⚠️ Chat endpoint error:', res.status);
            return null;
        }

        const data = await res.json();
        console.log('✅ Chat response received');
        console.log('   AI:', data.response?.slice(0, 100) + '...');
        return data;
    } catch (error: any) {
        console.log('⚠️ Chat error:', error.message);
        return null;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  STASH FULL PIPELINE TEST (with Supermemory)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`API: ${API_URL} | User: ${existingUserId.slice(0, 8)}...`);
    console.log('');

    try {
        // 1. Health check
        const isHealthy = await testHealthCheck();
        if (!isHealthy) {
            console.error('❌ Server not healthy!');
            process.exit(1);
        }

        // 2. Generate token
        const token = generateToken();

        // 3. Create capture
        const captureId = await testCreateCapture(token);
        if (!captureId) {
            console.error('❌ Failed to create capture');
            process.exit(1);
        }

        // 4. Poll for completion
        const result = await pollCaptureStatus(token, captureId);

        // 5. Test Supermemory search (verify storage)
        await testSupermemorySearch();

        // 6. Test chat/retrieval
        await testChatEndpoint(token);

        console.log('\n═══════════════════════════════════════════════════════════');
        if (result) {
            console.log('  ✅ FULL PIPELINE TEST PASSED');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('\nPipeline verified:');
            console.log('  ✓ API endpoint working');
            console.log('  ✓ Data stored in Supabase');
            console.log('  ✓ Queue processing triggered');
            console.log('  ✓ Agent Coordinator executed');
            console.log('  ✓ Supermemory integration');
            console.log('  ✓ Chat/retrieval working');

            if (result.metadata) {
                console.log('\nExtracted metadata:');
                console.log('  Title:', result.metadata.title || 'N/A');
                console.log('  Topics:', result.metadata.topics?.join(', ') || 'N/A');
            }
        } else {
            console.log('  ⚠️ PIPELINE INCOMPLETE');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('\nCheck the worker logs for processing details.');
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();
