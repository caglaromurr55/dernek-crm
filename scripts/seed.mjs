import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Veritabanı temizleniyor...')

    // Tabloları temizle (Sıralama önemli)
    await prisma.auditLog.deleteMany()
    await prisma.delivery.deleteMany()
    await prisma.distributionEvent.deleteMany()
    await prisma.person.deleteMany()
    await prisma.household.deleteMany()

    console.log('Temizleme tamamlandı. Test verileri oluşturuluyor...')

    const firstNamesM = ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Ömer', 'Osman', 'Yusuf', 'Eren', 'Can', 'Deniz', 'Murat', 'Serkan']
    const firstNamesF = ['Fatma', 'Ayşe', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Meryem', 'Zehra', 'Feyza', 'Kübra', 'Selin', 'Demet', 'Esra', 'Büşra', 'Aylin']
    const lastNames = ['Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yılmaz', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Polat', 'Güneş', 'Şimşek', 'Yavuz']
    const mahalleler = ['Cumhuriyet Mah.', 'Atatürk Mah.', 'Fatih Mah.', 'Yenimahalle', 'İstasyon Mah.', 'Hürriyet Mah.', 'Adalet Mah.']
    const statuses = ['PENDING', 'APPROVED', 'APPROVED_ONCE', 'REJECTED']

    for (let i = 0; i < 100; i++) {
        const isMale = Math.random() > 0.5
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const firstName = isMale
            ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)]
            : firstNamesF[Math.floor(Math.random() * firstNamesF.length)]

        const hId = Math.floor(10000000000 + Math.random() * 90000000000).toString()

        const household = await prisma.household.create({
            data: {
                address: `${mahalleler[Math.floor(Math.random() * mahalleler.length)]} No: ${Math.floor(Math.random() * 50)}, Sokak: ${Math.floor(Math.random() * 100)}`,
                contactNumber: `05${Math.floor(Math.random() * 900000000 + 100000000)}`,
                score: Math.floor(Math.random() * 100),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                monthlyIncome: Math.floor(Math.random() * 20000) + 5000,
                rentAmount: Math.floor(Math.random() * 15000),
                rentStatus: Math.random() > 0.3 ? 'kiraci' : 'mulk-sahibi',
                workerCount: Math.floor(Math.random() * 3),
                studentCount: Math.floor(Math.random() * 4),
                disabledChildCount: Math.random() > 0.8 ? 1 : 0,
                carOwnership: Math.random() > 0.9,
                estateOwnership: Math.random() > 0.95,
                debtAmount: Math.floor(Math.random() * 50000),
                heatingType: Math.random() > 0.5 ? 'dogalgaz' : 'soba',
                persons: {
                    create: [
                        {
                            firstName: firstName,
                            lastName: lastName,
                            identityNo: hId,
                            birthDate: new Date(1960 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                            isApplicant: true,
                        }
                    ]
                }
            }
        })

        // Ek aile üyeleri ekle (0-4 kişi)
        const extraMemberCount = Math.floor(Math.random() * 5)
        for (let j = 0; j < extraMemberCount; j++) {
            const mMale = Math.random() > 0.5
            const mFirstName = mMale
                ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)]
                : firstNamesF[Math.floor(Math.random() * firstNamesF.length)]

            const mId = Math.floor(10000000000 + Math.random() * 90000000000).toString()

            await prisma.person.create({
                data: {
                    householdId: household.id,
                    firstName: mFirstName,
                    lastName: lastName,
                    identityNo: mId,
                    birthDate: new Date(1990 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                    isStudent: Math.random() > 0.5,
                    isDisabled: Math.random() > 0.9,
                    hasChronicIllness: Math.random() > 0.9,
                    isApplicant: false
                }
            })
        }
    }

    console.log('100 hane ve sakinleri başarıyla oluşturuldu.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
