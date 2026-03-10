"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * FABRİKA AYARLARINA DÖNÜŞ (TEHLİKELİ)
 * Bu aksiyon tüm hane, dağıtım, butik ve ürün verilerini siler.
 * Sadece 'User' (Personel) tablosu korunur.
 */
export async function factoryResetAction() {
    try {
        await prisma.$transaction(async (tx) => {
            // Operasyonel Veriler (Loglar ve Teslimatlar)
            await tx.auditLog.deleteMany();
            await tx.delivery.deleteMany();
            await tx.distributionList.deleteMany();
            await tx.distributionEvent.deleteMany();

            // Butik ve Envanter Verileri
            await tx.boutiqueTransaction.deleteMany();
            await tx.boutiqueItem.deleteMany();
            await tx.inventory.deleteMany();
            await tx.packageItem.deleteMany();
            await tx.item.deleteMany();

            // Hane ve Birey Verileri
            await tx.person.deleteMany();
            await tx.household.deleteMany();

            // Diğer
            await tx.volunteer.deleteMany();
            await tx.neighborhood.deleteMany();
        }, {
            maxWait: 20000,
            timeout: 60000
        });

        revalidatePath("/");
        revalidatePath("/haneler");
        revalidatePath("/dagitim/listeler");
        revalidatePath("/loglar");
        revalidatePath("/gonulluler");

        return { success: true, message: "Sistem başarıyla fabrika ayarlarına döndürüldü." };
    } catch (error) {
        console.error("Factory Reset Error:", error);
        return { success: false, message: "Sıfırlama işlemi sırasında bir hata oluştu." };
    }
}
