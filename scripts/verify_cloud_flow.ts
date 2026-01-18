
import fetch from 'node-fetch';

const API_URL = 'https://stash-backend-402905422218.us-central1.run.app/api';
const EMAIL = 'verify_cloud@example.com';
const PASSWORD = 'password123';

async function main() {
    console.log(`☁️ Testing Cloud API: ${API_URL}`);
    console.log('------------------------------------------------');

    try {
        // 1. Register/Login
        console.log('1. Authenticating...');
        let token;

        // Try Login
        let loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            token = data.data.session.access_token;
            console.log('   ✅ Logged in existing user');
        } else {
            // Try Register
            console.log('   (Login failed, trying registration...)');
            const regRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Cloud Verifier' })
            });

            if (!regRes.ok) {
                throw new Error(`Registration Failed: ${await regRes.text()}`);
            }
            const data = await regRes.json();
            token = data.data.session.access_token;
            console.log('   ✅ Registered new user');
        }

        console.log('   🔑 Token obtained');

        // 2. Create Capture
        console.log('2. Creating Cloud Capture...');
        const captureRes = await fetch(`${API_URL}/captures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'TEXT',
                content: 'Cloud Persistence Test Item ' + Date.now(),
                source: 'verification_script'
            })
        });

        if (!captureRes.ok) {
            throw new Error(`Capture Failed: ${await captureRes.text()}`);
        }

        const captureData = await captureRes.json();
        const captureId = captureData.data?.id || captureData.data?.captureId || captureData.captureId;
        console.log(`   ✅ Capture ID: ${captureId}`);

        // 3. Check Dashboard Stats (Immediate Visibility)
        console.log('3. Checking Dashboard Stats...');
        // Wait a moment for consistency (optional)
        await new Promise(r => setTimeout(r, 1000));

        const dashRes = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!dashRes.ok) {
            console.warn('   ⚠️ Failed to fetch dashboard:', await dashRes.text());
        } else {
            const dashData = await dashRes.json();
            const totalItems = dashData.data?.totals?.items;
            console.log(`   📊 Total Items in Cloud DB: ${totalItems}`);

            if (totalItems > 0) {
                console.log('   ✅ Data is persisting correctly to Cloud DB.');
            } else {
                console.log('   ⚠️ Count is 0? Something might be wrong with DB persistence.');
            }
        }

    } catch (e: any) {
        console.error('❌ CLOUD VERIFICATION FAILED:', e.message);
    }
}

main();
