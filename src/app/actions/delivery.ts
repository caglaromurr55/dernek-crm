"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { auth } from "@/auth";
import { recalculateHouseholdScore } from "@/lib/scoring";
import { promises as fs } from "fs";
import path from "path";

export async function createManualDeliveryAction(
    householdId: string,
    distributionEventId: string,
    notes?: string
) {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        let dbDelivery: any = null;

        await prisma.$transaction(async (tx: any) => {
            const event = await tx.distributionEvent.findUnique({
                where: { id: distributionEventId }
            });

            if (!event) throw new Error("Kampanya bulunamadı.");

            const delivery = await tx.delivery.create({
                data: {
                    householdId,
                    distributionEventId,
                    status: "DELIVERED",
                    deliveredAt: new Date(),
                    deliveredBy: session.user?.name || "Bilinmeyen Görevli (Manuel)",
                    notes: notes || "Manuel Teslimat",
                }
            });
            dbDelivery = delivery;

            if (event.itemId) {
                await tx.item.update({
                    where: { id: event.itemId },
                    data: { stock: { decrement: 1 } }
                });

                await tx.inventory.create({
                    data: {
                        itemId: event.itemId,
                        type: "OUT",
                        quantity: 1,
                        reason: `Manuel Dağıtım: ${event.name} (Delivery ID: ${delivery.id})`,
                    }
                });
            }

            await tx.household.update({
                where: { id: householdId },
                data: {
                    lastAidDate: new Date(),
                }
            });
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        if (dbDelivery) {
            await recalculateHouseholdScore(householdId);
            await createAuditLog("CREATE_MANUAL_DELIVERY", "DELIVERY", dbDelivery.id, { event: distributionEventId, household: householdId });
        }

        revalidatePath("/haneler");
        revalidatePath(`/haneler/${householdId}`);
        revalidatePath("/dagitim");

        return { success: true, message: "Manuel teslimat başarıyla kaydedildi." };
    } catch (error: any) {
        console.error("Manuel teslimat hatası:", error);
        return { success: false, message: error.message || "Teslimat kaydedilirken bir hata oluştu." };
    }
}

export async function completeDeliveryAction(formData: FormData) {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    const deliveryId = formData.get("deliveryId") as string;
    const notes = formData.get("notes") as string;
    let signatureData = formData.get("signatureData") as string;

    try {
        // Base64 imzasını dosyaya kaydetme (Eğer imza varsa ve base64 formatındaysa)
        if (signatureData && signatureData.startsWith("data:image")) {
            const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `${deliveryId}-${Date.now()}.png`;
            const signaturesDir = path.join(process.cwd(), "public", "signatures");

            await fs.mkdir(signaturesDir, { recursive: true }).catch(() => { });
            await fs.writeFile(path.join(signaturesDir, fileName), buffer);

            signatureData = `/signatures/${fileName}`;
        }

        let dbDelivery: any = null;

        // Transaction ile teslimat işaretle ve hanenin bekleme puanını/lastAidDate bilgisini sıfırla
        await prisma.$transaction(async (tx: any) => {
            const delivery = await tx.delivery.findUnique({
                where: { id: deliveryId },
                include: { distributionEvent: true }
            });

            if (!delivery) throw new Error("Teslimat bulunamadı.");
            dbDelivery = delivery;

            await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status: "DELIVERED",
                    deliveredAt: new Date(),
                    deliveredBy: session.user?.name || "Bilinmeyen Görevli",
                    notes: notes || null,
                    signatureData: signatureData || null,
                }
            });

            // Eğer kampanya bir ürünle (item) ilişkiliyse, stoktan düş
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
                        reason: `Dağıtım: ${delivery.distributionEvent.name} (Delivery ID: ${delivery.id})`,
                    }
                });
            }

            await tx.household.update({
                where: { id: delivery.householdId },
                data: {
                    lastAidDate: new Date(),
                }
            });
        }, {
            maxWait: 10000, // 10 saniye bekleme
            timeout: 20000  // 20 saniye işlem süresi (imza kaydı vb. gecikmeler için)
        });

        if (dbDelivery) {
            await recalculateHouseholdScore(dbDelivery.householdId);
            await createAuditLog("COMPLETE", "DELIVERY", deliveryId, { status: "DELIVERED" });
        }

        revalidatePath("/saha");
        revalidatePath("/dagitim");

        return { success: true, message: "Teslimat başarıyla kaydedildi." };
    } catch (error) {
        console.error("Teslimat onaylama hatası:", error);
        return { success: false, message: "Teslimat kaydedilirken bir hata oluştu." };
    }
}
