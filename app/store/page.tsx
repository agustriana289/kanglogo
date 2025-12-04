// app/store/page.tsx
"use client";

import { useState, useEffect } from "react";
import { MarketplaceAsset } from "@/types/marketplace";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  StarIcon,
  GiftIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import LogoLoading from "@/components/LogoLoading";
import WidgetArea from "@/components/WidgetArea";

// Tambahkan interface untuk memperluas MarketplaceAsset dengan tags
interface AssetWithTags extends MarketplaceAsset {
  tags: string[];
}

export default function MarketplacePage() {
  const [assets, setAssets] = useState<AssetWithTags[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithTags[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedTag, setSelectedTag] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedCategory, selectedType, selectedTag]);

  // Fungsi untuk memecah string tagline menjadi array tag
  const parseTags = (tagline: string | null | undefined): string[] => {
    if (!tagline) return [];
    return tagline
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Proses aset untuk menambahkan array tags
      const processedAssets: AssetWithTags[] = (data || []).map((asset) => ({
        ...asset,
        tags: parseTags(asset.tagline),
      }));

      setAssets(processedAssets);

      // Extract semua tag unik
      const allTags = processedAssets.flatMap((asset) => asset.tags);
      const uniqueTags = [...new Set(allTags)].sort(); // Urutkan secara alfabet
      setTags(uniqueTags);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          asset.nama_aset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by category
    if (selectedCategory !== "Semua") {
      filtered = filtered.filter(
        (asset) =>
          asset.kategori_aset.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by type (premium/freebies)
    if (selectedType !== "Semua") {
      filtered = filtered.filter(
        (asset) => asset.jenis.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((asset) => asset.tags.includes(selectedTag));
    }

    setFilteredAssets(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Semua");
    setSelectedType("Semua");
    setSelectedTag("");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "Semua" ||
    selectedType !== "Semua" ||
    selectedTag;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Jelajahi logo, ikon, dan aset grafis berkualitas tinggi untuk proyek
            Anda.
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
            <span className="text-primary">Marketplace</span> Aset Digital
          </h1>
          <p className="text-base font-normal leading-7 text-slate-700">
            Jelajahi logo, ikon, dan aset grafis berkualitas tinggi untuk proyek
            Anda.
          </p>
        </div>

        <WidgetArea position="marketplace_header" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
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
                    placeholder="Cari aset..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Kategori
                </h3>
                <div className="space-y-2">
                  {["Semua", "Logo", "Icon", "Illustration"].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Jenis
                </h3>
                <div className="space-y-2">
                  {["Semua", "Premium", "Freebies"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === type
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              {tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Tags
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedTag(selectedTag === tag ? "" : tag)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedTag === tag
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:w-3/4">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Filter
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
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
                      placeholder="Cari aset..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Kategori
                  </h3>
                  <div className="space-y-2">
                    {["Semua", "Logo", "Icon", "Template", "Font"].map(
                      (category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === category
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {category}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <WidgetArea position="marketplace_sidebar" />

                {/* Type Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Jenis
                  </h3>
                  <div className="space-y-2">
                    {["Semua", "Premium", "Freebies"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedType === type
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Filter */}
                {tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Tags
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setSelectedTag(selectedTag === tag ? "" : tag)
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            selectedTag === tag
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-slate-600">
                Menampilkan {filteredAssets.length} dari {assets.length} aset
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Hapus Filter
                </button>
              )}
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden group"
                >
                  <Link href={`/store/${asset.slug}`}>
                    <div className="relative w-full h-64">
                      {asset.image_url ? (
                        <Image
                          src={asset.image_url}
                          alt={asset.nama_aset}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">
                          Tidak Ada Gambar
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            asset.jenis === "premium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {asset.jenis === "premium" ? (
                            <StarIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <GiftIcon className="h-4 w-4 mr-1" />
                          )}
                          {asset.jenis === "premium" ? "Premium" : "Freebies"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {asset.nama_aset}
                    </h3>

                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {asset.kategori_aset}
                      </span>
                      <div className="flex items-center">
                        {asset.jenis === "premium" ? (
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(asset.harga_aset)}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-green-600">
                            Gratis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredAssets.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  Tidak ada aset yang ditemukan
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Coba ubah filter atau kata kunci pencarian Anda.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            )}

            <WidgetArea position="marketplace_footer" />
          </div>
        </div>
      </div>
    </section>
  );
}
