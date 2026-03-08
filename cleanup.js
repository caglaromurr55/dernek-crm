const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- FABRİKA AYARLARINA DÖNÜŞ BAŞLIYOR ---');
    try {
        // Sıralama önemli (Foreign Key kısıtlamaları için)
        await prisma.auditLog.deleteMany();
        console.log('AuditLog temizlendi.');

        await prisma.delivery.deleteMany();
        console.log('Delivery temizlendi.');

        await prisma.distributionList.deleteMany();
        console.log('DistributionList temizlendi.');

        await prisma.distributionEvent.deleteMany();
        console.log('DistributionEvent temizlendi.');

        await prisma.boutiqueTransaction.deleteMany();
        console.log('BoutiqueTransaction temizlendi.');

        await prisma.boutiqueItem.deleteMany();
        console.log('BoutiqueItem temizlendi.');

        await prisma.inventory.deleteMany();
        console.log('Inventory temizlendi.');

        await prisma.packageItem.deleteMany();
        console.log('PackageItem temizlendi.');

        await prisma.item.deleteMany();
        console.log('Item (Stoklar) temizlendi.');

        await prisma.person.deleteMany();
        console.log('Person (Hane Sakinleri) temizlendi.');

        await prisma.household.deleteMany();
        console.log('Household (Haneler) temizlendi.');

        await prisma.volunteer.deleteMany();
        console.log('Volunteer (Gönüllüler) temizlendi.');

        await prisma.neighborhood.deleteMany();
        console.log('Neighborhood temizlendi.');

        console.log('--- İŞLEM BAŞARIYLA TAMAMLANDI ---');
    } catch (e) {
        console.error('HATA OLUŞTU:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
