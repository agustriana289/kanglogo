import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") || "50";

        const { data: logs, error } = await supabase
            .from("notion_sync_logs")
            .select(`
        *,
        orders (
          invoice_number,
          customer_name
        )
      `)
            .order("synced_at", { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error("Error fetching sync logs:", error);
        return NextResponse.json(
            { error: error.message || "Gagal fetch sync logs" },
            { status: 500 }
        );
    }
}
