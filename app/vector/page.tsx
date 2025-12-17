// app/vector/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { LogoVector } from "@/types/logoVector";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    TagIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import VectorPreview from "@/components/VectorPreview";

const ITEMS_PER_PAGE = 12;

export default function VectorPage() {
    const [vectors, setVectors] = useState<LogoVector[]>([]);
    const [filteredVectors, setFilteredVectors] = useState<LogoVector[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");

    // Dropdown states
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
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
        fetchVectors();
    }, []);

    useEffect(() => {
        filterVectors();
    }, [vectors, searchQuery, selectedCategory]);

    const fetchVectors = async () => {
        try {
            const { data, error } = await supabase
                .from("logo_vectors")
                .select("*")
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setVectors(data || []);

            // Extract unique categories
            const uniqueCategories = [...new Set(data?.map(v => v.category).filter(Boolean))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error("Error fetching vectors:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterVectors = () => {
        let filtered = vectors;

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== "Semua") {
            filtered = filtered.filter(v => v.category === selectedCategory);
        }

        setFilteredVectors(filtered);
        setCurrentPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(filteredVectors.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredVectors.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <LogoPathAnimation />
                    <p className="mt-8 text-xl text-slate-600">Memuat logo vector...</p>
                </div>
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
                        <span className="text-primary">Logo</span> Vector
                    </h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Koleksi logo vector gratis untuk kebutuhan desain Anda
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari logo vector..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div ref={categoryDropdownRef} className="relative">
                            <button
                                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                className="w-full md:w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <TagIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm">{selectedCategory}</span>
                                </div>
                                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {categoryDropdownOpen && (
                                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <button
                                        onClick={() => { setSelectedCategory("Semua"); setCategoryDropdownOpen(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Semua
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setCategoryDropdownOpen(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Menampilkan {currentItems.length} dari {filteredVectors.length} logo vector
                    </div>
                </div>

                {/* Grid */}
                {currentItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {currentItems.map((vector) => (
                            <Link
                                key={vector.id}
                                href={`/vector/${vector.slug}`}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
                            >
                                {/* Preview */}
                                <div className="relative bg-gray-50 h-64 flex items-center justify-center p-8">
                                    <VectorPreview
                                        fileId={vector.file_id}
                                        name={vector.name}
                                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Category Badge */}
                                    <span className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                        {vector.category}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {vector.name}
                                    </h3>
                                    {vector.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                            {vector.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                            {vector.downloads} downloads
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada logo vector ditemukan</h3>
                        <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav aria-label="Page navigation" className="flex justify-center mt-8">
                        <ul className="flex -space-x-px text-sm">
                            <li>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg px-3 h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <li key={page}>
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`flex items-center justify-center border font-medium text-sm w-10 h-10 transition-colors ${currentPage === page
                                            ? 'text-primary bg-gray-100 border-gray-200'
                                            : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg px-3 h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
