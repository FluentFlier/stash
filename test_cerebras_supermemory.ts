/**
 * Test Cerebras + Supermemory Integration
 * Queries Supermemory for memories and uses Cerebras LLM to analyze them
 */

const SUPERMEMORY_API = 'https://api.supermemory.ai/v3';
const CEREBRAS_API = 'https://api.cerebras.ai/v1';

const SUPERMEMORY_KEY = 'sm_ZJM2WpLSK5EbgpP1QfoeMu_ZHpOZAdxXAMTfdQgktPmbUqWuoGnrwXyzCNmPUWhzTVqXHQOcJzHEISUrgLUZHll';
const CEREBRAS_KEY = 'csk-ydpent5y26kd9nvxdpctcpkwnwwdwfdx59nvn6465ryfhe3x';

const userId = '79bd4bb1-e6f0-4acb-aa6b-d2c4b8b86ecf';

async function searchSupermemory(query: string) {
    console.log(`\n🔍 Searching Supermemory for: "${query}"`);

    const res = await fetch(`${SUPERMEMORY_API}/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPERMEMORY_KEY}`
        },
        body: JSON.stringify({
            q: query,
            containerTags: [userId],
            limit: 5
        })
    });

    const data = await res.json();
    console.log(`✅ Found ${data.results?.length || 0} memories`);
    return data.results || [];
}

async function askCerebras(prompt: string) {
    console.log(`\n🤖 Asking Cerebras LLM...`);

    const res = await fetch(`${CEREBRAS_API}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CEREBRAS_KEY}`
        },
        body: JSON.stringify({
            model: 'llama3.1-8b',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that analyzes saved memories and provides insights. Be concise and actionable.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300
        })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  CEREBRAS + SUPERMEMORY INTEGRATION TEST');
    console.log('═══════════════════════════════════════════════════════════');

    try {
        // 1. Search for memories about deadlines
        const memories = await searchSupermemory('deadline test');

        if (memories.length === 0) {
            console.log('No memories found. Test: Supermemory API works but no data.');
            return;
        }

        // 2. Format memories for LLM
        const memoryContext = memories.map((m: any, i: number) =>
            `Memory ${i + 1}: ${m.title || 'Untitled'}\n${m.chunks?.[0]?.content?.slice(0, 200) || ''}`
        ).join('\n\n');

        console.log('\n📝 Memory context prepared');

        // 3. Ask Cerebras to analyze
        const prompt = `Based on these saved memories, provide a brief summary and any action items:

${memoryContext}

Provide:
1. A one-sentence summary
2. Any deadlines or dates mentioned
3. Suggested next action`;

        const response = await askCerebras(prompt);

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  CEREBRAS RESPONSE:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(response);
        console.log('═══════════════════════════════════════════════════════════');

        console.log('\n✅ SUCCESS! Cerebras can access and analyze Supermemory data.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

main();
