import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@dernek.org'
    const password = 'admin'
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN'
        }
    })

    console.log('Admin kullanıcısı başarıyla oluşturuldu veya güncellendi:')
    console.log('Email:', email)
    console.log('Password:', password)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
