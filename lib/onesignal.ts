export async function sendPushNotification(
    headings: { [key: string]: string } = { en: "Notification" },
    contents: { [key: string]: string } = { en: "You have a new message" },
    targetSegments: string[] = ["All"], // Default to sending to everyone (e.g., Admins)
    url?: string
) {
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!apiKey || !appId) {
        console.warn("OneSignal API Key or App ID not configured.");
        return;
    }

    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            Authorization: `Basic ${apiKey}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            app_id: appId,
            included_segments: targetSegments,
            headings: headings,
            contents: contents,
            url: url, // Optional: URL to open when clicked
        }),
    };

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", options);
        const data = await response.json();
        console.log("OneSignal Notification Sent:", data);
        return data;
    } catch (err) {
        console.error("Error sending OneSignal notification:", err);
    }
}
