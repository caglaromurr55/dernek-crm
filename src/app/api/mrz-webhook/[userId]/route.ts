import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const body = await req.json();

        // Ensure body is an array and take the first element (the scanned document)
        if (!Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: "Invalid payload format. Expected an array." }, { status: 400 });
        }

        // Save the raw array to DB tied to the user
        const savedScan = await prisma.mrzScan.create({
            data: {
                userId: userId,
                rawJson: JSON.stringify(body)
            }
        });

        return NextResponse.json({ success: true, message: "Scan array received", id: savedScan.id }, { status: 200 });
    } catch (error) {
        console.error("Webhook POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
