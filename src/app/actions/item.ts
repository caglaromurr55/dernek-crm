"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { auth } from "@/auth";

export async function createItemAction(formData: FormData) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;
    const initialStock = parseInt(formData.get("initialStock") as string) || 0;
    const isPackage = formData.get("isPackage") === "true";
    let packageItems: { itemId: string, quantity: number }[] = [];

    if (isPackage) {
        try {
            const piString = formData.get("packageItems") as string;
            packageItems = JSON.parse(piString || "[]");
        } catch (e) {
            console.error("Package items parse error", e);
        }
    }

    try {
        const item = await (prisma as any).item.create({
            data: {
                name,
                unit,
                stock: initialStock,
                isPackage,
                inventories: initialStock > 0 ? {
                    create: {
                        type: "IN",
                        quantity: initialStock,
                        reason: "Initial Stock",
                    }
                } : undefined,
                ...(isPackage && packageItems.length > 0 ? {
                    packageContents: {
                        create: packageItems.map(pi => ({
                            item: { connect: { id: pi.itemId } },
                            quantity: pi.quantity
                        }))
                    }
                } : {})
            },
        });

        await createAuditLog("CREATE", "ITEM", item.id, { name, unit, initialStock });

        revalidatePath("/yardim-turleri");
        return { success: true, item };
    } catch (error) {
        console.error("Item creation error:", error);
        return { success: false, error: "Ürün eklenirken bir hata oluştu." };
    }
}

export async function addStockAction(itemId: string, quantity: number, reason: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await prisma.$transaction([
            (prisma as any).inventory.create({
                data: {
                    itemId,
                    type: "IN",
                    quantity,
                    reason,
                },
            }),
            (prisma as any).item.update({
                where: { id: itemId },
                data: {
                    stock: {
                        increment: quantity,
                    },
                },
            }),
        ]);

        await createAuditLog("UPDATE", "STOCK_IN", itemId, { quantity, reason });

        revalidatePath("/yardim-turleri");
        return { success: true };
    } catch (error) {
        console.error("Stock add error:", error);
        return { success: false, error: "Stok eklenirken bir hata oluştu." };
    }
}

export async function removeStockAction(itemId: string, quantity: number, reason: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const item = await (prisma as any).item.findUnique({ where: { id: itemId } });
        if (!item || item.stock < quantity) {
            return { success: false, error: "Yetersiz stok." };
        }

        await prisma.$transaction([
            (prisma as any).inventory.create({
                data: {
                    itemId,
                    type: "OUT",
                    quantity,
                    reason,
                },
            }),
            (prisma as any).item.update({
                where: { id: itemId },
                data: {
                    stock: {
                        decrement: quantity,
                    },
                },
            }),
        ]);

        await createAuditLog("UPDATE", "STOCK_OUT", itemId, { quantity, reason });

        revalidatePath("/yardim-turleri");
        return { success: true };
    } catch (error) {
        console.error("Stock remove error:", error);
        return { success: false, error: "Stok düşülürken bir hata oluştu." };
    }
}

export async function getItemsAction() {
    return await (prisma as any).item.findMany({
        orderBy: { name: "asc" },
        include: {
            packageContents: {
                include: {
                    item: true
                }
            }
        }
    });
}

export async function assemblePackageAction(packageId: string, buildCount: number) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    if (buildCount <= 0) return { success: false, error: "Üretim adedi sıfırdan büyük olmalıdır." };

    try {
        // 1. Paketi ve içeriklerini bul
        const pkg = await (prisma as any).item.findUnique({
            where: { id: packageId },
            include: {
                packageContents: {
                    include: { item: true }
                }
            }
        });

        if (!pkg || !pkg.isPackage) {
            return { success: false, error: "Geçerli bir paket/koli bulunamadı." };
        }

        if (pkg.packageContents.length === 0) {
            return { success: false, error: "Bu paketin içeriği tanımlanmamış." };
        }

        // 2. Stokların yeterli olup olmadığını kontrol et
        const requiredDeductions = pkg.packageContents.map((pc: any) => ({
            itemId: pc.itemId,
            itemName: pc.item.name,
            requiredTotal: pc.quantity * buildCount,
            currentStock: pc.item.stock
        }));

        const insufficiencies = requiredDeductions.filter((r: any) => r.currentStock < r.requiredTotal);
        if (insufficiencies.length > 0) {
            const msg = insufficiencies.map((i: any) => `${i.itemName} (Eksik: ${i.requiredTotal - i.currentStock})`).join(", ");
            return { success: false, error: `Yetersiz Stok! Eksik malzemeler: ${msg}` };
        }

        // 3. İşlemleri Transaction içinde güvenle yap
        await prisma.$transaction(async (tx: any) => {
            // İçerik stoklarını düş ve logla
            for (const r of requiredDeductions) {
                await tx.item.update({
                    where: { id: r.itemId },
                    data: { stock: { decrement: r.requiredTotal } }
                });
                await tx.inventory.create({
                    data: {
                        itemId: r.itemId,
                        type: "OUT",
                        quantity: r.requiredTotal,
                        reason: `Koli Montajı İçin Çıkış (${pkg.name} x${buildCount})`
                    }
                });
            }

            // Paket (koli) stoğunu artır ve logla
            await tx.item.update({
                where: { id: pkg.id },
                data: { stock: { increment: buildCount } }
            });
            await tx.inventory.create({
                data: {
                    itemId: pkg.id,
                    type: "IN",
                    quantity: buildCount,
                    reason: `Koli Montajı Üretimi`
                }
            });
        });

        await createAuditLog("UPDATE", "ASSEMBLE_PACKAGE", pkg.id, { buildCount });

        revalidatePath("/yardim-turleri");
        revalidatePath(`/yardim-turleri/${packageId}`);
        return { success: true };
    } catch (error) {
        console.error("Assembly error:", error);
        return { success: false, error: "Koli hazırlanırken sunucu hatası oluştu." };
    }
}

export async function updatePackageContentsAction(packageId: string, newContents: { itemId: string, quantity: number }[]) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await prisma.$transaction(async (tx: any) => {
            // Önceki içerikleri sil
            await tx.packageItem.deleteMany({
                where: { packageId }
            });

            // Yeni içerikleri ekle
            if (newContents.length > 0) {
                await tx.packageItem.createMany({
                    data: newContents.map((nc) => ({
                        packageId,
                        itemId: nc.itemId,
                        quantity: nc.quantity
                    }))
                });
            }
        });

        await createAuditLog("UPDATE", "UPDATE_PACKAGE_CONTENTS", packageId, { newContents });

        revalidatePath("/yardim-turleri");
        revalidatePath(`/yardim-turleri/${packageId}`);
        return { success: true };
    } catch (error) {
        console.error("Update package contents error:", error);
        return { success: false, error: "Paket içeriği güncellenirken sunucu hatası oluştu." };
    }
}

export async function createDocumentedDeliveryAction(itemId: string, quantity: number, targetEntity: string, notes: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const item = await (prisma as any).item.findUnique({ where: { id: itemId } });
        if (!item || item.stock < quantity) {
            return { success: false, error: "Yetersiz stok." };
        }

        const reasonText = `BELGELI_TESLIMAT: ${targetEntity}${notes ? ` - ${notes}` : ""}`;

        // Stok düşümünü ve hareket kaydını Transaction ile yap
        const result = await prisma.$transaction(async (tx: any) => {
            const newInventory = await tx.inventory.create({
                data: {
                    itemId,
                    type: "OUT",
                    quantity,
                    reason: reasonText,
                },
            });

            await tx.item.update({
                where: { id: itemId },
                data: {
                    stock: {
                        decrement: quantity,
                    },
                },
            });

            return newInventory;
        });

        await createAuditLog("UPDATE", "STOCK_OUT_DOCUMENTED", itemId, { quantity, targetEntity, notes, inventoryId: result.id });

        revalidatePath("/yardim-turleri");
        return { success: true, inventoryId: result.id };
    } catch (error: any) {
        console.error("Document delivery error:", error);
        return { success: false, error: "Belgeli teslimat kaydedilirken bir hata oluştu." };
    }
}
