
import { prisma } from './backend/config/database.js';

async function main() {
    const userId = '2f480781-92d2-48f4-a4d1-b9fa567ca017'; // The ID from my token

    try {
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                role: 'authenticated',
            },
        });
        console.log('User created:', user);
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
