"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";



export async function getAuditLogsAction(page = 1, limit = 50) {
    try {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            (prisma as any).auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            (prisma as any).auditLog.count()
        ]);

        return { success: true, data: { logs, total } };
    } catch (error) {
        console.error("getAuditLogs Error: ", error);
        return { success: false, error: "Loglar alınırken hata oluştu" };
    }
}
