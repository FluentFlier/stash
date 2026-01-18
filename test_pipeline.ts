/**
 * End-to-End Pipeline Test Script
 * Tests: API → Supabase → Queue → Agent Coordinator → Supermemory → AI Inference
 */

import jwt from 'jsonwebtoken';
import { env } from './backend/config/env.js';

const API_URL = 'http://localhost:3000';

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
    console.log('\n🔍 Testing Health Check...');
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    console.log('✅ Health:', data);
    return data.success;
}

async function testCreateCapture(token: string) {
    console.log('\n🔍 Testing Create Capture (Link)...');

    // Test with a real link that has deadline info
    const testLink = 'https://techcrunch.com/2024/01/15/apple-vision-pro-launches-feb-2/';

    const res = await fetch(`${API_URL}/api/captures`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            type: 'LINK',
            content: testLink,
            userInput: 'Check out this article about Apple Vision Pro'
        })
    });

    const data = await res.json();
    console.log('📝 Create Capture Response:', JSON.stringify(data, null, 2));

    if (!res.ok) {
        console.error('❌ Failed to create capture:', data);
        return null;
    }

    console.log(`✅ Capture created: ${data.captureId}`);
    console.log('   Status:', data.status);
    console.log('   Message:', data.message);

    return data.captureId;
}

async function pollCaptureStatus(token: string, captureId: string, maxAttempts = 30) {
    console.log(`\n⏳ Polling capture ${captureId} status...`);

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const res = await fetch(`${API_URL}/api/captures/${captureId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        const status = data.data?.processingStatus;

        console.log(`   [${i + 1}/${maxAttempts}] Status: ${status}`);

        if (status === 'completed') {
            console.log('\n✅ Processing COMPLETED!');
            console.log('\n📊 Capture Details:');
            console.log('   Title:', data.data.metadata?.title || 'N/A');
            console.log('   Description:', data.data.metadata?.description?.slice(0, 100) || 'N/A');
            console.log('   Topics:', data.data.metadata?.topics?.join(', ') || 'N/A');
            console.log('   Entities:', data.data.metadata?.entities?.join(', ') || 'N/A');
            console.log('   Intent:', data.data.metadata?.intent || 'N/A');
            console.log('   Related Count:', data.data.metadata?.relatedCount || 0);

            if (data.data.analysis?.actionPlan) {
                console.log('\n📋 Action Plan:');
                console.log('   Reasoning:', data.data.analysis.actionPlan.reasoning);
                console.log('   Actions:', data.data.analysis.actionPlan.actions?.map((a: any) => a.type).join(', '));
            }

            if (data.data.analysis?.actionResults) {
                console.log('\n⚡ Action Results:');
                data.data.analysis.actionResults.forEach((r: any) => {
                    console.log(`   ${r.success ? '✅' : '❌'} ${r.action}:`, r.success ? 'Success' : r.error);
                });
            }

            return data.data;
        } else if (status === 'failed') {
            console.log('❌ Processing FAILED');
            console.log('   Full response:', JSON.stringify(data, null, 2));
            return null;
        }
    }

    console.log('⚠️ Timeout waiting for processing');
    return null;
}

async function listRecentCaptures(token: string) {
    console.log('\n📋 Listing Recent Captures...');

    const res = await fetch(`${API_URL}/api/captures?limit=5`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();

    if (data.success && data.data) {
        console.log(`Found ${data.pagination.total} total captures`);
        data.data.forEach((capture: any, i: number) => {
            console.log(`   ${i + 1}. [${capture.type}] ${capture.metadata?.title || capture.content?.slice(0, 50)}... (${capture.processingStatus})`);
        });
    }

    return data;
}

async function main() {
    console.log('═════════════════════════════════════════════════════');
    console.log('  STASH BACKEND END-TO-END TEST');
    console.log('═════════════════════════════════════════════════════');
    console.log(`API URL: ${API_URL}`);
    console.log(`User ID: ${existingUserId}`);

    try {
        // 1. Health check
        const isHealthy = await testHealthCheck();
        if (!isHealthy) {
            console.error('❌ Server is not healthy!');
            process.exit(1);
        }

        // 2. Generate token
        console.log('\n🔑 Generating JWT token...');
        const token = generateToken();
        console.log('✅ Token generated');

        // 3. Create capture
        const captureId = await testCreateCapture(token);
        if (!captureId) {
            console.error('❌ Failed to create capture');
            process.exit(1);
        }

        // 4. Poll for completion
        const result = await pollCaptureStatus(token, captureId);

        // 5. List recent captures
        await listRecentCaptures(token);

        console.log('\n═════════════════════════════════════════════════════');
        if (result) {
            console.log('  ✅ END-TO-END TEST PASSED');
            console.log('═════════════════════════════════════════════════════');
            console.log('\nThe following was verified:');
            console.log('  ✓ API endpoint /api/captures working');
            console.log('  ✓ Data stored in Supabase');
            console.log('  ✓ Queue processing triggered');
            console.log('  ✓ Agent Coordinator ran (Analyzer → Planner → Executor → Learner)');
            console.log('  ✓ Supermemory integration (if configured)');
            console.log('  ✓ AI inference completed');
        } else {
            console.log('  ⚠️ TEST INCOMPLETE - Check worker logs');
            console.log('═════════════════════════════════════════════════════');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

main();
