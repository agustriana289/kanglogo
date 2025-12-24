import { NextRequest, NextResponse } from "next/server";
import { syncOrderToNotion } from "@/lib/notion";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID diperlukan" },
                { status: 400 }
            );
        }

        const result = await syncOrderToNotion(orderId);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error in sync-order API:", error);
        return NextResponse.json(
            { error: error.message || "Gagal sync ke Notion" },
            { status: 500 }
        );
    }
}
