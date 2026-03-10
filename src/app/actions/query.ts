"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function queryPersonByBarcode(identityNo: string) {
    const session = await auth();
    if (!session) return { success: false, message: "Sorgulama yapmak için giriş yapmalısınız." };

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
                boutiqueBalance: person.household.boutiqueBalance,
            }
        };

    } catch (error) {
        console.error("Barkod sorgulama hatası:", error);
        return { success: false, message: "Sorgulama sırasında bir sistem hatası oluştu." };
    }
}

export async function searchHouseholdsAction(query: string) {
    const session = await auth();
    if (!session) return { success: false, data: [] };

    if (!query || query.length < 3) return { success: true, data: [] };

    try {
        const persons = await prisma.person.findMany({
            where: {
                OR: [
                    { identityNo: { contains: query } },
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                ]
            },
            select: {
                id: true,
                householdId: true,
                firstName: true,
                lastName: true,
                identityNo: true,
                household: {
                    select: {
                        status: true,
                        score: true,
                        address: true,
                        boutiqueBalance: true,
                    }
                }
            },
            take: 15
        });

        // Hane bazında birleştir (aynı haneden birden fazla kişi gelebilir)
        const householdsMap = new Map();
        persons.forEach(p => {
            if (!householdsMap.has(p.householdId)) {
                householdsMap.set(p.householdId, {
                    householdId: p.householdId,
                    name: `${p.firstName} ${p.lastName}`,
                    identityNo: p.identityNo,
                    status: p.household.status,
                    score: p.household.score,
                    address: p.household.address,
                    boutiqueBalance: p.household.boutiqueBalance,
                });
            }
        });

        return { success: true, data: Array.from(householdsMap.values()) };
    } catch (e) {
        console.error("Search error:", e);
        return { success: false, data: [] };
    }
}
