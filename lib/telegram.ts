const BOT_TOKEN = "8044037536:AAHHCyqI29eIobwotKLgGbkDoin7Rp8wBYg";
const CHAT_ID = "5268455560";

const CHANNEL_BOT_TOKEN = "7065106867:AAF3aC4zQpJqaRwc2TSA4jAwuILz0qAMwaI";
const CHANNEL_ID = "@kanglogokece";

export async function sendTelegramNotification(message: string) {
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "HTML", // Allows bold, italic, links
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error("Telegram API Error:", data);
        }
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
}

export async function sendChannelNotification(message: string, photoUrl?: string) {
    try {
        // Jika ada foto, gunakan endpoint sendPhoto
        const endpoint = photoUrl ? "sendPhoto" : "sendMessage";
        const url = `https://api.telegram.org/bot${CHANNEL_BOT_TOKEN}/${endpoint}`;

        const body: any = {
            chat_id: CHANNEL_ID,
            parse_mode: "HTML",
        };

        if (photoUrl) {
            body.photo = photoUrl;
            body.caption = message;
        } else {
            body.text = message;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error("Telegram Channel API Error:", data);
        }
    } catch (error) {
        console.error("Error sending Telegram Channel notification:", error);
    }
}
