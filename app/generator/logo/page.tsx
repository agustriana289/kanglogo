"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LogoAsset } from "@/types/logo-generator";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import WidgetArea from "@/components/WidgetArea";
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 12;

export default function LogoGeneratorListPage() {
    const [assets, setAssets] = useState<LogoAsset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<LogoAsset[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");

    // Dropdown states
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // Refs for click outside detection
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!categoryDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setCategoryDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [categoryDropdownOpen]);

    useEffect(() => {
        fetchAssets();
    }, []);

    useEffect(() => {
        filterAssets();
    }, [assets, searchQuery, selectedCategory]);

    const fetchAssets = async () => {
        try {
            const { data, error } = await supabase
                .from("logo_assets")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setAssets(data || []);

            const uniqueCategories = [
                ...new Set(data?.map((a) => a.kategori_aset).filter(Boolean)),
            ];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterAssets = () => {
        let filtered = [...assets];

        if (searchQuery) {
            filtered = filtered.filter((a) =>
                a.nama_aset.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== "Semua") {
            filtered = filtered.filter((a) => a.kategori_aset === selectedCategory);
        }

        setFilteredAssets(filtered);
        setCurrentPage(1);
    };

    // Pagination calculation
    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <main className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        Logo <span className="text-primary">Generator</span>
                    </h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Pilih template dasar dan buat logo profesional Anda dalam hitungan detik
                    </p>
                </div>

                <WidgetArea position="proyek_header" />

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari template..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Category Filter - Custom Dropdown */}
                            {categories.length > 0 && (
                                <div className="relative" ref={categoryDropdownRef}>
                                    <button
                                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                        className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    >
                                        <Squares2X2Icon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{selectedCategory === "Semua" ? "Kategori" : selectedCategory}</span>
                                        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    {categoryDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory("Semua");
                                                    setCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${selectedCategory === "Semua"
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-gray-700"
                                                    }`}
                                            >
                                                Semua Kategori
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setCategoryDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${selectedCategory === cat
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-gray-700"
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <p className="text-sm text-gray-500 mb-4">
                    Menampilkan {currentItems.length} dari {filteredAssets.length} template
                </p>

                {/* Templates Grid */}
                {currentItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada template yang ditemukan</h3>
                        <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentItems.map((asset) => (
                            <Link
                                key={asset.id}
                                href={`/generator/logo/${asset.slug}`}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
                            >
                                {/* SVG Preview */}
                                <div className="relative w-full aspect-square bg-white p-8 flex items-center justify-center">
                                    <div
                                        className="w-full h-full text-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain transition-transform duration-300 group-hover:scale-105"
                                        dangerouslySetInnerHTML={{ __html: asset.svg_content }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {asset.nama_aset}
                                    </h3>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                                            {asset.kategori_aset || "Umum"}
                                        </span>
                                        <span className="text-xs text-primary font-medium hover:underline">
                                            Gunakan →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav aria-label="Page navigation" className="flex justify-center mt-10">
                        <ul className="flex -space-x-px text-sm">
                            {/* Previous Button */}
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                            </li>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <li key={page}>
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        aria-current={currentPage === page ? "page" : undefined}
                                        className={`flex items-center justify-center box-border border font-medium text-sm w-10 h-10 focus:outline-none transition-colors ${currentPage === page
                                            ? "text-primary bg-gray-100 border-gray-200 hover:text-primary"
                                            : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </li>
                            ))}

                            {/* Next Button */}
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </main>
    );
}
