"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function createDistributionEventAction(formData: FormData) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const itemId = formData.get("itemId") as string;
    const minScoreStr = formData.get("minScore") as string;
    const cooldownDaysStr = formData.get("cooldownDays") as string;
    const mahalle = formData.get("mahalle") as string;

    // V3: Filtreleme Mantığı
    const onlyApproved = formData.get("onlyApproved") === "on";
    const includeOnce = formData.get("includeOnce") === "on";

    const minScore = parseInt(minScoreStr || "0", 10);
    const cooldownDays = parseInt(cooldownDaysStr || "30", 10);
    const totalTarget = parseInt(formData.get("totalTarget") as string || "50", 10);
    const perListCount = parseInt(formData.get("perListCount") as string || "10", 10);

    try {
        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

        // Durum filtresi oluşturma
        let statusFilter: any = {};
        if (onlyApproved) {
            if (includeOnce) {
                statusFilter = { in: ["APPROVED", "APPROVED_ONCE"] };
            } else {
                statusFilter = "APPROVED";
            }
        }

        const targetHouseholds = await (prisma as any).household.findMany({
            where: {
                score: { gte: minScore },
                ...(onlyApproved ? { status: statusFilter } : {}),
                ...(mahalle && mahalle !== "ALL" ? { address: { contains: mahalle, mode: "insensitive" } } : {}),
                OR: [
                    { lastAidDate: null },
                    { lastAidDate: { lte: cooldownDate } }
                ]
            },
            select: { id: true },
            orderBy: { score: "desc" },
            take: totalTarget
        });

        if (targetHouseholds.length === 0) {
            return { success: false, message: "Kriterlere uygun hiçbir hane bulunamadı. Lütfen puan limitini düşürmeyi veya Tek Seferlik onaylıları dahil etmeyi deneyin." };
        }

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Kampanyayı oluştur
            const event = await tx.distributionEvent.create({
                data: {
                    name,
                    description,
                    itemId: itemId || null,
                    startDate: new Date(),
                    status: "ACTIVE",
                }
            });

            // 2. Haneleri parçalara ayır (chunking)
            const chunks = [];
            for (let i = 0; i < targetHouseholds.length; i += perListCount) {
                chunks.push(targetHouseholds.slice(i, i + perListCount));
            }

            let deliveryCount = 0;

            // 3. Her parça için bir liste oluştur ve teslimatları ekle
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const list = await tx.distributionList.create({
                    data: {
                        name: `${name} - Liste ${i + 1}`,
                        token: randomUUID(),
                        distributionEventId: event.id,
                    }
                });

                const deliveriesData = chunk.map((h: any) => ({
                    distributionEventId: event.id,
                    distributionListId: list.id,
                    householdId: h.id,
                    status: "PENDING"
                }));

                await tx.delivery.createMany({
                    data: deliveriesData
                });

                deliveryCount += deliveriesData.length;
            }

            return { eventId: event.id, count: deliveryCount };
        }, { maxWait: 10000, timeout: 30000 });

        revalidatePath("/dagitim");
        return {
            success: true,
            message: `Başarılı! ${result.count} hane için ${Math.ceil(result.count / perListCount)} ayrı liste oluşturuldu.`,
            eventId: result.eventId
        };

    } catch (error: any) {
        console.error("Dağıtım oluşturma hatası:", error);
        return { success: false, message: `Veritabanı hatası: ${error?.message || "Bilinmeyen Hata"}` };
    }
}

export async function updateDeliveryStatusAction(deliveryId: string, status: string, notes?: string) {
    try {
        let dbDelivery: any = null;

        const result = await (prisma as any).$transaction(async (tx: any) => {
            const delivery = await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status,
                    notes,
                    deliveredAt: status === "DELIVERED" ? new Date() : null,
                },
                include: { distributionList: true, distributionEvent: true } // Include distributionEvent for revalidation
            });

            dbDelivery = delivery;

            if (status === "DELIVERED") {
                await tx.household.update({
                    where: { id: delivery.householdId },
                    data: { lastAidDate: new Date() }
                });

                if (delivery.distributionEvent?.itemId) {
                    const itemId = delivery.distributionEvent.itemId;
                    await tx.item.update({
                        where: { id: itemId },
                        data: { stock: { decrement: 1 } }
                    });
                    await tx.inventory.create({
                        data: {
                            itemId,
                            type: "OUT",
                            quantity: 1,
                            reason: `Yönetici Paneli Dağıtım (Delivery ID: ${delivery.id})`,
                        }
                    });
                }
            }

            return delivery;
        });

        if (dbDelivery && status === "DELIVERED") {
            const { recalculateHouseholdScore } = await import("@/lib/scoring");
            await recalculateHouseholdScore(dbDelivery.householdId);
        }

        if (result.distributionListId) {
            revalidatePath(`/dagitim/liste/${result.distributionListId}`);
        }
        revalidatePath(`/dagitim/${result.distributionEventId}`);

        return { success: true, delivery: result };
    } catch (error) {
        console.error("Teslimat güncelleme hatası:", error);
        return { success: false, message: "Teslimat durumu güncellenirken bir hata oluştu." };
    }
}
