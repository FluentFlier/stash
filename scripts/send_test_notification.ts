import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get the first user (or a specific one if you know the ID)
    // Since we are testing, getting the first user is usually fine.
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error('No user found to send notification to.');
        return;
    }

    console.log(`Sending notification to user: ${user.email} (${user.id})`);

    const insight = await prisma.insight.create({
        data: {
            userId: user.id,
            type: 'NOTIFICATION',
            title: 'Test Notification 🚀',
            content: 'This is a test notification sent from the backend script. If you see this, polling is working!',
            metadata: {
                priority: 'high',
                action: 'OPEN_APP'
            },
            isRead: false
        }
    });

    console.log(`Notification created! ID: ${insight.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
