"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculateHouseholdScore } from "@/lib/scoring";
import { createAuditLog } from "@/lib/audit";
import { auth } from "@/auth";

export async function createHouseholdAction(formData: FormData) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const mahalle = formData.get("mahalle") as string;
    const telefon = formData.get("telefon") as string;
    const adres = formData.get("adres") as string;

    // Sosyo-Ekonomik Veriler
    const rentStatus = formData.get("kira") as string;
    const rentAmount = parseInt((formData.get("kira-miktari") as string) || "0", 10);
    const monthlyIncome = parseInt((formData.get("gelir") as string) || "0", 10);
    const workerCount = parseInt((formData.get("calisan-sayisi") as string) || "0", 10);

    // V3 & V4 Alanlar
    const debtAmount = parseInt((formData.get("debtAmount") as string) || "0", 10);
    const heatingType = formData.get("heatingType") as string || "dogalgaz";
    const carOwnership = formData.get("carOwnership") === "true";
    const estateOwnership = formData.get("estateOwnership") === "true";

    // Dinamik Hane Sakinleri (V4)
    // Form verilerinden "person_json" adında bir array bekliyoruz veya manuel parse edeceğiz
    const personsDataRaw = formData.get("persons_json") as string;
    let persons = [];
    try {
        persons = JSON.parse(personsDataRaw || "[]");
    } catch (e) {
        console.error("Persons JSON parse hatası:", e);
    }

    // Başvuru Sahibi (Ana Bilgiler)
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const identityNo = formData.get("identityNo") as string;
    const birthDateValue = formData.get("birthDate") as string;
    const birthDate = birthDateValue ? new Date(birthDateValue) : null;

    try {
        const newHousehold = await (prisma as any).$transaction(async (tx: any) => {
            const hane = await tx.household.create({
                data: {
                    address: `${mahalle} - ${adres}`,
                    contactNumber: telefon,
                    status: "PENDING",
                    score: 0,
                    rentStatus,
                    rentAmount,
                    monthlyIncome,
                    workerCount,
                    carOwnership,
                    estateOwnership,
                    debtAmount,
                    heatingType,
                },
            });

            // Başvuru sahibini ekle
            await tx.person.create({
                data: {
                    householdId: hane.id,
                    firstName,
                    lastName,
                    identityNo,
                    birthDate,
                    isApplicant: true,
                },
            });

            // Diğer hane sakinlerini ekle (MRZ'den gelenler dahil)
            for (const p of persons) {
                await tx.person.create({
                    data: {
                        householdId: hane.id,
                        firstName: p.firstName,
                        lastName: p.lastName,
                        identityNo: p.identityNo,
                        birthDate: p.birthDate ? new Date(p.birthDate) : null,
                        isStudent: !!p.isStudent,
                        isDisabled: !!p.isDisabled,
                        hasChronicIllness: !!p.hasChronicIllness,
                        isApplicant: false
                    }
                });
            }

            return hane;
        });

        if (newHousehold?.id) {
            await recalculateHouseholdScore(newHousehold.id);
            await createAuditLog("CREATE", "HOUSEHOLD", newHousehold.id, {
                action: "Initial Investigation with Members",
                memberCount: persons.length + 1
            });
        }
    } catch (error) {
        console.error("Hane oluşturulurken hata:", error);
        throw new Error("Kayıt oluşturulamadı. TC Kimlik numarası sistemde zaten mevcut olabilir.");
    }

    revalidatePath("/haneler");
    redirect("/haneler");
}

export async function updateHouseholdAction(id: string, formData: FormData) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    const mahalle = formData.get("mahalle") as string;
    const telefon = formData.get("telefon") as string;
    const adres = formData.get("adres") as string;
    const rentStatus = formData.get("kira") as string;
    const rentAmount = parseInt((formData.get("kira-miktari") as string) || "0", 10);
    const monthlyIncome = parseInt((formData.get("gelir") as string) || "0", 10);
    const workerCount = parseInt((formData.get("calisan-sayisi") as string) || "0", 10);
    const debtAmount = parseInt((formData.get("debtAmount") as string) || "0", 10);
    const heatingType = formData.get("heatingType") as string || "dogalgaz";
    const carOwnership = formData.get("carOwnership") === "true";
    const estateOwnership = formData.get("estateOwnership") === "true";

    try {
        await (prisma as any).household.update({
            where: { id },
            data: {
                address: adres.includes(mahalle) ? adres : `${mahalle} - ${adres}`,
                contactNumber: telefon,
                rentStatus,
                rentAmount,
                monthlyIncome,
                workerCount,
                carOwnership,
                estateOwnership,
                debtAmount,
                heatingType,
            }
        });

        await recalculateHouseholdScore(id);
        await createAuditLog("UPDATE", "HOUSEHOLD", id, { action: "Information Updated" });

        revalidatePath(`/haneler/${id}`);
        revalidatePath("/haneler");
        return { success: true };
    } catch (error) {
        console.error("Hane güncelleme hatası:", error);
        return { success: false, error: "Güncelleme yapılamadı." };
    }
}

export async function addPersonAction(householdId: string, personData: any) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await (prisma as any).person.create({
            data: {
                householdId,
                firstName: personData.firstName,
                lastName: personData.lastName,
                identityNo: personData.identityNo,
                birthDate: personData.birthDate ? new Date(personData.birthDate) : null,
                isStudent: !!personData.isStudent,
                isDisabled: !!personData.isDisabled,
                hasChronicIllness: !!personData.hasChronicIllness,
                isApplicant: false
            }
        });

        await recalculateHouseholdScore(householdId);
        await createAuditLog("CREATE", "PERSON", householdId, { name: `${personData.firstName} ${personData.lastName}` });

        revalidatePath(`/haneler/${householdId}`);
        return { success: true };
    } catch (error) {
        console.error("Sakin ekleme hatası:", error);
        return { success: false, error: "Sakin eklenemedi. TC Kimlik No kayıtlı olabilir." };
    }
}

export async function removePersonAction(householdId: string, personId: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await (prisma as any).person.delete({
            where: { id: personId }
        });

        await recalculateHouseholdScore(householdId);
        await createAuditLog("DELETE", "PERSON", householdId, { personId });

        revalidatePath(`/haneler/${householdId}`);
        return { success: true };
    } catch (error) {
        console.error("Sakin silme hatası:", error);
        return { success: false, error: "Sakin silinemedi." };
    }
}

export async function approveHouseholdAction(id: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await (prisma as any).household.update({
            where: { id },
            data: { status: "APPROVED" },
        });

        await createAuditLog("UPDATE", "HOUSEHOLD", id, { status: "APPROVED", type: "CONTINUOUS", manual: true });

        revalidatePath(`/haneler/${id}`);
        revalidatePath("/haneler");
        return { success: true };
    } catch (error) {
        console.error("Hane onaylama hatası:", error);
        return { success: false, error: "Hane onaylanırken hata oluştu." };
    }
}

export async function approveOnceHouseholdAction(id: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await (prisma as any).household.update({
            where: { id },
            data: { status: "APPROVED_ONCE" },
        });

        await createAuditLog("UPDATE", "HOUSEHOLD", id, { status: "APPROVED_ONCE", type: "ONCE", manual: true });

        revalidatePath(`/haneler/${id}`);
        revalidatePath("/haneler");
        return { success: true };
    } catch (error) {
        console.error("Hane onaylama hatası:", error);
        return { success: false, error: "Hane onaylanırken hata oluştu." };
    }
}

export async function rejectHouseholdAction(id: string) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await (prisma as any).household.update({
            where: { id },
            data: { status: "REJECTED" },
        });

        await createAuditLog("UPDATE", "HOUSEHOLD", id, { status: "REJECTED", manual: true });

        revalidatePath(`/haneler/${id}`);
        revalidatePath("/haneler");
        return { success: true };
    } catch (error) {
        console.error("Hane reddetme hatası:", error);
        return { success: false, error: "Hane reddedilirken hata oluştu." };
    }
}
