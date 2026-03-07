import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/push-server";
import webpush from "web-push";

export async function POST(request: Request) {
    try {
        const { title, message, url, icon, userId } = await request.json();

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and message are required" },
                { status: 400 }
            );
        }

        // Ambil subscriptions dari database
        // Jika userId diberikan, kirim ke user tersebut
        // Jika tidak, kirim ke semua (misal untuk admin broadcast, hati-hati spam)
        let query = supabase.from("push_subscriptions").select("*");

        if (userId) {
            query = query.eq("user_id", userId);
        } else {
            // NOTE: Untuk keamanan prod, sebaiknya jangan broadcast ke semua tanpa auth admin
            // Di sini kita asumsikan defaultnya kirim ke semua admin/device yang terdaftar
            // atau batasi query
        }

        const { data: subscriptions, error } = await query;

        if (error) {
            console.error("Database error fetching subscriptions:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: "No subscriptions found" });
        }

        const results = await Promise.all(
            subscriptions.map(async (sub) => {
                const pushSubscription: webpush.PushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                const result = await sendPushNotification(pushSubscription, {
                    title,
                    message,
                    url,
                    icon,
                });

                // Jika endpoint sudah tidak valid (410 Gone), hapus dari DB
                if (!result.success && (result.error as any)?.statusCode === 410) {
                    await supabase
                        .from("push_subscriptions")
                        .delete()
                        .eq("endpoint", sub.endpoint);
                }

                return result;
            })
        );

        const successCount = results.filter((r) => r.success).length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            total: subscriptions.length,
        });
    } catch (error) {
        console.error("Push send error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
