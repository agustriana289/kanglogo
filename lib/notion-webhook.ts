import { Client } from "@notionhq/client";
import { supabase } from "./supabase";

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

const reverseStatusMapping: Record<string, string> = {
    "Belum Dibayar": "pending_payment",
    "Dibayar": "paid",
    "Diterima": "accepted",
    "Dikerjakan": "in_progress",
    "Selesai": "completed",
    "Dibatalkan": "cancelled",
};

interface NotionProperties {
    [key: string]: any;
}

export function mapNotionPropertiesToOrder(properties: NotionProperties) {
    const extractText = (prop: any): string => {
        if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
        if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
        return "";
    };

    const extractNumber = (prop: any): number => {
        return prop?.number || 0;
    };

    const extractEmail = (prop: any): string => {
        return prop?.email || "";
    };

    const extractPhone = (prop: any): string => {
        return prop?.phone_number || "";
    };

    const extractSelect = (prop: any): string => {
        return prop?.select?.name || "";
    };

    const extractDate = (prop: any): string | null => {
        return prop?.date?.start || null;
    };

    const extractUrl = (prop: any): string | null => {
        return prop?.url || null;
    };

    const invoiceNumber = extractText(properties["Invoice Number"]);
    const customerName = extractText(properties["Customer Name"]);
    const customerEmail = extractEmail(properties["Customer Email"]);
    const customerWhatsapp = extractPhone(properties["Customer WhatsApp"]);
    const service = extractText(properties["Service"]);
    const packageName = extractText(properties["Package"]);
    const totalPrice = extractNumber(properties["Total Price"]);
    const discount = extractNumber(properties["Discount"]);
    const statusNotion = extractSelect(properties["Status"]);
    const status = reverseStatusMapping[statusNotion] || "pending_payment";
    const paymentDeadline = extractDate(properties["Payment Deadline"]);
    const createdAt = extractDate(properties["Created At"]);
    const finalFileLink = extractUrl(properties["Final File"]);
    const orderId = extractNumber(properties["Order ID"]);

    return {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_whatsapp: customerWhatsapp,
        service,
        package_name: packageName,
        final_price: totalPrice,
        discount_amount: discount,
        status,
        payment_deadline: paymentDeadline,
        created_at: createdAt,
        final_file_link: finalFileLink,
        order_id: orderId,
    };
}

export async function syncNotionChangeToDatabase(
    notionPageId: string,
    properties: NotionProperties
) {
    try {
        const orderData = mapNotionPropertiesToOrder(properties);

        if (!orderData.order_id) {
            throw new Error("Order ID tidak ditemukan di Notion page");
        }

        const { data: existingOrder } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderData.order_id)
            .single();

        if (!existingOrder) {
            console.log("Order tidak ditemukan di database, skip sync dari Notion");
            return { success: false, reason: "order_not_found" };
        }

        const existingUpdatedAt = new Date(existingOrder.updated_at || existingOrder.created_at);
        const notionUpdatedAt = new Date();

        if (existingUpdatedAt > notionUpdatedAt) {
            console.log("Admin Priority: Perubahan di admin lebih baru, skip sync dari Notion");
            return { success: false, reason: "admin_priority" };
        }

        const { error } = await supabase
            .from("orders")
            .update({
                status: orderData.status,
                final_file_link: orderData.final_file_link,
                payment_deadline: orderData.payment_deadline,
                notion_last_synced_from: new Date().toISOString(),
            })
            .eq("id", orderData.order_id);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error syncing Notion change to database:", error);
        throw error;
    }
}

export function verifyNotionWebhook(signature: string, body: string): boolean {
    const webhookSecret = process.env.NOTION_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn("NOTION_WEBHOOK_SECRET tidak diset, skip verifikasi");
        return true;
    }

    return true;
}
