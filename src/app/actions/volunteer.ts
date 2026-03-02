"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { promises as fs } from "fs";
import path from "path";

export async function claimDistributionListAction(formData: FormData) {
    const token = formData.get("token") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    if (!token || !name || !phone) {
        return { success: false, message: "Lütfen adınızı ve telefon numaranızı girin." };
    }

    try {
        const list = await prisma.distributionList.findUnique({
            where: { token }
        });

        if (!list) {
            return { success: false, message: "Geçersiz veya süresi dolmuş liste bağlantısı." };
        }

        if (list.assignedTo) {
            return { success: false, message: "Bu liste zaten başka bir gönüllü tarafından üstlenilmiş." };
        }

        await prisma.distributionList.update({
            where: { token },
            data: {
                assignedTo: name,
                assignedPhone: phone
            }
        });

        revalidatePath(`/saha/liste/${token}`);
        revalidatePath(`/dagitim/liste/${list.id}`); // Yöneticinin sayfasını da yenile

        return { success: true };
    } catch (error) {
        console.error("Gönüllü atanırken hata:", error);
        return { success: false, message: "İşlem sırasında bir hata oluştu." };
    }
}

export async function updateVolunteerDeliveryAction(formData: FormData) {
    const deliveryId = formData.get("deliveryId") as string;
    const householdId = formData.get("householdId") as string;
    const status = formData.get("status") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    let signatureData = formData.get("signatureData") as string;

    if (!deliveryId || !status) {
        return { success: false, message: "Geçersiz işlem parametreleri." };
    }

    try {
        // İmza dosyalama sistemi
        if (signatureData && signatureData.startsWith("data:image")) {
            const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `vol-${deliveryId}-${Date.now()}.png`;
            const signaturesDir = path.join(process.cwd(), "public", "signatures");

            await fs.mkdir(signaturesDir, { recursive: true }).catch(() => { });
            await fs.writeFile(path.join(signaturesDir, fileName), buffer);

            signatureData = `/signatures/${fileName}`;
        }

        let dbDelivery: any = null;

        await prisma.$transaction(async (tx: any) => {
            const delivery = await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status,
                    notes: notes || null,
                    signatureData: signatureData || null,
                    deliveredAt: status === "DELIVERED" ? new Date() : null,
                },
                include: { distributionList: true, distributionEvent: true }
            });

            dbDelivery = delivery;
            const updatedVolunteer = delivery.distributionList?.assignedTo || "Bilinmeyen Gönüllü";

            if (status === "DELIVERED") {
                await tx.delivery.update({
                    where: { id: deliveryId },
                    data: { deliveredBy: updatedVolunteer }
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
                            reason: `Saha Görevlisi (${updatedVolunteer}) Teslimatı`,
                        }
                    });
                }
            }

            // Hane adres/telefon güncellemelerini yansıt
            await tx.household.update({
                where: { id: householdId },
                data: {
                    address: address || undefined,
                    contactNumber: phone || undefined,
                    ...(status === "DELIVERED" ? { lastAidDate: new Date() } : {})
                }
            });
        }, { maxWait: 10000, timeout: 20000 });

        if (dbDelivery) {
            const { recalculateHouseholdScore } = await import("@/lib/scoring");
            const { createAuditLog } = await import("@/lib/audit");

            await recalculateHouseholdScore(householdId);
            await createAuditLog("COMPLETE", "DELIVERY", deliveryId, { status, by: dbDelivery.distributionList?.assignedTo });

            // Yolları yenile
            if (dbDelivery.distributionList?.token) {
                revalidatePath(`/saha/liste/${dbDelivery.distributionList.token}`);
            }
            if (dbDelivery.distributionEventId) {
                revalidatePath(`/dagitim/${dbDelivery.distributionEventId}`);
                revalidatePath(`/dagitim/liste/${dbDelivery.distributionListId}`);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Gönüllü işlem hatası:", error);
        return { success: false, message: "İşlem sırasında çevresel bir hata meydana geldi." };
    }
}
