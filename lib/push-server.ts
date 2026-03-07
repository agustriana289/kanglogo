import webpush from "web-push";

// Konfigurasi VAPID keys
// Kunci ini harus ada di environment variables
if (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
) {
    webpush.setVapidDetails(
        "mailto:halo@kanglogo.com",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID Keys not set. Push notifications will not work.");
}

export interface PushPayload {
    title: string;
    message: string;
    url?: string;
    icon?: string;
}

export async function sendPushNotification(
    subscription: webpush.PushSubscription,
    payload: PushPayload
) {
    try {
        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.message,
            data: {
                url: payload.url || "/",
            },
            icon: payload.icon || "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
        });

        await webpush.sendNotification(subscription, pushPayload);
        return { success: true };
    } catch (error) {
        console.error("Error sending push notification:", error);
        return { success: false, error };
    }
}
