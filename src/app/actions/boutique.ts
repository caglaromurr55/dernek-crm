"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getBoutiqueItemsAction() {
    try {
        const items = await prisma.boutiqueItem.findMany({
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: items };
    } catch (error) {
        console.error("Boutique items getirilirken hata:", error);
        return { success: false, message: "Kıyafet stokları yüklenemedi." };
    }
}

export async function createBoutiqueItemAction(formData: FormData) {
    const session = await auth();
    if (!session) return { success: false, message: "Yetkisiz Erişim." };

    try {
        const barcode = formData.get("barcode") as string;
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const gender = formData.get("gender") as string;
        const size = formData.get("size") as string;
        const points = parseInt(formData.get("points") as string || "1", 10);
        const stock = parseInt(formData.get("stock") as string || "0", 10);

        // Barkod kontrolü (Mevcutsa uyarı ver, unique olmalı)
        if (barcode) {
            const existing = await prisma.boutiqueItem.findUnique({ where: { barcode } });
            if (existing) {
                return { success: false, message: "Bu barkod numarası sistemde zaten var." };
            }
        }

        const item = await prisma.boutiqueItem.create({
            data: {
                barcode: barcode || `BTQ-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, // Otomatik üret
                name,
                category,
                gender,
                size,
                points,
                stock
            }
        });

        revalidatePath("/butik/stoklar");
        return { success: true, data: item };
    } catch (error: any) {
        console.error("Butik item ekleme hatası:", error);
        return { success: false, message: error.message || "Bilinmeyen bir hata oluştu." };
    }
}

export async function updateBoutiqueStockAction(id: string, newStock: number) {
    const session = await auth();
    if (!session) return { success: false, message: "Yetkisiz Erişim." };

    try {
        await prisma.boutiqueItem.update({
            where: { id },
            data: { stock: newStock }
        });
        revalidatePath("/butik/stoklar");
        return { success: true };
    } catch (error) {
        return { success: false, message: "Stok güncellenemedi." };
    }
}

// Hanenin butik limitini güncelle (puan ekle)
export async function updateHouseholdBoutiqueBalanceAction(householdId: string, balance: number) {
    const session = await auth();
    if (!session) return { success: false, message: "Yetkisiz." };

    try {
        await prisma.household.update({
            where: { id: householdId },
            data: { boutiqueBalance: balance }
        });
        revalidatePath(`/haneler/${householdId}`);
        revalidatePath("/butik/kasa");
        return { success: true, message: "Butik hakkı güncellendi." };
    } catch (e) {
        return { success: false, message: "Hata oluştu." };
    }
}

// Butik Kasa: Seçilen ürünlerin (sepettekilerin) onayı
export async function checkoutBoutiquecartAction(householdId: string, cartItems: { boutiqueItemId: string, quantity: number }[]) {
    const session = await auth();
    if (!session) return { success: false, message: "Yetkisiz erişim." };

    try {
        await prisma.$transaction(async (tx) => {
            const household = await tx.household.findUnique({ where: { id: householdId } });
            if (!household) throw new Error("Hane bulunamadı.");

            let totalPointsToDeduct = 0;

            for (const cartItem of cartItems) {
                const item = await tx.boutiqueItem.findUnique({ where: { id: cartItem.boutiqueItemId } });
                if (!item) throw new Error("Ürünlerden biri bulunamadı.");

                if (item.stock < cartItem.quantity) {
                    throw new Error(`${item.name} stokta yetersiz. Kalan stok: ${item.stock}`);
                }

                const pointsSpent = item.points * cartItem.quantity;
                totalPointsToDeduct += pointsSpent;

                // Ürün stoktan düşülür
                await tx.boutiqueItem.update({
                    where: { id: item.id },
                    data: { stock: { decrement: cartItem.quantity } }
                });

                // Transaction (Log) atılır
                await tx.boutiqueTransaction.create({
                    data: {
                        householdId,
                        boutiqueItemId: item.id,
                        quantity: cartItem.quantity,
                        pointsSpent,
                        createdBy: session.user?.name || "Bilinmeyen"
                    }
                });
            }

            // Ailenin butik hakkından toplam puanı düş / yetmiyorsa patla
            if (household.boutiqueBalance < totalPointsToDeduct) {
                throw new Error("Hanenin butik bakiyesi yetersiz.");
            }

            await tx.household.update({
                where: { id: householdId },
                data: { boutiqueBalance: { decrement: totalPointsToDeduct } }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    action: "BOUTIQUE_CHECKOUT",
                    entity: "HOUSEHOLD",
                    entityId: householdId,
                    userId: session.user?.id || "unknown",
                    details: `Haneye toplam ${totalPointsToDeduct} puanlık butik ürün teslim edildi.`
                }
            });
        });

        revalidatePath("/butik/kasa");
        revalidatePath("/butik/stoklar");
        revalidatePath(`/haneler/${householdId}`);

        return { success: true, message: "Alışveriş başarıyla tamamlandı." };
    } catch (error: any) {
        console.error("Butik ödeme hatası:", error);
        return { success: false, message: error.message || "Ödeme (checkout) sırasında hata oluştu." };
    }
}
