"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { MarketplaceAsset } from "@/types/marketplace";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { uploadFile } from "@/lib/supabase-storage";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  TagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type FilterTab = "premium" | "freebies";

export default function MarketplaceManagementPage() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("premium");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { showAlert, showConfirm } = useAlert();

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MarketplaceAsset | null>(null);

  const [formData, setFormData] = useState({
    nama_aset: "",
    slug: "",
    kategori_aset: "",
    jenis: "freebies" as "premium" | "freebies",
    harga_aset: 0,
    jenis_lisensi: "",
    tagline: "",
    deskripsi: "",
    image_url: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);

  // Refs for click outside detection
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!categoryDropdownOpen && !priceDropdownOpen && !pageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (priceDropdownOpen && priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setPriceDropdownOpen(false);
      }
      if (pageDropdownOpen && pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryDropdownOpen, priceDropdownOpen, pageDropdownOpen]);

  // Stats
  const stats = useMemo(() => ({
    premium: assets.filter((a) => a.jenis === "premium").length,
    freebies: assets.filter((a) => a.jenis === "freebies").length,
  }), [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Tab filter
    filtered = filtered.filter((a) => a.jenis === activeTab);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.nama_aset.toLowerCase().includes(query) ||
          a.kategori_aset.toLowerCase().includes(query) ||
          a.slug.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((a) => a.kategori_aset === categoryFilter);
    }

    // Price filter
    if (priceFilter !== "all") {
      if (priceFilter === "free") {
        filtered = filtered.filter((a) => a.harga_aset === 0);
      } else if (priceFilter === "under100k") {
        filtered = filtered.filter((a) => a.harga_aset > 0 && a.harga_aset < 100000);
      } else if (priceFilter === "100k-500k") {
        filtered = filtered.filter((a) => a.harga_aset >= 100000 && a.harga_aset <= 500000);
      } else if (priceFilter === "above500k") {
        filtered = filtered.filter((a) => a.harga_aset > 500000);
      }
    }

    return filtered;
  }, [assets, activeTab, searchQuery, categoryFilter, priceFilter]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchQuery, categoryFilter, priceFilter, itemsPerPage]);




  // Auto generate slug
  useEffect(() => {
    if (formData.nama_aset && !editingAsset) {
      const slug = formData.nama_aset
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.nama_aset, editingAsset]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      showAlert("error", "Error", "Gagal memuat aset marketplace!");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAddAsset = () => {
    setEditingAsset(null);
    setFormData({
      nama_aset: "",
      slug: "",
      kategori_aset: "",
      jenis: "freebies",
      harga_aset: 0,
      jenis_lisensi: "",
      tagline: "",
      deskripsi: "",
      image_url: "",
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEditAsset = (asset: MarketplaceAsset) => {
    setEditingAsset(asset);
    setFormData({
      nama_aset: asset.nama_aset,
      slug: asset.slug,
      kategori_aset: asset.kategori_aset,
      jenis: asset.jenis,
      harga_aset: asset.harga_aset,
      jenis_lisensi: asset.jenis_lisensi,
      tagline: asset.tagline,
      deskripsi: asset.deskripsi,
      image_url: asset.image_url || "",
    });
    setImagePreview(asset.image_url || null);
    setShowModal(true);
  };

  const handleDeleteAsset = async (id: number) => {
    const confirmed = await showConfirm(
      "Hapus Produk",
      "Apakah Anda yakin ingin menghapus produk ini?",
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("marketplace_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setAssets(assets.filter((a) => a.id !== id));
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
      showAlert("success", "Berhasil", "Produk berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting asset:", error);
      showAlert("error", "Gagal", "Gagal menghapus produk!");
    } finally {
      setSaving(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await showConfirm(
      "Hapus Produk",
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} produk?`,
      "error",
      "Ya, Hapus Semua"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("marketplace_assets")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      setAssets(assets.filter((a) => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      showAlert("success", "Berhasil", `${selectedIds.length} produk berhasil dihapus!`);
    } catch (error) {
      console.error("Error batch deleting:", error);
      showAlert("error", "Gagal", "Gagal menghapus produk!");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert("warning", "Peringatan", "Silakan pilih file gambar!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("warning", "Peringatan", "Ukuran file terlalu besar! Maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAsset = async () => {
    if (!formData.nama_aset.trim()) {
      showAlert("warning", "Validasi", "Nama Aset tidak boleh kosong!");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      // Supabase Storage Upload
      if (fileInputRef.current?.files?.[0]) {
        setUploadingImage(true);
        const file = fileInputRef.current.files[0];
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const filePath = `store/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadFile("assets", filePath, file);

        if (uploadError) {
          throw new Error("Gagal mengupload gambar ke Supabase Storage");
        }
        imageUrl = publicUrl;
        setUploadingImage(false);
      }

      const updatedFormData = { ...formData, image_url: imageUrl };

      if (editingAsset) {
        const { error } = await supabase
          .from("marketplace_assets")
          .update(updatedFormData)
          .eq("id", editingAsset.id);
        if (error) throw error;

        fetchAssets();
        showAlert("success", "Berhasil", "Produk berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("marketplace_assets")
          .insert(updatedFormData);
        if (error) throw error;

        fetchAssets();
        showAlert("success", "Berhasil", "Produk berhasil ditambahkan!");
      }

      setShowModal(false);
    } catch (error: any) {
      console.error("Error saving asset:", error);
      showAlert("error", "Gagal", error.message || "Gagal menyimpan produk!");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((a) => a.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Custom checkbox component with Heroicons
  const CustomCheckbox = ({ checked, onChange, variant = "default" }: { checked: boolean; onChange: () => void; variant?: "default" | "header" }) => (
    <button
      onClick={onChange}
      className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${checked
        ? variant === "header"
          ? "text-white"
          : "text-primary"
        : variant === "header"
          ? "text-white/50 hover:text-white/80"
          : "text-gray-300 hover:text-gray-400"
        }`}
    >
      {checked ? (
        <CheckCircleIcon className="w-5 h-5" />
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </button>
  );

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "premium", label: "Premium", count: stats.premium },
    { key: "freebies", label: "Freebies", count: stats.freebies },
  ];

  // Get unique categories
  const categories = Array.from(new Set(assets.map(a => a.kategori_aset))).filter(Boolean);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const inputStyle =
    "bg-white shadow-sm focus:border-primary focus:ring-primary/10 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Tabs */}
          <div className="flex items-center gap-3">
            <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === tab.key
                    ? "shadow-sm text-gray-900 bg-white"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Add Button - Desktop */}
            <button
              onClick={handleAddAsset}
              className="hidden lg:flex bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg items-center gap-2 text-sm font-medium transition shadow-sm h-11"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Produk
            </button>
          </div>

          {/* Right: Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="flex flex-row gap-3">
              {/* Category Filter */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {categoryFilter === "all" ? "Semua Kategori" : categoryFilter}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        setCategoryFilter("all");
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg transition-colors ${categoryFilter === "all"
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
                          setCategoryFilter(cat);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg transition-colors ${categoryFilter === cat
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

              {/* Price Filter */}
              <div className="relative" ref={priceDropdownRef}>
                <button
                  onClick={() => setPriceDropdownOpen(!priceDropdownOpen)}
                  className="h-11 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {priceFilter === "all" ? "Semua Harga" :
                      priceFilter === "free" ? "Gratis" :
                        priceFilter === "under100k" ? "< 100k" :
                          priceFilter === "100k-500k" ? "100k - 500k" :
                            "> 500k"}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${priceDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {priceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { value: "all", label: "Semua Harga" },
                      { value: "free", label: "Gratis" },
                      { value: "under100k", label: "< Rp 100.000" },
                      { value: "100k-500k", label: "Rp 100k - 500k" },
                      { value: "above500k", label: "> Rp 500.000" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPriceFilter(option.value);
                          setPriceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${priceFilter === option.value
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
            </div>

            {/* Add Button - Mobile */}
            <button
              onClick={handleAddAsset}
              className="lg:hidden bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm h-11"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedIds.length} produk dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <ShoppingBagIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">
            Tidak ada produk
          </h3>
          <p className="text-gray-500 mt-1">
            Belum ada produk untuk filter ini.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary text-white font-medium">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">
                      <CustomCheckbox
                        checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                        onChange={toggleSelectAll}
                        variant="header"
                      />
                    </th>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((asset) => (
                    <tr
                      key={asset.id}
                      className={`hover:bg-gray-50 transition ${selectedIds.includes(asset.id) ? "bg-primary/5" : ""
                        }`}
                    >
                      <td className="px-6 py-4">
                        <CustomCheckbox
                          checked={selectedIds.includes(asset.id)}
                          onChange={() => toggleSelect(asset.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                            {asset.image_url ? (
                              <img src={asset.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-2.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {asset.nama_aset}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                              {asset.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${asset.jenis === "premium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                            }`}
                        >
                          {asset.jenis}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {asset.kategori_aset}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(asset.harga_aset)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(asset.created_at || new Date().toISOString())}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditAsset(asset)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {currentItems.map((asset) => (
              <div
                key={asset.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${selectedIds.includes(asset.id)
                  ? "border-primary bg-primary/5"
                  : "border-slate-100"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${asset.jenis === "premium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                        }`}
                    >
                      {asset.jenis}
                    </span>
                    <span className="text-xs text-gray-500">{asset.kategori_aset}</span>
                  </div>
                  <CustomCheckbox
                    checked={selectedIds.includes(asset.id)}
                    onChange={() => toggleSelect(asset.id)}
                  />
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                    {asset.image_url ? (
                      <img src={asset.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PhotoIcon className="h-6 w-6 m-auto text-gray-400 mt-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{asset.nama_aset}</p>
                    <p className="text-xs text-gray-500">{asset.slug}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Harga</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(asset.harga_aset)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditAsset(asset)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {filteredAssets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
          <nav aria-label="Page navigation" className="flex items-center space-x-4">
            <ul className="flex -space-x-px text-sm gap-2">
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Sebelumnya
                </button>
              </li>
              {getPageNumbers().map((page, idx) => (
                <li key={idx}>
                  {page === "..." ? (
                    <span className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium shadow-xs font-medium leading-5 text-sm w-9 h-9 rounded-lg">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                        ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                        : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                        }`}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ))}
              <li>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Selanjutnya
                </button>
              </li>
            </ul>
          </nav>

          {/* Items Per Page */}
          <div className="hidden sm:inline relative" ref={pageDropdownRef}>
            <button
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <span className="text-gray-700">{itemsPerPage} halaman</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {pageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setItemsPerPage(value);
                      setPageDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700"
                      }`}
                  >
                    {value} halaman
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAsset ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Image & Basic Info */}
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Produk
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'} cursor-pointer`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative aspect-video max-h-48 mx-auto rounded-lg overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
                          <button
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image_url: "" }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                            <PhotoIcon className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-gray-600">
                            Klik untuk upload
                          </p>
                          <p className="text-xs text-gray-400">Max 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Aset
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={formData.nama_aset}
                      onChange={(e) => setFormData({ ...formData, nama_aset: e.target.value })}
                      placeholder="Contoh: Undangan Website Elegant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      className={inputStyle}
                      value={formData.kategori_aset}
                      onChange={(e) => setFormData({ ...formData, kategori_aset: e.target.value })}
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Logo">Logo</option>
                      <option value="Template">Template</option>
                      <option value="Icon">Icon</option>
                      <option value="Illustration">Illustration</option>
                      <option value="Digital Asset">Digital Asset</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis
                      </label>
                      <select
                        className={inputStyle}
                        value={formData.jenis}
                        onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                      >
                        <option value="freebies">Freebies</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        className={`${inputStyle} bg-gray-50 text-gray-500`}
                        value={formData.slug}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harga (Rp)
                      </label>
                      <select
                        className={inputStyle}
                        value={formData.harga_aset}
                        onChange={(e) => setFormData({ ...formData, harga_aset: Number(e.target.value) })}
                      >
                        <option value="0">Gratis</option>
                        <option value="50000">Rp 50.000</option>
                        <option value="100000">Rp 100.000</option>
                        <option value="150000">Rp 150.000</option>
                        <option value="200000">Rp 200.000</option>
                        <option value="250000">Rp 250.000</option>
                        <option value="500000">Rp 500.000</option>
                        <option value="750000">Rp 750.000</option>
                        <option value="1000000">Rp 1.000.000</option>
                        <option value="2000000">Rp 2.000.000</option>
                        <option value="2500000">Rp 2.500.000</option>
                        <option value="5000000">Rp 5.000.000</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis Lisensi
                      </label>
                      <select
                        className={inputStyle}
                        value={formData.jenis_lisensi}
                        onChange={(e) => setFormData({ ...formData, jenis_lisensi: e.target.value })}
                      >
                        <option value="">Pilih Lisensi</option>
                        <option value="Penggunaan Komersial">Penggunaan Komersial</option>
                        <option value="Keperluan pribadi">Keperluan pribadi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Contoh: Template undangan elegan untuk pernikahan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      rows={6}
                      className={inputStyle}
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      placeholder="Deskripsi singkat produk..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={saving || uploadingImage}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
              >
                {saving || uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadingImage ? "Mengupload..." : "Menyimpan..."}
                  </>
                ) : (
                  "Simpan Produk"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
