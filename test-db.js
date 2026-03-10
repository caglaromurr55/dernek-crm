const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inv = await prisma.inventory.findFirst({
        where: { reason: { startsWith: 'BELGELI_TESLIMAT' } },
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(inv, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => { await prisma.$disconnect(); });
