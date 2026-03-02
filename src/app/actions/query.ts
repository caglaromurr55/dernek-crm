"use server";

import prisma from "@/lib/prisma";

export async function queryPersonByBarcode(identityNo: string) {
    if (!identityNo || identityNo.length !== 11) {
        return { success: false, message: "Geçersiz barkod veya TC Kimlik numarası." };
    }

    try {
        const person = await prisma.person.findUnique({
            where: { identityNo },
            include: {
                household: true
            }
        });

        if (!person) {
            return {
                success: false,
                message: "Bu TC Kimlik numarasıyla kayıtlı bir başvuru/kişi bulunamadı."
            };
        }

        return {
            success: true,
            data: {
                id: person.id,
                householdId: person.householdId,
                name: `${person.firstName} ${person.lastName}`,
                identityNo: person.identityNo,
                isApplicant: person.isApplicant,
                status: person.household.status, // PENDING, APPROVED, REJECTED
                score: person.household.score,
                address: person.household.address,
                phone: person.household.contactNumber,
                registrationDate: person.createdAt.toISOString(),
            }
        };

    } catch (error) {
        console.error("Barkod sorgulama hatası:", error);
        return { success: false, message: "Sorgulama sırasında bir sistem hatası oluştu." };
    }
}
