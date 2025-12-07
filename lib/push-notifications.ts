// lib/push-notifications.ts
// Utility functions for PWA push notifications

// Check if push notifications are supported
export function isPushNotificationSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushNotificationSupported()) {
        console.warn("Push notifications not supported");
        return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission | null {
    if (!isPushNotificationSupported()) {
        return null;
    }
    return Notification.permission;
}

// Show a local notification (without push server)
interface NotificationData {
    title: string;
    message: string;
    link?: string;
    type?: string;
    icon?: string;
}

export async function showLocalNotification(data: NotificationData): Promise<void> {
    if (!isPushNotificationSupported()) {
        console.warn("Push notifications not supported");
        return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    const options: NotificationOptions = {
        body: data.message,
        icon: data.icon || "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: data.type || "general",
        data: {
            url: data.link || "/admin",
        },
        requireInteraction: true,
    };

    await registration.showNotification(data.title, options);
}

// Subscribe to push notifications from database
export async function subscribeToNotifications(
    onNotification: (notification: NotificationData) => void
): Promise<() => void> {
    if (typeof window === "undefined") {
        return () => { };
    }

    // Import supabase dynamically to avoid SSR issues
    const { supabase } = await import("./supabase");

    // Subscribe to realtime notifications
    const channel = supabase
        .channel("notifications-channel")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications",
            },
            async (payload) => {
                const notification = payload.new as any;

                // Show notification if permission granted
                if (Notification.permission === "granted") {
                    showLocalNotification({
                        title: notification.title || "Notifikasi Baru",
                        message: notification.message || "",
                        link: notification.link,
                        type: notification.type,
                    });
                }

                // Also call the callback
                onNotification({
                    title: notification.title,
                    message: notification.message,
                    link: notification.link,
                    type: notification.type,
                });
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}
