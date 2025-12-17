// app/store/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MarketplaceAsset } from "@/types/marketplace";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  StarIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import WidgetArea from "@/components/WidgetArea";

// Tambahkan interface untuk memperluas MarketplaceAsset dengan tags
interface AssetWithTags extends MarketplaceAsset {
  tags: string[];
}

const ITEMS_PER_PAGE = 12;

export default function MarketplacePage() {
  const [assets, setAssets] = useState<AssetWithTags[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithTags[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Logo");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("Semua");

  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // Refs for click outside detection
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!categoryDropdownOpen && !typeDropdownOpen && !priceDropdownOpen && !tagDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (typeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (priceDropdownOpen && priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setPriceDropdownOpen(false);
      }
      if (tagDropdownOpen && tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setTagDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryDropdownOpen, typeDropdownOpen, priceDropdownOpen, tagDropdownOpen]);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedCategory, selectedType, selectedTag, selectedPrice]);

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

    // Filter by price
    if (selectedPrice !== "Semua") {
      if (selectedPrice === "Gratis") {
        filtered = filtered.filter((asset) => asset.harga_aset === 0);
      } else if (selectedPrice === "< Rp 100.000") {
        filtered = filtered.filter((asset) => asset.harga_aset > 0 && asset.harga_aset < 100000);
      } else if (selectedPrice === "Rp 100.000 - Rp 500.000") {
        filtered = filtered.filter((asset) => asset.harga_aset >= 100000 && asset.harga_aset <= 500000);
      } else if (selectedPrice === "Rp 500.000 - Rp 1.000.000") {
        filtered = filtered.filter((asset) => asset.harga_aset > 500000 && asset.harga_aset <= 1000000);
      } else if (selectedPrice === "> Rp 1.000.000") {
        filtered = filtered.filter((asset) => asset.harga_aset > 1000000);
      }
    }

    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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
            <span className="text-primary">Marketplace</span> Aset Digital
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Jelajahi logo, ikon, dan aset grafis berkualitas tinggi untuk proyek Anda
          </p>
        </div>

        <WidgetArea position="marketplace_header" />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari aset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Category Filter - Custom Dropdown */}
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
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {["Semua", "Logo", "Icon", "Illustration"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedCategory(option);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedCategory === option
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type Filter - Custom Dropdown */}
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <StarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedType === "Semua" ? "Jenis" : selectedType}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {typeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {["Semua", "Premium", "Freebies"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedType(option);
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedType === option
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Filter - Custom Dropdown */}
              <div className="relative" ref={priceDropdownRef}>
                <button
                  onClick={() => setPriceDropdownOpen(!priceDropdownOpen)}
                  className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedPrice === "Semua" ? "Harga" : selectedPrice}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${priceDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {priceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { value: "Semua", label: "Semua Harga" },
                      { value: "Gratis", label: "Gratis" },
                      { value: "< Rp 100.000", label: "< Rp 100.000" },
                      { value: "Rp 100.000 - Rp 500.000", label: "Rp 100rb - Rp 500rb" },
                      { value: "Rp 500.000 - Rp 1.000.000", label: "Rp 500rb - Rp 1jt" },
                      { value: "> Rp 1.000.000", label: "> Rp 1.000.000" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedPrice(option.value);
                          setPriceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedPrice === option.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag Filter - Custom Dropdown */}
              {tags.length > 0 && (
                <div className="relative" ref={tagDropdownRef}>
                  <button
                    onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                    className="h-10 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedTag || "Tag"}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${tagDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {tagDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          setSelectedTag("");
                          setTagDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${selectedTag === ""
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700"
                          }`}
                      >
                        Semua Tag
                      </button>
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setTagDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${selectedTag === tag
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                            }`}
                        >
                          {tag}
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
          Menampilkan {currentItems.length} dari {filteredAssets.length} aset
        </p>

        {/* Assets Grid */}
        {currentItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada aset yang ditemukan</h3>
            <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((asset, index) => (
              <Link
                key={asset.id}
                href={`/store/${asset.slug}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative w-full h-48">
                  {asset.image_url ? (
                    <Image
                      src={asset.image_url}
                      alt={asset.nama_aset}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-300 hover:scale-105"
                      unoptimized
                      loading={index < 4 ? "eager" : "lazy"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                      Tidak Ada Gambar
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${asset.jenis === "premium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                        }`}
                    >
                      {asset.jenis === "premium" ? (
                        <StarIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <GiftIcon className="h-3 w-3 mr-1" />
                      )}
                      {asset.jenis === "premium" ? "Premium" : "Free"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {asset.nama_aset}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      {asset.kategori_aset}
                    </span>
                    <div className="flex items-center">
                      {asset.jenis === "premium" ? (
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(asset.harga_aset)}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-green-600">
                          Gratis
                        </span>
                      )}
                    </div>
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

        <WidgetArea position="marketplace_footer" />
      </div>
    </main>
  );
}
