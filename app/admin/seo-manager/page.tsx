"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    ChartBarIcon,
    PencilSquareIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    PresentationChartLineIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";

// Dynamic Import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import SeoIntegrations from "./SeoIntegrations";

export default function SeoManagerPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "bulk-editor" | "integrations">("dashboard");
    const [loading, setLoading] = useState(true);
    const [rawVisits, setRawVisits] = useState<any[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<{ type: "page" | "referrer" | "country"; value: string } | null>(null);

    // Stats Data
    const [stats, setStats] = useState({
        totalViews: 0,
        totalVisitors: 0,
        conversions: 0,
        avgTime: "0m",
        bounceRate: "0%"
    });

    // Chart Data
    const [visitorChart, setVisitorChart] = useState<any>({ series: [], options: {} });
    const [countryChart, setCountryChart] = useState<any>({ series: [], options: {} });
    const [deviceChart, setDeviceChart] = useState<any>({ series: [], options: {} });

    // Table Data
    const [topPages, setTopPages] = useState<any[]>([]);
    const [referrers, setReferrers] = useState<any[]>([]);
    const [rankingStats, setRankingStats] = useState<any>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Default to 90 days for now to ensure data visibility
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - 90);

            const isoDate = startDate.toISOString();

            // 0. Fetch Ranking Stats (External API)
            fetch('/api/seo/rankings')
                .then(res => res.json())
                .then(data => {
                    console.log("Ranking API Data:", data); // Debugging
                    setRankingStats(data);
                })
                .catch(err => {
                    console.error("Ranking fetch error:", err);
                    setRankingStats({ error: "FetchFailed" });
                });

            // 1. Fetch Visits Data (Main Chart)
            // We need to group by date. For simplicity/speed in this MVP, we fetch raw rows and aggregate in JS.
            // For production with millions of rows, use SQL `group by` RPC.
            const { data: visits, error } = await supabase
                .from("analytics_visits")
                .select("created_at, country, device_type, page_path, referrer, event_type")
                .gte("created_at", isoDate)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (visits) {
                setRawVisits(visits);
                processAnalyticsData(visits);
            }

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalyticsData = (data: any[]) => {
        // --- A. Main Series Chart (Views per Day) ---
        const dailyCounts: { [key: string]: number } = {};
        data.forEach(v => {
            const date = new Date(v.created_at).toLocaleDateString("id-ID");
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        const dates = Object.keys(dailyCounts);
        const counts = Object.values(dailyCounts);

        setVisitorChart({
            series: [{ name: "Page Views", data: counts }],
            options: {
                chart: { type: "area", height: 350, toolbar: { show: false } },
                dataLabels: { enabled: false },
                stroke: { curve: "smooth" },
                xaxis: { categories: dates },
                colors: ["#4559F2"],
                fill: {
                    type: "gradient",
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.3,
                    }
                }
            }
        });

        // --- B. Demographics (Country) ---
        const countryCounts: { [key: string]: number } = {};
        data.forEach(v => {
            const c = v.country || "Unknown";
            countryCounts[c] = (countryCounts[c] || 0) + 1;
        });

        // Top 5 Countries
        const sortedCountries = Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        setCountryChart({
            series: sortedCountries.map(([, count]) => count),
            options: {
                chart: { type: "pie" },
                labels: sortedCountries.map(([country]) => country),
                colors: ["#4559F2", "#10B981", "#F59E0B", "#EF4444", "#6366F1"],
                legend: { position: 'bottom' }
            }
        });

        // --- C. Devices ---
        const deviceCounts: { [key: string]: number } = {};
        data.forEach(v => {
            const d = v.device_type || "Desktop";
            deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        });

        setDeviceChart({
            series: Object.values(deviceCounts),
            options: {
                chart: { type: "donut" },
                labels: Object.keys(deviceCounts),
                colors: ["#8B5CF6", "#EC4899", "#10B981"],
                plotOptions: { pie: { donut: { size: '65%' } } }
            }
        });

        // --- D. Top Pages ---
        const pageCounts: { [key: string]: number } = {};
        data.forEach(v => {
            pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
        });
        const sortedPages = Object.entries(pageCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([url, views]) => ({ url, views }));
        setTopPages(sortedPages);

        // --- E. Referrers ---
        const refCounts: { [key: string]: number } = {};
        data.forEach(v => {
            let ref = v.referrer;
            if (!ref || ref.includes(window.location.hostname)) ref = "Direct / Internal";
            else {
                try {
                    const url = new URL(ref);
                    ref = url.hostname;
                } catch { ref = "Unknown"; }
            }
            refCounts[ref] = (refCounts[ref] || 0) + 1;
        });
        const sortedRefs = Object.entries(refCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([source, count]) => ({ source, count }));
        setReferrers(sortedRefs);

        // --- F. Summary Stats ---
        setStats({
            totalViews: data.length,
            totalVisitors: new Set(data.map(v => v.ip || v.created_at)).size, // Simple approximation
            conversions: data.filter(v => v.event_type === "conversion_click").length, // Logic for this event needs to be added to buttons
            avgTime: "--", // Needs session tracking (advanced)
            bounceRate: "--"
        });
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Advanced SEO Manager</h1>
                    <p className="text-gray-500">Pusat kontrol statistik, visitor, dan optimasi SEO.</p>
                </div>

                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "dashboard" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("bulk-editor")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "bulk-editor" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Bulk Editor
                    </button>
                    <button
                        onClick={() => setActiveTab("integrations")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "integrations" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Integrasi API
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === "dashboard" ? (
                <>
                    {/* Filters */}
                    {/* Filters Removed as per request (Defaulting to All Time/30 Days) */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-500">Menampilkan data statistik pengunjung.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><LogoPathAnimation /></div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StatCard title="Total Views" value={stats.totalViews} icon={<PresentationChartLineIcon className="w-6 h-6 text-blue-500" />} />
                                <StatCard title="Conversion Clicks" value={stats.conversions} icon={<ShieldCheckIcon className="w-6 h-6 text-green-500" />} />
                            </div>

                            {/* Ranking Stats Section - Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Google Search Console */}
                                {rankingStats?.google?.connected ? (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png" alt="Google" className="w-8 h-8" />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Performa Pencarian (Google)</h3>
                                                    <p className="text-sm text-gray-500">30 Hari Terakhir</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="text-gray-500">Total Klik</p>
                                                    <p className="font-bold text-lg text-gray-900">{rankingStats.google.clicks}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500">Impressions</p>
                                                    <p className="font-bold text-lg text-gray-900">{rankingStats.google.impressions}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500">Avg Position</p>
                                                    <p className="font-bold text-lg text-green-600">#{Number(rankingStats.google.position).toFixed(1)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Keywords Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                    <tr>
                                                        <th className="px-4 py-2">Kata Kunci (Top 5)</th>
                                                        <th className="px-4 py-2 text-right">Klik</th>
                                                        <th className="px-4 py-2 text-right">Posisi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rankingStats.google.topKeywords?.map((k: any, idx: number) => (
                                                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                            <td className="px-4 py-2 font-medium text-gray-900">{k.keyword}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600">{k.clicks}</td>
                                                            <td className="px-4 py-2 text-right text-blue-600 font-semibold">{Number(k.position).toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                    {(!rankingStats.google.topKeywords || rankingStats.google.topKeywords.length === 0) && (
                                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Belum ada data kata kunci</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 ${rankingStats?.google?.hasKey ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-full shadow-sm">
                                                {rankingStats?.google?.hasKey ? (
                                                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                                                ) : (
                                                    <MagnifyingGlassIcon className="w-8 h-8 text-blue-500" />
                                                )}
                                            </div>
                                            <div>
                                                {rankingStats?.google?.hasKey ? (
                                                    <>
                                                        <h3 className="font-bold text-amber-900">Koneksi Google Search Console Bermasalah</h3>
                                                        <p className="text-sm text-amber-700">
                                                            {rankingStats.google.error === "NoVerifiedSites"
                                                                ? "Service Account tidak menemukan website yang terverifikasi. Pastikan Anda sudah menambahkan email Service Account sebagai 'Owner' di Google Search Console."
                                                                : `Terjadi error: ${rankingStats.google.error || "Gagal mengambil data"}`}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="font-bold text-blue-900">Aktifkan Data Ranking Google & Bing</h3>
                                                        <p className="text-sm text-blue-700">Hubungkan API gratis untuk melihat kata kunci pencarian dan posisi website Anda.</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("integrations")}
                                            className={`px-6 py-2 font-medium rounded-lg transition shadow-sm whitespace-nowrap ${rankingStats?.google?.hasKey ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                                        >
                                            {rankingStats?.google?.hasKey ? "Cek Konfigurasi" : "Setup Integrasi"}
                                        </button>
                                    </div>
                                )}

                                {/* Bing Webmaster Tools Section */}
                                {rankingStats?.bing?.connected ? (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5.4 2L4 3.4V20.6L14 22L19.4 15.6L10.6 13.8V7.8L5.4 2Z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Performa Pencarian (Bing)</h3>
                                                    <p className="text-sm text-gray-500">Data dari Bing Webmaster Tools</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="text-gray-500">Total Klik</p>
                                                    <p className="font-bold text-lg text-gray-900">{rankingStats.bing.clicks}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500">Impressions</p>
                                                    <p className="font-bold text-lg text-gray-900">{rankingStats.bing.impressions}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500">Avg Position</p>
                                                    <p className="font-bold text-lg text-green-600">#{Number(rankingStats.bing.position).toFixed(1)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Keywords Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                    <tr>
                                                        <th className="px-4 py-2">Kata Kunci (Top 5)</th>
                                                        <th className="px-4 py-2 text-right">Klik</th>
                                                        <th className="px-4 py-2 text-right">Posisi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rankingStats.bing.topKeywords?.map((k: any, idx: number) => (
                                                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                            <td className="px-4 py-2 font-medium text-gray-900">{k.keyword}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600">{k.clicks}</td>
                                                            <td className="px-4 py-2 text-right text-blue-600 font-semibold">{Number(k.position).toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                    {(!rankingStats.bing.topKeywords || rankingStats.bing.topKeywords.length === 0) && (
                                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Belum ada data kata kunci</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : rankingStats?.bing?.hasKey ? (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-full shadow-sm">
                                                <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-amber-900">Koneksi Bing Webmaster Tools Bermasalah</h3>
                                                <p className="text-sm text-amber-700">
                                                    {rankingStats.bing.error || "Gagal mengambil data dari Bing"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("integrations")}
                                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition shadow-sm whitespace-nowrap"
                                        >
                                            Cek Konfigurasi
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            {/* End of Ranking Stats Grid */}

                            {/* Main Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">Traffic Overview</h3>
                                <Chart options={visitorChart.options} series={visitorChart.series} type="area" height={350} />
                            </div>

                            {/* Secondary Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Negara Pengunjung</h3>
                                    <Chart options={countryChart.options} series={countryChart.series} type="pie" height={300} />
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Device Digunakan</h3>
                                    <Chart options={deviceChart.options} series={deviceChart.series} type="donut" height={300} />
                                </div>
                            </div>

                            {/* Tables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Top Pages */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-800">Halaman Paling Populer</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-3">Page URL</th>
                                                    <th className="px-6 py-3 text-right">Views</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topPages.map((page, i) => (
                                                    <tr
                                                        key={i}
                                                        onClick={() => setSelectedDetail({ type: "page", value: page.url })}
                                                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer group transition-colors"
                                                    >
                                                        <td className="px-6 py-3 font-medium text-gray-900 truncate max-w-xs group-hover:text-primary transition-colors">{page.url}</td>
                                                        <td className="px-6 py-3 text-right font-semibold text-primary">{page.views}</td>
                                                    </tr>
                                                ))}
                                                {topPages.length === 0 && (
                                                    <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400">Belum ada data</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Referrers */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-800">Sumber Traffic (Backlink)</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-3">Source</th>
                                                    <th className="px-6 py-3 text-right">Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {referrers.map((ref, i) => (
                                                    <tr
                                                        key={i}
                                                        onClick={() => setSelectedDetail({ type: "referrer", value: ref.source })}
                                                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer group transition-colors"
                                                    >
                                                        <td className="px-6 py-3 font-medium text-gray-900 group-hover:text-primary transition-colors">{ref.source}</td>
                                                        <td className="px-6 py-3 text-right font-semibold text-emerald-600">{ref.count}</td>
                                                    </tr>
                                                ))}
                                                {referrers.length === 0 && (
                                                    <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400">Belum ada data</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : activeTab === "integrations" ? (
                <SeoIntegrations />
            ) : (
                /* Bulk Editor Placeholder */
                <BulkSeoEditor />
            )}

            {/* Detail Modal */}
            {selectedDetail && (
                <DetailModal
                    type={selectedDetail.type}
                    value={selectedDetail.value}
                    allData={rawVisits}
                    onClose={() => setSelectedDetail(null)}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: any }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        </div>
    );
}

function DetailModal({ type, value, allData, onClose }: { type: "page" | "referrer" | "country", value: string, allData: any[], onClose: () => void }) {
    // Filter data based on selection
    const filteredData = allData.filter(v => {
        if (type === "page") return v.page_path === value;
        if (type === "referrer") {
            let ref = v.referrer;
            if (!ref || ref.includes(window.location.hostname)) ref = "Direct / Internal";
            else {
                try {
                    const url = new URL(ref);
                    ref = url.hostname;
                } catch { ref = "Unknown"; }
            }
            return ref === value;
        }
        return false;
    });

    // 1. Trend Chart (Views over time for this specific item)
    const dailyCounts: { [key: string]: number } = {};
    filteredData.forEach(v => {
        const date = new Date(v.created_at).toLocaleDateString("id-ID");
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    const chartSeries = [{ name: "Views", data: Object.values(dailyCounts) }];
    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: "area" as const, height: 250, toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth" },
        xaxis: { categories: Object.keys(dailyCounts) },
        colors: ["#3B82F6"],
        fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } }
    };

    // 2. Breakdown Stats
    const breakdown1: { [key: string]: number } = {}; // Left Table
    const breakdown2: { [key: string]: number } = {}; // Right Table

    let title1 = "";
    let title2 = "";

    if (type === "page") {
        title1 = "Asal Negara";
        title2 = "Sumber Referrer";
        filteredData.forEach(v => {
            breakdown1[v.country || "Unknown"] = (breakdown1[v.country || "Unknown"] || 0) + 1;

            let ref = v.referrer;
            if (!ref || ref.includes(window.location.hostname)) ref = "Direct / Internal";
            else { try { ref = new URL(ref).hostname; } catch { ref = "Unknown"; } }
            breakdown2[ref] = (breakdown2[ref] || 0) + 1;
        });
    } else if (type === "referrer") {
        title1 = "Halaman Yang Dituju";
        title2 = "Asal Negara";
        filteredData.forEach(v => {
            breakdown1[v.page_path] = (breakdown1[v.page_path] || 0) + 1;
            breakdown2[v.country || "Unknown"] = (breakdown2[v.country || "Unknown"] || 0) + 1;
        });
    }

    const sortedB1 = Object.entries(breakdown1).sort(([, a], [, b]) => b - a).slice(0, 10);
    const sortedB2 = Object.entries(breakdown2).sort(([, a], [, b]) => b - a).slice(0, 10);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{type === "page" ? "Detail Halaman" : "Detail Traffic Source"}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{value}</h3>
                        <p className="text-sm text-gray-500">Total {filteredData.length} kunjungan</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Chart */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Tren Kunjungan</h4>
                        <Chart options={chartOptions} series={chartSeries} type="area" height={250} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Table 1 */}
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-semibold text-sm text-gray-700">{title1}</div>
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    {sortedB1.map(([k, v], i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[200px]">{k}</td>
                                            <td className="px-4 py-2 text-right text-gray-600">{v}</td>
                                        </tr>
                                    ))}
                                    {sortedB1.length === 0 && <tr><td className="p-4 text-center text-gray-400">No data</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Table 2 */}
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-semibold text-sm text-gray-700">{title2}</div>
                            <table className="w-full text-sm text-left">
                                <tbody>
                                    {sortedB2.map(([k, v], i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[200px]">{k}</td>
                                            <td className="px-4 py-2 text-right text-gray-600">{v}</td>
                                        </tr>
                                    ))}
                                    {sortedB2.length === 0 && <tr><td className="p-4 text-center text-gray-400">No data</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BulkSeoEditor() {
    // Simplified Bulk Editor for now
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        const { data } = await supabase.from('articles').select('id, title, meta_title, meta_description, slug').order('created_at', { ascending: false }).limit(50);
        setArticles(data || []);
        setLoading(false);
    };

    const updateSeo = async (id: number, field: string, value: string) => {
        await supabase.from('articles').update({ [field]: value }).eq('id', id);
        // Optimistic update
        setArticles(articles.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    if (loading) return <div className="py-20 flex justify-center"><LogoPathAnimation /></div>

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Quick SEO Editor</h3>
                <p className="text-gray-500 text-sm">Edit meta tags tanpa membuka halaman editor penuh.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 w-1/4">Artikel</th>
                            <th className="px-6 py-3 w-1/4">Meta Title (SEO)</th>
                            <th className="px-6 py-3 w-1/2">Meta Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900 line-clamp-2">{article.title}</p>
                                    <span className="text-xs text-blue-500">{article.slug}</span>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <textarea
                                        className="w-full text-xs border-gray-300 rounded focus:ring-primary focus:border-primary p-2"
                                        rows={3}
                                        placeholder={article.title} // Fallback suggestion
                                        value={article.meta_title || ''}
                                        onChange={(e) => updateSeo(article.id, 'meta_title', e.target.value)}
                                        onBlur={(e) => updateSeo(article.id, 'meta_title', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                                        {(article.meta_title || '').length} chars
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <textarea
                                        className="w-full text-xs border-gray-300 rounded focus:ring-primary focus:border-primary p-2"
                                        rows={3}
                                        placeholder="Deskripsi singkat untuk Google..."
                                        value={article.meta_description || ''}
                                        onChange={(e) => updateSeo(article.id, 'meta_description', e.target.value)}
                                        onBlur={(e) => updateSeo(article.id, 'meta_description', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                                        {(article.meta_description || '').length} chars
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
