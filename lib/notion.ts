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
  const properties: any = {
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
    "Order ID": {
      number: data.orderId,
    },
  };

  if (data.customerEmail) {
    properties["Customer Email"] = {
      email: data.customerEmail,
    };
  }

  if (data.customerWhatsapp) {
    properties["Customer WhatsApp"] = {
      phone_number: data.customerWhatsapp,
    };
  }

  if (data.paymentDeadline) {
    properties["Payment Deadline"] = {
      date: {
        start: data.paymentDeadline.split("T")[0],
      },
    };
  }

  if (data.createdAt) {
    properties["Created At"] = {
      date: {
        start: data.createdAt.split("T")[0],
      },
    };
  }

  if (data.finalFileLink) {
    properties["Final File"] = {
      url: data.finalFileLink,
    };
  }

  return properties;
}

async function findExistingNotionPage(orderId: number): Promise<string | null> {
  try {
    const response = await (notion.databases as any).query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: "Order ID",
        number: {
          equals: orderId,
        },
      },
    });

    if (response.results && response.results.length > 0) {
      return response.results[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error finding existing Notion page:", error);
    return null;
  }
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
      try {
        await notion.pages.update({
          page_id: notionPageId,
          properties: properties as any,
        });
        notionUrl = `https://notion.so/${notionPageId.replace(/-/g, "")}`;
      } catch (updateError: any) {
        if (updateError.code === "object_not_found") {
          notionPageId = null;
        } else {
          throw updateError;
        }
      }
    }

    if (!notionPageId) {
      const existingPageId = await findExistingNotionPage(orderId);

      if (existingPageId) {
        notionPageId = existingPageId;
        await notion.pages.update({
          page_id: notionPageId,
          properties: properties as any,
        });
        notionUrl = `https://notion.so/${notionPageId.replace(/-/g, "")}`;
      } else {
        const response = await notion.pages.create({
          parent: {
            database_id: NOTION_DATABASE_ID,
          },
          properties: properties as any,
        });
        notionPageId = response.id;
        notionUrl = `https://notion.so/${response.id.replace(/-/g, "")}`;
      }

      await supabase
        .from("orders")
        .update({
          notion_page_id: notionPageId,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } else {
      await supabase
        .from("orders")
        .update({
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

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

export async function deleteNotionPage(pageId: string) {
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting Notion page:", error);
    throw new Error(error.message || "Gagal menghapus page dari Notion");
  }
}

