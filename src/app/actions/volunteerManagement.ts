"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { auth } from "@/auth";

export async function getVolunteersAction() {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
        return { success: false, message: "Yetkisiz erişim. Sadece yöneticiler gönüllü listesini görebilir." };
    }

    try {
        const volunteers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return { success: true, data: volunteers };
    } catch (error) {
        console.error("Gönüllü listesi alınırken hata:", error);
        return { success: false, message: "Gönüllüler getirilirken bir hata oluştu." };
    }
}

export async function createVolunteerAction(formData: FormData) {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
        return { success: false, message: "Yetkisiz işlem. Sadece yöneticiler gönüllü oluşturabilir." };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { success: false, message: "Lütfen tüm alanları doldurun." };
    }

    try {
        const existingUser = await (prisma as any).user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { success: false, message: "Bu e-posta adresi ile zaten bir kullanıcı mevcut." };
        }

        const hashedPassword = await hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "ADMIN" // İdari personel olduğu için tam yetki veriyoruz
            }
        });

        revalidatePath("/gonulluler");
        return { success: true, message: "İdari personel / Yönetici hesabı başarıyla oluşturuldu." };
    } catch (error) {
        console.error("Gönüllü oluşturulurken hata:", error);
        return { success: false, message: "Kayıt sırasında bir hata oluştu." };
    }
}
export async function getPhoneVolunteersAction() {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
        return { success: false, message: "Yetkisiz erişim." };
    }

    try {
        const volunteers = await (prisma as any).volunteer.findMany({
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: volunteers };
    } catch (error) {
        console.error("Telefonlu gönüllü listesi hatası:", error);
        return { success: false, message: "Gönüllüler getirilemedi." };
    }
}

export async function toggleVolunteerBlockAction(volunteerId: string, isBlocked: boolean) {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
        return { success: false, message: "Yetkisiz işlem." };
    }

    try {
        await (prisma as any).volunteer.update({
            where: { id: volunteerId },
            data: { isBlocked }
        });
        revalidatePath("/gonulluler");
        return { success: true, message: isBlocked ? "Gönüllü engellendi." : "Gönüllü engeli kaldırıldı." };
    } catch (error) {
        console.error("Gönüllü engelleme hatası:", error);
        return { success: false, message: "İşlem başarısız oldu." };
    }
}
