// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendOrderNotificationEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { type, invoiceNumber, customerName, customerEmail, customerWhatsapp, productName, price, discountAmount } = body;

        if (!invoiceNumber || !customerName || !customerEmail || !productName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const result = await sendOrderNotificationEmails({
            type: type || "service",
            invoiceNumber,
            customerName,
            customerEmail,
            customerWhatsapp: customerWhatsapp || "",
            productName,
            price: price || 0,
            discountAmount: discountAmount || 0,
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
