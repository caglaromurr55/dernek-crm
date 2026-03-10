import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        let body: any;
        let rawText = "";

        try {
            rawText = await req.text();
            if (!rawText) {
                return NextResponse.json({ error: "Empty payload received" }, { status: 400 });
            }

            console.log(`[Webhook] Raw Payload from ${userId}:`, rawText);

            // Attempt to parse JSON
            try {
                body = JSON.parse(rawText);
            } catch (e) {
                // Fallback to URL-Encoded Form Data
                if (rawText.includes("=") && !rawText.trim().startsWith("{") && !rawText.trim().startsWith("[")) {
                    const urlParams = new URLSearchParams(rawText);
                    body = Object.fromEntries(urlParams.entries());
                } else {
                    // Force wrap into an object if it's some other string
                    body = { rawData: rawText };
                }
            }
        } catch (e) {
            console.error("Error reading request text:", e);
            return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
        }

        // Sometimes webhook tools send a stringified JSON inside a property
        if (typeof body === 'object' && body !== null) {
            for (let key in body) {
                if (typeof body[key] === 'string' && (body[key].startsWith('[') || body[key].startsWith('{'))) {
                    try {
                        body[key] = JSON.parse(body[key]);
                    } catch (e) { } // Ignore parse failures on inner strings
                }
            }
        }

        // Normalize body into an Array format
        if (body && typeof body === 'object' && !Array.isArray(body)) {
            // Check common wrappers used by N8N or mobile apps
            if (body.data && Array.isArray(body.data)) {
                body = body.data;
            } else if (body.body && Array.isArray(body.body)) {
                body = body.body;
            } else if (body.results && Array.isArray(body.results)) {
                body = body.results;
            } else {
                body = [body];
            }
        } else if (!body || typeof body !== 'object') {
            body = [{ rawValue: body }];
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
