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
        // --- ENGELLEME KONTROLÜ ---
        const volunteerData = await prisma.volunteer.findUnique({
            where: { phone }
        });

        if (volunteerData?.isBlocked) {
            return {
                success: false,
                message: "Güvenlik nedeniyle bu telefon numarası ile yeni liste üstlenemezsiniz. Lütfen dernek merkezi ile iletişime geçin."
            };
        }

        const list = await prisma.distributionList.findUnique({
            where: { token }
        });

        if (!list) {
            return { success: false, message: "Geçersiz veya süresi dolmuş liste bağlantısı." };
        }

        if (list.assignedTo) {
            return { success: false, message: "Bu liste zaten başka bir gönüllü tarafından üstlenilmiş." };
        }

        // Listeyi ata ve gerekirse Gönüllü kaydını oluştur/güncelle
        await prisma.$transaction([
            prisma.distributionList.update({
                where: { token },
                data: {
                    assignedTo: name,
                    assignedPhone: phone
                }
            }),
            prisma.volunteer.upsert({
                where: { phone },
                create: { name, phone },
                update: { name } // İsmi güncelleyebiliriz
            })
        ]);

        revalidatePath(`/saha/liste/${token}`);
        revalidatePath(`/dagitim/liste/${list.id}`);

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

export async function reportDeliveryIssueAction(formData: FormData) {
    const deliveryId = formData.get("deliveryId") as string;
    const householdId = formData.get("householdId") as string;
    const issueReason = formData.get("issueReason") as string; // e.g. "Taşınmış", "İhtiyaçlı Değil"
    const issueNote = formData.get("issueNote") as string; // Extra notes from volunteer
    const volunteerName = formData.get("volunteerName") as string;

    if (!deliveryId || !householdId || !issueReason) {
        return { success: false, message: "Geçersiz işlem parametreleri." };
    }

    try {
        let dbDelivery: any = null;
        let tokenToRevalidate: string | null = null;
        let eventIdToRevalidate: string | null = null;
        let listIdToRevalidate: string | null = null;

        await prisma.$transaction(async (tx: any) => {
            // Cancel the delivery
            dbDelivery = await tx.delivery.update({
                where: { id: deliveryId },
                data: {
                    status: "CANCELLED",
                    notes: `İPTAL NEDENİ: ${issueReason} - ${issueNote}`.trim()
                },
                include: { distributionList: true }
            });

            // Put the household into PENDING_REVIEW and append notes
            const existingHousehold = await tx.household.findUnique({
                where: { id: householdId },
                select: { notes: true }
            });

            const currentNotes = existingHousehold?.notes ? existingHousehold.notes + "\n\n" : "";
            const newOfficeNote = `[SAHA BİLDİRİMİ] ${new Date().toLocaleDateString("tr-TR")} - Gönüllü (${volunteerName}): ${issueReason}${issueNote ? ' - ' + issueNote : ''}`;

            await tx.household.update({
                where: { id: householdId },
                data: {
                    status: "PENDING_REVIEW",
                    notes: currentNotes + newOfficeNote
                }
            });

            if (dbDelivery.distributionList?.token) tokenToRevalidate = dbDelivery.distributionList.token;
            if (dbDelivery.distributionListId) listIdToRevalidate = dbDelivery.distributionListId;
            if (dbDelivery.distributionEventId) eventIdToRevalidate = dbDelivery.distributionEventId;
        });

        if (dbDelivery) {
            const { createAuditLog } = await import("@/lib/audit");
            await createAuditLog("COMPLETE", "DELIVERY", deliveryId, { status: "CANCELLED", reason: issueReason, by: volunteerName });

            if (tokenToRevalidate) revalidatePath(`/saha/liste/${tokenToRevalidate}`);
            if (eventIdToRevalidate) revalidatePath(`/dagitim/${eventIdToRevalidate}`);
            if (listIdToRevalidate) revalidatePath(`/dagitim/liste/${listIdToRevalidate}`);
            revalidatePath(`/haneler/${householdId}`); // Revalidate household details to show the note instantly
        }

        return { success: true };
    } catch (error) {
        console.error("Sorun bildirilirken hata:", error);
        return { success: false, message: "Sorun bildiriminiz sırasında bir hata oluştu." };
    }
}

export async function updateHouseholdFieldInfoAction(formData: FormData) {
    const householdId = formData.get("householdId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    if (!householdId) {
        return { success: false, message: "Hane kimliği bulunamadı." };
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            // Update household
            await tx.household.update({
                where: { id: householdId },
                data: {
                    contactNumber: phone || undefined,
                    address: address || undefined
                }
            });

            if (firstName || lastName) {
                // Find applicant person
                const applicants = await tx.person.findMany({
                    where: { householdId, isApplicant: true },
                    take: 1
                });

                if (applicants.length > 0) {
                    await tx.person.update({
                        where: { id: applicants[0].id },
                        data: {
                            firstName: firstName || undefined,
                            lastName: lastName || undefined
                        }
                    });
                } else {
                    // if no applicant specifically, just update the first person
                    const anyPerson = await tx.person.findFirst({
                        where: { householdId }
                    });
                    if (anyPerson) {
                        await tx.person.update({
                            where: { id: anyPerson.id },
                            data: {
                                firstName: firstName || undefined,
                                lastName: lastName || undefined
                            }
                        });
                    }
                }
            }
        });

        // Optional: Revalidate paths if needed
        revalidatePath(`/haneler/${householdId}`);
        return { success: true };
    } catch (error) {
        console.error("Hane bilgileri güncellenirken hata:", error);
        return { success: false, message: "Bilgiler güncellenirken bir hata oluştu." };
    }
}
