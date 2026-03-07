"use server";

import { Resend } from "resend";

export async function checkEmailConfig() {
    const apiKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    return {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPrefix: apiKey?.substring(0, 3) || "",
        siteUrl: siteUrl || "Not Set",
    };
}

export async function sendTestEmailSimple(toEmail: string) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Coba kirim dengan 'onboarding@resend.dev' dulu jika domain belum verif, 
        // tapi user pakai 'halo@kanglogo.com', jadi kita coba itu.
        // Kita return error detailnya.

        const { data, error } = await resend.emails.send({
            from: "KangLogo <halo@kanglogo.com>", // Sesuai request user
            to: [toEmail],
            subject: "Test Email Debugging KangLogo",
            html: "<p>Ini adalah email test untuk memastikan konfigurasi Resend berjalan dengan baik.</p>",
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error: error };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Unexpected Error:", err);
        return { success: false, error: { message: err.message, name: err.name, stack: err.stack } };
    }
}
