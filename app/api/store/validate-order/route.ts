import { NextResponse } from "next/server";
import { validateOrder } from "@/lib/validators/orderValidator";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Validate order data
        const validationResult = validateOrder({
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_whatsapp: data.customer_whatsapp,
            country_code: data.country_code,
        });

        if (!validationResult.valid) {
            return NextResponse.json(
                { error: validationResult.error },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Validation failed" },
            { status: 500 }
        );
    }
}
