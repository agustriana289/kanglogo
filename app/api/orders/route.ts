import { NextRequest, NextResponse } from "next/server";
import { syncOrderToNotion } from "@/lib/notion";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            invoice_number,
            service_id,
            customer_name,
            customer_email,
            customer_whatsapp,
            final_price,
            discount_code,
            discount_amount,
            package_details,
            payment_method,
            status,
        } = body;

        if (!customer_name || !final_price) {
            return NextResponse.json(
                { error: "Nama pelanggan dan total harga wajib diisi" },
                { status: 400 }
            );
        }

        const { supabase } = await import("@/lib/supabase");

        const { data: order, error } = await supabase
            .from("orders")
            .insert({
                invoice_number,
                service_id: service_id || null,
                customer_name,
                customer_email,
                customer_whatsapp,
                final_price,
                discount_code: discount_code || null,
                discount_amount: discount_amount || 0,
                package_details,
                payment_method,
                status: status || "pending_payment",
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        try {
            await syncOrderToNotion(order.id);
        } catch (syncError) {
            console.error("Auto-sync to Notion failed:", syncError);
        }

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error: any) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: error.message || "Gagal membuat order" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, ...updateData } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID diperlukan" },
                { status: 400 }
            );
        }

        const { supabase } = await import("@/lib/supabase");

        const { error } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

        if (error) throw error;

        try {
            await syncOrderToNotion(orderId);
        } catch (syncError) {
            console.error("Auto-sync to Notion failed:", syncError);
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error: any) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: error.message || "Gagal update order" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID diperlukan" },
                { status: 400 }
            );
        }

        const { supabase } = await import("@/lib/supabase");

        const { data: order } = await supabase
            .from("orders")
            .select("notion_page_id")
            .eq("id", orderId)
            .single();

        const { error } = await supabase
            .from("orders")
            .delete()
            .eq("id", orderId);

        if (error) throw error;

        if (order?.notion_page_id) {
            try {
                const { deleteNotionPage } = await import("@/lib/notion");
                await deleteNotionPage(order.notion_page_id);
            } catch (syncError) {
                console.error("Failed to delete Notion page:", syncError);
            }
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error: any) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { error: error.message || "Gagal delete order" },
            { status: 500 }
        );
    }
}
