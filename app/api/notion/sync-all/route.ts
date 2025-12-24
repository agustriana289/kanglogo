import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { syncOrderToNotion } from "@/lib/notion";

export async function POST(request: NextRequest) {
    try {
        const { data: orders, error } = await supabase
            .from("orders")
            .select("id, notion_page_id")
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error("Gagal mengambil data orders");
        }

        let synced = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const order of orders || []) {
            try {
                await syncOrderToNotion(order.id);
                synced++;
            } catch (error: any) {
                failed++;
                errors.push({
                    orderId: order.id,
                    error: error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            synced,
            failed,
            total: orders?.length || 0,
            errors: failed > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error("Error in sync-all API:", error);
        return NextResponse.json(
            { error: error.message || "Gagal sync semua order" },
            { status: 500 }
        );
    }
}
