"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getHouseholdsForExportAction(status?: string, query?: string) {
    const session = await auth();
    if (!session) return { success: false, data: [] };

    try {
        const whereClause: any = {};

        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        if (query) {
            whereClause.persons = {
                some: {
                    OR: [
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        { identityNo: { contains: query } },
                    ]
                }
            };
        }

        const households = await prisma.household.findMany({
            where: whereClause,
            include: {
                persons: { where: { isApplicant: true } as any, take: 1 },
                _count: { select: { persons: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 10000 // Limit for safety, but much larger than the previous 2000
        });

        return {
            success: true,
            data: households.map(h => ({
                ...h,
                createdAt: h.createdAt.toISOString(),
                updatedAt: h.updatedAt.toISOString(),
                lastAidDate: h.lastAidDate?.toISOString() || null
            }))
        };
    } catch (error) {
        console.error("Export data fetch error:", error);
        return { success: false, data: [] };
    }
}
