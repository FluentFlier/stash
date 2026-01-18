
import { prisma } from './backend/config/database.js';

async function main() {
    const users = await prisma.user.findMany();
    console.log('Existing Users:', users);
}

main();
