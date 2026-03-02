"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recalculateHouseholdScore } from "@/lib/scoring";

export async function addPersonToHouseholdAction(formData: FormData) {
    const householdId = formData.get("householdId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const identityNo = formData.get("identityNo") as string;
    const birthDateValue = formData.get("birthDate") as string;
    const birthDate = birthDateValue ? new Date(birthDateValue) : null;

    // checkbox'lar formData'da string "on" olarak gelir
    const isDisabled = formData.get("isDisabled") === "on";
    const hasChronicIllness = formData.get("hasChronicIllness") === "on";

    try {
        const newPerson = await prisma.person.create({
            data: {
                householdId,
                firstName,
                lastName,
                identityNo,
                birthDate,
                isDisabled,
                hasChronicIllness,
            },
        });

        // Kural motorunu (Skorlama) çalıştır
        await recalculateHouseholdScore(householdId);

        console.log("Kişi başarıyla eklendi:", newPerson.id);
    } catch (error) {
        console.error("Kişi eklenirken hata:", error);
        throw new Error("Kişi kaydedilirken veritabanı hatası oluştu. TC Kimlik numarası sistemde daha önce kayıtlı olabilir.");
    }

    // Detay sayfasını yenileyerek eklenenleri anında listelenmesini sağla
    revalidatePath(`/haneler/${householdId}`);
}
