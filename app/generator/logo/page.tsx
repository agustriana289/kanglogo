"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LogoAsset } from "@/types/logo-generator";
import LogoLoading from "@/components/LogoLoading";
import WidgetArea from "@/components/WidgetArea";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";

export default function LogoGeneratorListPage() {
    const [assets, setAssets] = useState<LogoAsset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<LogoAsset[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [showFilters, setShowFilters] = useState(false);

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
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("Semua");
    };

    const hasActiveFilters = searchQuery || selectedCategory !== "Semua";

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
                <div className="flex flex-col items-center justify-center">
                    <LogoLoading size="xl" />
                    <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
                        Menyiapkan generator logo...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <section className="py-16 bg-slate-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-tight">
                        Logo <span className="text-primary">Generator</span>
                    </h1>
                    <p className="text-base font-normal leading-7 text-slate-700">
                        Pilih template dasar dan buat logo profesional Anda dalam hitungan detik.
                    </p>
                </div>

                {/* Use widget area for consistent layout if needed, though optional here */}
                <WidgetArea position="proyek_header" />

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Pencarian
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Cari template..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            {/* Categories */}
                            {categories.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                                        Kategori
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedCategory("Semua")}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === "Semua"
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                }`}
                                        >
                                            Semua
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat
                                                        ? "bg-primary text-white"
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-3/4">
                        {/* Mobile Filter Toggle */}
                        <div className="lg:hidden mb-6">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md"
                            >
                                <FunnelIcon className="h-5 w-5 mr-2" />
                                Filter
                            </button>
                        </div>

                        <div className="mb-6 flex justify-between items-center">
                            <p className="text-slate-600">
                                Menampilkan {filteredAssets.length} template
                            </p>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden group border border-slate-100"
                                >
                                    <Link href={`/generator/logo/${asset.slug}`}>
                                        <div className="relative w-full aspect-square bg-slate-50 p-8 flex items-center justify-center">
                                            <div
                                                className="w-full h-full text-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain transition-transform duration-300 group-hover:scale-105"
                                                dangerouslySetInnerHTML={{ __html: asset.svg_content }}
                                            />
                                        </div>
                                    </Link>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            {asset.nama_aset}
                                        </h3>

                                        <div className="flex items-center text-sm text-slate-600 mb-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {asset.kategori_aset || 'Umum'}
                                            </span>
                                        </div>

                                        <Link
                                            href={`/generator/logo/${asset.slug}`}
                                            className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                                        >
                                            Gunakan Template &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredAssets.length === 0 && (
                            <div className="text-center py-12">
                                <h3 className="mt-2 text-sm font-medium text-slate-900">
                                    Tidak ada template yang ditemukan
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
