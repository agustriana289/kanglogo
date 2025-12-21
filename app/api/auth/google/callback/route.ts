import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js"; // Using direct client for simplicity in API route if needed, or stick to project pattern
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens in Supabase
        // Using a direct client with URL/ANON KEY for now, assuming RLS allows insert or we use SERVICE_KEY if available.
        // However, best practice is to use the server-side client that handles cookies if we want to check user session.
        // Given the context (Admin Panel), we should probably ensure the user is an admin, but for the integration connection itself:

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Upsert tokens
        const { error: dbError } = await supabase
            .from("integrations")
            .upsert(
                {
                    service_name: "google_tasks",
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token, // might be undefined if not first consent or forced
                    expiry_date: tokens.expiry_date,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "service_name" }
            );

        if (dbError) {
            console.error("Supabase upsert error:", dbError);
            return NextResponse.json({ error: "Failed to save tokens" }, { status: 500 });
        }

        // Redirect back to tasks page with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/tasks?connected=true`);
    } catch (err) {
        console.error("Auth callback error:", err);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
