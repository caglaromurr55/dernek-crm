import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        let body: any;

        try {
            const tempBodyText = await req.text();

            if (!tempBodyText) {
                return NextResponse.json({ error: "Empty payload received" }, { status: 400 });
            }

            try {
                body = JSON.parse(tempBodyText);
            } catch (e) {
                // If pure JSON parse fails, try checking if it's form-data or other encoding but generally throw
                console.error("Failed to parse JSON:", tempBodyText);
                return NextResponse.json({ error: "Invalid JSON format in payload." }, { status: 400 });
            }
        } catch (e) {
            console.error("Error reading request text:", e);
            return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
        }

        // Sometimes webhook tools send a nested struct { data: [...] } or a single object {...}
        if (body && typeof body === 'object' && !Array.isArray(body)) {
            if (Array.isArray(body.data)) {
                body = body.data;
            } else {
                body = [body];
            }
        }

        // Ensure body is now an array
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
