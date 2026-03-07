import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const subscription = await request.json();

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: "Invalid subscription data" },
                { status: 400 }
            );
        }

        // Simpan subscription ke database
        const { error } = await supabase.from("push_subscriptions").upsert(
            {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: request.headers.get("user-agent") || "",
                // user_id bisa ditambahkan jika user sedang login (perlu auth context)
                // Untuk saat ini kita simpan endpointnya saja
            },
            { onConflict: "endpoint" }
        );

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
