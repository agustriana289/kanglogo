import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, amount, customerName, customerEmail, itemName } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = "Basic " + Buffer.from(serverKey + ":").toString("base64");

    const grossAmount = Math.round(Number(amount));
    const shortOrderId = `KL-${orderId.replace(/-/g, "").substring(0, 20)}-${Date.now().toString().slice(-8)}`;
    const shortItemName = (itemName || "Service Order").substring(0, 50);

    const payload = {
      transaction_details: {
        order_id: shortOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: (customerName || "Customer").substring(0, 50),
        email: customerEmail || user.email,
      },
      item_details: [
        {
          id: orderId.substring(0, 50),
          price: grossAmount,
          quantity: 1,
          name: shortItemName,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/workspace/${orderId}`,
      },
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_messages || "Midtrans error" }, { status: 400 });
    }

    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
