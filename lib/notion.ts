import { Client } from "@notionhq/client";
import { supabase } from "./supabase";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

const statusMapping: Record<string, string> = {
  pending_payment: "Belum Dibayar",
  paid: "Dibayar",
  accepted: "Diterima",
  in_progress: "Dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const reverseStatusMapping: Record<string, string> = {
  "Belum Dibayar": "pending_payment",
  "Dibayar": "paid",
  "Diterima": "accepted",
  "Dikerjakan": "in_progress",
  "Selesai": "completed",
  "Dibatalkan": "cancelled",
};

export interface NotionOrderData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  service: string;
  packageName: string;
  totalPrice: number;
  discount: number;
  status: string;
  paymentDeadline: string | null;
  createdAt: string;
  finalFileLink: string | null;
  orderId: number;
}

function mapOrderToNotionProperties(data: NotionOrderData) {
  return {
    "Invoice Number": {
      title: [
        {
          text: {
            content: data.invoiceNumber,
          },
        },
      ],
    },
    "Customer Name": {
      rich_text: [
        {
          text: {
            content: data.customerName,
          },
        },
      ],
    },
    "Customer Email": {
      email: data.customerEmail || null,
    },
    "Customer WhatsApp": {
      phone_number: data.customerWhatsapp || null,
    },
    "Service": {
      rich_text: [
        {
          text: {
            content: data.service,
          },
        },
      ],
    },
    "Package": {
      rich_text: [
        {
          text: {
            content: data.packageName,
          },
        },
      ],
    },
    "Total Price": {
      number: data.totalPrice,
    },
    "Discount": {
      number: data.discount,
    },
    "Status": {
      select: {
        name: statusMapping[data.status] || data.status,
      },
    },
    "Payment Deadline": data.paymentDeadline
      ? {
          date: {
            start: data.paymentDeadline.split("T")[0],
          },
        }
      : null,
    "Created At": {
      date: {
        start: data.createdAt.split("T")[0],
      },
    },
    "Final File": data.finalFileLink
      ? {
          url: data.finalFileLink,
        }
      : null,
    "Order ID": {
      number: data.orderId,
    },
  };
}

export async function syncOrderToNotion(orderId: number) {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        services (
          id,
          title,
          slug
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw new Error("Order tidak ditemukan");
    }

    const notionData: NotionOrderData = {
      invoiceNumber: order.invoice_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerWhatsapp: order.customer_whatsapp,
      service: order.services?.title || "Custom Service",
      packageName: order.package_details?.name || "N/A",
      totalPrice: order.final_price,
      discount: order.discount_amount || 0,
      status: order.status,
      paymentDeadline: order.payment_deadline,
      createdAt: order.created_at,
      finalFileLink: order.final_file_link,
      orderId: order.id,
    };

    const properties = mapOrderToNotionProperties(notionData);

    let notionPageId = order.notion_page_id;
    let notionUrl = "";

    if (notionPageId) {
      const response = await notion.pages.update({
        page_id: notionPageId,
        properties: properties as any,
      });
      notionUrl = response.url;
    } else {
      const response = await notion.pages.create({
        parent: {
          database_id: NOTION_DATABASE_ID,
        },
        properties: properties as any,
      });
      notionPageId = response.id;
      notionUrl = response.url;

      await supabase
        .from("orders")
        .update({
          notion_page_id: notionPageId,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    await supabase
      .from("orders")
      .update({
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return {
      success: true,
      notionPageId,
      notionUrl,
    };
  } catch (error: any) {
    console.error("Error syncing to Notion:", error);
    throw new Error(error.message || "Gagal sync ke Notion");
  }
}

export async function getNotionPage(pageId: string) {
  try {
    const response = await notion.pages.retrieve({ page_id: pageId });
    return response;
  } catch (error) {
    console.error("Error getting Notion page:", error);
    throw error;
  }
}

export async function testNotionConnection() {
  try {
    const response = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID,
    });
    return {
      success: true,
      databaseTitle: (response as any).title?.[0]?.plain_text || "Unknown",
    };
  } catch (error: any) {
    console.error("Error testing Notion connection:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
