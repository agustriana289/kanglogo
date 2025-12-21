const BOT_TOKEN = "8044037536:AAHHCyqI29eIobwotKLgGbkDoin7Rp8wBYg";
const CHAT_ID = "5268455560";

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
