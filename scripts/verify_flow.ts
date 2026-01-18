
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';
const USER_ID = '2f480781-92d2-48f4-a4d1-b9fa567ca017';

async function main() {
    console.log('🚀 STARTING VERIFICATION FLOW');
    console.log('-----------------------------');

    try {
        // 1. Ensure User Exists (Direct DB)
        console.log('[1/4] Seeding User in DB...');
        const user = await prisma.user.upsert({
            where: { id: USER_ID },
            update: {},
            create: {
                id: USER_ID,
                email: 'verify@example.com',
                name: 'Verification Bot',
                role: 'authenticated'
            }
        });
        console.log('✅ User Verified:', user.id);

        // 2. Auth Token
        const token = jwt.sign({
            sub: USER_ID,
            role: 'authenticated',
            aud: 'authenticated', // Required for Supabase compatibility
            email: 'verify@example.com'
        }, 'dummy-secret', { expiresIn: '1h' });
        console.log('✅ Token Generated');

        // 3. Create Capture
        console.log('[2/4] Creating Capture (Link via API)...');
        const res = await fetch(`${API_URL}/captures`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'LINK', // Uppercase
                content: 'https://example.com/test-verify-final-v2',
                metadata: { source: 'verification-script' }
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Error: ${res.status} ${text}`);
        }
        const result = await res.json();
        console.log('✅ Capture Created via API. ID:', result.captureId);

        if (!result.captureId) {
            throw new Error('Capture ID missing in response');
        }

        // 4. Poll for Processing
        console.log('[3/4] Waiting for Processing (Queue)...');
        let processed = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const check = await prisma.capture.findUnique({ where: { id: result.captureId } });
            process.stdout.write(`.`); // progress check
            if (check?.processingStatus === 'completed' || check?.processingStatus === 'processed') {
                console.log(`\n✅ Status: ${check.processingStatus}`);
                processed = true;
                break;
            }
        }
        console.log(''); // newline

        // 5. Check Dashboard
        console.log('[4/4] Checking Dashboard Stats...');
        const statsRes = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            console.log('✅ Dashboard Stats OK. Today Count:', stats.today?.saved);
        } else {
            console.warn('⚠️ Dashboard Stats Failed:', statsRes.status);
        }

        console.log('-----------------------------');
        if (processed) {
            console.log('✅✅ FULL FLOW VERIFIED SUCCESS ✅✅');
        } else {
            console.log('⚠️ Flow Partially Verified (Capture created, Queue might be slow or failing silent)');
        }

    } catch (e) {
        console.error('❌ VERIFICATION FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
