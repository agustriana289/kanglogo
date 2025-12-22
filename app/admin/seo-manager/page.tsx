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
} from "@heroicons/react/24/outline";

// Dynamic Import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function SeoManagerPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "bulk-editor">("dashboard");
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "all">("week");

    // Stats Data
    const [stats, setStats] = useState({
        totalViews: 0,
        totalVisitors: 0,
        conversions: 0,
        avgTime: "0m", // Placeholder
        bounceRate: "0%" // Placeholder
    });

    // Chart Data
    const [visitorChart, setVisitorChart] = useState<any>({
        series: [],
        options: {},
    });
    const [countryChart, setCountryChart] = useState<any>({ series: [], options: {} });
    const [deviceChart, setDeviceChart] = useState<any>({ series: [], options: {} });

    // Table Data
    const [topPages, setTopPages] = useState<any[]>([]);
    const [referrers, setReferrers] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Calculate date filter
            const now = new Date();
            let startDate = new Date();

            if (dateRange === "today") startDate.setDate(now.getDate() - 0); // Start of today treated slightly differently in SQL usually, but let's just say "today's data"
            if (dateRange === "week") startDate.setDate(now.getDate() - 7);
            if (dateRange === "month") startDate.setMonth(now.getMonth() - 1);
            if (dateRange === "year") startDate.setFullYear(now.getFullYear() - 1);
            if (dateRange === "all") startDate = new Date(0); // Epoch

            const isoDate = startDate.toISOString();

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
                </div>
            </div>

            {/* Content */}
            {activeTab === "dashboard" ? (
                <>
                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {(["today", "week", "month", "year", "all"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border ${dateRange === range
                                        ? "bg-white border-primary text-primary shadow-sm"
                                        : "bg-white border-transparent text-gray-500 hover:bg-gray-100"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><LogoPathAnimation /></div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <StatCard title="Total Views" value={stats.totalViews} icon={<PresentationChartLineIcon className="w-6 h-6 text-blue-500" />} />
                                <StatCard title="Conversion Clicks" value={stats.conversions} icon={<ShieldCheckIcon className="w-6 h-6 text-green-500" />} />
                                <StatCard title="Top Country" value={countryChart.options.labels?.[0] || "-"} icon={<GlobeAltIcon className="w-6 h-6 text-indigo-500" />} />
                                <StatCard title="Top Device" value={deviceChart.options.labels?.[0] || "-"} icon={<DevicePhoneMobileIcon className="w-6 h-6 text-pink-500" />} />
                            </div>

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
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                        <td className="px-6 py-3 font-medium text-gray-900 truncate max-w-xs">{page.url}</td>
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
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                        <td className="px-6 py-3 font-medium text-gray-900">{ref.source}</td>
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
            ) : (
                /* Bulk Editor Placeholder - Can be split into own component later */
                <BulkSeoEditor />
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
