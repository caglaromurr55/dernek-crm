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

    try {
        const item = await (prisma as any).item.create({
            data: {
                name,
                unit,
                stock: initialStock,
                inventories: initialStock > 0 ? {
                    create: {
                        type: "IN",
                        quantity: initialStock,
                        reason: "Initial Stock",
                    }
                } : undefined
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
    });
}
