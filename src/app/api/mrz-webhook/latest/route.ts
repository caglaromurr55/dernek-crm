import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Find the latest unread scan from the last 5 minutes mapped to this user
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const latestScan = await prisma.mrzScan.findFirst({
            where: {
                userId: userId,
                readAt: null,
                createdAt: {
                    gte: fiveMinutesAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!latestScan) {
            return NextResponse.json({ success: true, hasScan: false });
        }

        // Mark it as read so it isn't pulled again
        await prisma.mrzScan.update({
            where: { id: latestScan.id },
            data: { readAt: new Date() }
        });

        // Return the parsed array
        return NextResponse.json({
            success: true,
            hasScan: true,
            data: JSON.parse(latestScan.rawJson)
        });
    } catch (error) {
        console.error("Webhook GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
