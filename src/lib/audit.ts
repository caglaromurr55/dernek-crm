import prisma from "./prisma";
import { auth } from "@/auth";

export async function createAuditLog(
    action: string,
    entity: string,
    entityId?: string,
    details?: any
) {
    try {
        const session = await auth();
        const userId = session?.user?.id || "SYSTEM";

        await (prisma as any).auditLog.create({
            data: {
                action,
                entity,
                entityId,
                userId,
                details: details ? JSON.stringify(details) : null,
            },
        });
    } catch (error) {
        console.error("AuditLog error:", error);
        // Audit log hatası ana işlemi durdurmamalı
    }
}
