import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const internalOrderId = order_id.split("-ORDER-")[0];

    let newStatus: string | null = null;
    let paymentStatus: string | null = null;

    if (transaction_status === "capture" && fraud_status === "accept") {
      newStatus = "processing";
      paymentStatus = "paid";
    } else if (transaction_status === "settlement") {
      newStatus = "processing";
      paymentStatus = "paid";
    } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
      newStatus = "cancelled";
      paymentStatus = "failed";
    } else if (transaction_status === "pending") {
      newStatus = "waiting_payment";
      paymentStatus = "unpaid";
    }

    if (newStatus) {
      await supabase.from("store_orders").update({
        status: newStatus,
        payment_status: paymentStatus,
        payment_method: body.payment_type || "midtrans",
      }).eq("id", internalOrderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
