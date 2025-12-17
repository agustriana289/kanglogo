"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    MagnifyingGlassIcon,
    FolderIcon,
    ShoppingBagIcon,
    PhotoIcon,
    CurrencyDollarIcon,
    ChatBubbleLeftIcon,
    DocumentTextIcon,
    ClipboardIcon,
    QuestionMarkCircleIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface SearchResult {
    id: number;
    title: string;
    subtitle?: string;
    link: string;
    type: "order" | "store_order" | "project" | "service" | "testimonial" | "article" | "page" | "faq";
    date?: string;
    status?: string;
}

interface GroupedResults {
    orders: SearchResult[];
    store_orders: SearchResult[];
    projects: SearchResult[];
    services: SearchResult[];
    testimonials: SearchResult[];
    articles: SearchResult[];
    pages: SearchResult[];
    faqs: SearchResult[];
}

export default function AdminSearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<GroupedResults>({
        orders: [],
        store_orders: [],
        projects: [],
        services: [],
        testimonials: [],
        articles: [],
        pages: [],
        faqs: [],
    });
    const [totalResults, setTotalResults] = useState(0);

    useEffect(() => {
        // Set initial loading to false after component mounts
        const timer = setTimeout(() => setInitialLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            performSearch(query);
        } else {
            setResults({
                orders: [],
                store_orders: [],
                projects: [],
                services: [],
                testimonials: [],
                articles: [],
                pages: [],
                faqs: [],
            });
            setTotalResults(0);
        }
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        const term = `%${searchTerm}%`;

        try {
            const [
                { data: orders },
                { data: storeOrders },
                { data: projects },
                { data: services },
                { data: testimonials },
                { data: articles },
                { data: pages },
                { data: faqs },
            ] = await Promise.all([
                // Orders
                supabase
                    .from("orders")
                    .select("id, invoice_number, customer_name, status, created_at")
                    .or(`invoice_number.ilike.${term},customer_name.ilike.${term}`)
                    .limit(5),
                // Store Orders
                supabase
                    .from("store_orders")
                    .select("id, order_number, customer_name, status, created_at")
                    .or(`order_number.ilike.${term},customer_name.ilike.${term}`)
                    .limit(5),
                // Projects
                supabase
                    .from("projects")
                    .select("id, title, created_at")
                    .ilike("title", term)
                    .limit(5),
                // Services
                supabase
                    .from("services")
                    .select("id, title")
                    .ilike("title", term)
                    .limit(5),
                // Testimonials
                supabase
                    .from("testimonials")
                    .select("id, alt_text, created_at")
                    .ilike("alt_text", term)
                    .limit(5),
                // Articles
                supabase
                    .from("articles")
                    .select("id, title, status, created_at")
                    .ilike("title", term)
                    .limit(5),
                // Pages
                supabase
                    .from("pages")
                    .select("id, title, slug")
                    .ilike("title", term)
                    .limit(5),
                // FAQs
                supabase
                    .from("faqs")
                    .select("id, question, answer")
                    .or(`question.ilike.${term},answer.ilike.${term}`)
                    .limit(5),
            ]);

            const mappedResults: GroupedResults = {
                orders: (orders || []).map(item => ({
                    id: item.id,
                    title: item.invoice_number || `Order #${item.id}`,
                    subtitle: item.customer_name,
                    link: `/admin/orders?id=${item.id}`, // Assuming we can filter by ID or similar, or just go to orders page
                    type: 'order',
                    date: item.created_at,
                    status: item.status
                })),
                store_orders: (storeOrders || []).map(item => ({
                    id: item.id,
                    title: item.order_number,
                    subtitle: item.customer_name,
                    link: `/admin/store/purchases?id=${item.id}`,
                    type: 'store_order',
                    date: item.created_at,
                    status: item.status
                })),
                projects: (projects || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    link: `/admin/projects/edit/${item.id}`, // Verify edit route
                    type: 'project',
                    date: item.created_at
                })),
                services: (services || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    link: `/admin/services/edit/${item.id}`, // Verify edit route
                    type: 'service'
                })),
                testimonials: (testimonials || []).map(item => ({
                    id: item.id,
                    title: item.alt_text || "Testimonial",
                    link: `/admin/testimonials`, // Testimonials usually modal-based, so just link to page
                    type: 'testimonial',
                    date: item.created_at
                })),
                articles: (articles || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    subtitle: item.status,
                    link: `/admin/blog/edit/${item.id}`,
                    type: 'article',
                    date: item.created_at
                })),
                pages: (pages || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    link: `/admin/pages/edit/${item.id}`,
                    type: 'page'
                })),
                faqs: (faqs || []).map(item => ({
                    id: item.id,
                    title: item.question,
                    subtitle: item.answer?.substring(0, 50) + "...",
                    link: `/admin/faq`, // Modal based
                    type: 'faq'
                }))
            };

            setResults(mappedResults);
            setTotalResults(
                Object.values(mappedResults).reduce((acc, curr) => acc + curr.length, 0)
            );

        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <FolderIcon className="w-5 h-5 text-blue-500" />;
            case 'store_order': return <ShoppingBagIcon className="w-5 h-5 text-purple-500" />;
            case 'project': return <PhotoIcon className="w-5 h-5 text-pink-500" />;
            case 'service': return <CurrencyDollarIcon className="w-5 h-5 text-green-500" />;
            case 'testimonial': return <ChatBubbleLeftIcon className="w-5 h-5 text-yellow-500" />;
            case 'article': return <DocumentTextIcon className="w-5 h-5 text-orange-500" />;
            case 'page': return <ClipboardIcon className="w-5 h-5 text-gray-500" />;
            case 'faq': return <QuestionMarkCircleIcon className="w-5 h-5 text-indigo-500" />;
            default: return <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const ResultSection = ({ title, items }: { title: string, items: SearchResult[] }) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-6 animate-fade-in-up">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
                    {title} ({items.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => (
                        <Link
                            key={`${item.type}-${item.id}`}
                            href={item.link}
                            className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-primary/50 transition-all group"
                        >
                            <div className="flex-shrink-0 mt-0.5 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                    {item.title}
                                </h4>
                                {item.subtitle && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {item.subtitle}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    {item.status && (
                                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                                            {item.status}
                                        </span>
                                    )}
                                    {item.date && (
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(item.date).toLocaleDateString('id-ID')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ArrowRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 self-center" />
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    if (initialLoading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Hasil Pencarian
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Menampilkan hasil untuk keyword <span className="font-semibold text-primary">"{query}"</span>
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : totalResults === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        Tidak ada hasil ditemukan
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Coba gunakan kata kunci lain atau periksa ejaan Anda.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <ResultSection title="Pesanan Layanan" items={results.orders} />
                    <ResultSection title="Pesanan Toko" items={results.store_orders} />
                    <ResultSection title="Portofolio Proyek" items={results.projects} />
                    <ResultSection title="Artikel Blog" items={results.articles} />
                    <ResultSection title="Layanan" items={results.services} />
                    <ResultSection title="Testimoni" items={results.testimonials} />
                    <ResultSection title="Halaman" items={results.pages} />
                    <ResultSection title="Pertanyaan (FAQ)" items={results.faqs} />
                </div>
            )}

        </div>
    );
}
