"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createNeighborhoodAction(formData: FormData) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return { success: false, message: "Unauthorized: Yalnızca yöneticiler mahalle ekleyebilir." };
    }

    const name = formData.get("name") as string;
    if (!name || name.trim() === "") {
        return { success: false, message: "Lütfen bir mahalle adı giriniz." };
    }

    try {
        await (prisma as any).neighborhood.create({
            data: {
                name: name.trim().replace(/\s+/g, ' ')
            }
        });

        revalidatePath("/ayarlar");
        revalidatePath("/haneler/yeni");
        revalidatePath("/haneler/[id]/duzenle");
        revalidatePath("/dagitim");

        return { success: true, message: "Mahalle başarıyla eklendi." };
    } catch (error: any) {
        console.error("Mahalle ekleme hatası:", error);
        if (error.code === 'P2002') {
            return { success: false, message: "Bu mahalle zaten mevcut." };
        }
        return { success: false, message: "Sunucu hatası oluştu." };
    }
}

export async function deleteNeighborhoodAction(id: string) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return { success: false, message: "Unauthorized: Yalnızca yöneticiler mahalle silebilir." };
    }

    try {
        await (prisma as any).neighborhood.delete({
            where: { id }
        });

        revalidatePath("/ayarlar");
        revalidatePath("/haneler/yeni");
        revalidatePath("/haneler/[id]/duzenle");
        revalidatePath("/dagitim");

        return { success: true, message: "Mahalle sistemden kaldırıldı." };
    } catch (error: any) {
        console.error("Mahalle silme hatası:", error);
        return { success: false, message: "Mahalle silinirken bir hata oluştu." };
    }
}

export async function getNeighborhoodsAction() {
    try {
        const neighborhoods = await (prisma as any).neighborhood.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true }
        });
        return { success: true, data: neighborhoods };
    } catch (error) {
        console.error("Mahalleleri getirme hatası:", error);
        return { success: false, data: [] };
    }
}
