import { NextRequest, NextResponse } from "next/server";
import { verifyNotionWebhook, syncNotionChangeToDatabase } from "@/lib/notion-webhook";

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get("notion-signature") || "";
        const body = await request.text();

        if (!verifyNotionWebhook(signature, body)) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);

        if (event.type === "page") {
            const pageId = event.page?.id;
            const properties = event.page?.properties;

            if (!pageId || !properties) {
                return NextResponse.json(
                    { error: "Invalid webhook payload" },
                    { status: 400 }
                );
            }

            const result = await syncNotionChangeToDatabase(pageId, properties);

            return NextResponse.json({
                success: true,
                result,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Event type not handled",
        });
    } catch (error: any) {
        console.error("Error handling Notion webhook:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
