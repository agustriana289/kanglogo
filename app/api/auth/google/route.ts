import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
    );

    const scopes = [
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/tasks.readonly",
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline", // Essential for getting a refresh token
        scope: scopes,
        prompt: "consent", // Force consent to ensure refresh token is returned
    });

    return NextResponse.redirect(url);
}
