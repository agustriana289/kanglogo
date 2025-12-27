import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { google } from "googleapis";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        // 1. Get Keys from DB
        const { data: settings, error } = await supabase
            .from("website_settings")
            .select("google_search_console_key, bing_webmaster_key, website_name")
            .single();

        if (error || !settings) {
            console.error("Settings fetch error:", error);
            return NextResponse.json({ error: "SettingsNotFound" }, { status: 500 });
        }

        const stats = {
            google: { connected: false, hasKey: !!settings.google_search_console_key, error: null as string | null, clicks: 0, impressions: 0, position: 0, topKeywords: [] as any[] },
            bing: { connected: false, hasKey: !!settings.bing_webmaster_key, error: null as string | null, clicks: 0, impressions: 0, position: 0, topKeywords: [] as any[] }
        };

        // 2. Google Search Console Fetch
        if (settings.google_search_console_key) {
            try {
                const credentials = JSON.parse(settings.google_search_console_key);
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
                });

                const searchconsole = google.searchconsole({ version: "v1", auth });

                // We need the siteUrl. Usually matches the property name in GSC.
                // We'll try to list sites first to find the matching one or just use the first one.
                const sitesRes = await searchconsole.sites.list();
                const siteUrl = sitesRes.data.siteEntry?.[0]?.siteUrl;

                if (siteUrl) {
                    const today = new Date();
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(today.getDate() - 30);

                    const res = await searchconsole.searchanalytics.query({
                        siteUrl,
                        requestBody: {
                            startDate: thirtyDaysAgo.toISOString().split("T")[0],
                            endDate: today.toISOString().split("T")[0],
                            dimensions: ["query"],
                            rowLimit: 5
                        }
                    });

                    const rows = res.data.rows || [];

                    const totalRes = await searchconsole.searchanalytics.query({
                        siteUrl,
                        requestBody: {
                            startDate: thirtyDaysAgo.toISOString().split("T")[0],
                            endDate: today.toISOString().split("T")[0],
                            dimensions: []
                        }
                    });

                    const totalRow = totalRes.data.rows?.[0]; // Should be one row with aggregates

                    stats.google = {
                        ...stats.google,
                        connected: true,
                        clicks: totalRow?.clicks || 0,
                        impressions: totalRow?.impressions || 0,
                        position: totalRow?.position || 0,
                        topKeywords: rows.map((r: any) => ({ keyword: r.keys[0], clicks: r.clicks, position: r.position }))
                    };
                } else {
                    stats.google.error = "NoVerifiedSites";
                }
            } catch (err: any) {
                console.error("Google API Error:", err);
                stats.google.error = err.message || "APIError";
            }
        }

        // 3. Bing Webmaster Fetch
        if (settings.bing_webmaster_key) {
            try {
                const apiKey = settings.bing_webmaster_key;
                const sitesRes = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=${apiKey}`);

                if (sitesRes.ok) {
                    const sitesData = await sitesRes.json();
                    const siteUrl = sitesData.d?.[0]?.Url;

                    if (siteUrl) {
                        // Fetch query statistics
                        const today = new Date();
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(today.getDate() - 30);

                        const queryStatsUrl = `https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${apiKey}`;
                        const queryRes = await fetch(queryStatsUrl);

                        if (queryRes.ok) {
                            const queryData = await queryRes.json();
                            const queries = queryData.d || [];

                            // Calculate totals
                            let totalClicks = 0;
                            let totalImpressions = 0;
                            let totalPosition = 0;

                            queries.forEach((q: any) => {
                                totalClicks += q.Clicks || 0;
                                totalImpressions += q.Impressions || 0;
                                totalPosition += q.AvgClickPosition || 0;
                            });

                            const avgPosition = queries.length > 0 ? totalPosition / queries.length : 0;

                            // Get top 5 queries
                            const topQueries = queries
                                .sort((a: any, b: any) => (b.Clicks || 0) - (a.Clicks || 0))
                                .slice(0, 5)
                                .map((q: any) => ({
                                    keyword: q.Query,
                                    clicks: q.Clicks || 0,
                                    impressions: q.Impressions || 0,
                                    position: q.AvgClickPosition || 0
                                }));

                            stats.bing = {
                                ...stats.bing,
                                connected: true,
                                clicks: totalClicks,
                                impressions: totalImpressions,
                                position: avgPosition,
                                topKeywords: topQueries
                            };
                        } else {
                            stats.bing.error = "Gagal mengambil data query dari Bing";
                        }
                    } else {
                        stats.bing.error = "NoVerifiedSites";
                    }
                } else {
                    stats.bing.error = "Gagal terhubung ke Bing API";
                }
            } catch (err: any) {
                console.error("Bing API Error:", err);
                stats.bing.error = err.message;
            }
        }

        return NextResponse.json(stats);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
