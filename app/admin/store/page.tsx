// app/admin/store/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { MarketplaceAsset } from "@/types/marketplace";
import LogoLoading from "@/components/LogoLoading";
import { uploadImageToImgBBStore } from "@/lib/imgbb-store";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ShoppingBagIcon,
  StarIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Items per page
const ITEMS_PER_PAGE = 20;

export default function MarketplaceManagementPage() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MarketplaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MarketplaceAsset | null>(
    null
  );

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

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    // Filter assets based on search query
    if (searchQuery.trim() === "") {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(
        (asset) =>
          asset.nama_aset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.kategori_aset
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          asset.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (asset.tagline &&
            asset.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (asset.deskripsi &&
            asset.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAssets(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, assets]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      setFilteredAssets(data || []);
      setTotalItems(data?.length || 0);
    } catch (error) {
      console.error("Error fetching assets:", error);
      showToast("Gagal memuat aset marketplace!", "error");
    } finally {
      setLoading(false);
    }
  };

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
    if (!confirm("Apakah Anda yakin ingin menghapus aset ini?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("marketplace_assets")
        .delete()
        .eq("id", id);
      if (error) throw error;

      const updatedAssets = assets.filter((a) => a.id !== id);
      setAssets(updatedAssets);
      setTotalItems(updatedAssets.length);

      // Update filtered assets if needed
      if (searchQuery.trim() === "") {
        setFilteredAssets(updatedAssets);
      } else {
        // Reapply filters
        const filtered = updatedAssets.filter(
          (asset) =>
            asset.nama_aset.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.kategori_aset
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            asset.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.tagline &&
              asset.tagline
                .toLowerCase()
                .includes(searchQuery.toLowerCase())) ||
            (asset.deskripsi &&
              asset.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredAssets(filtered);
      }

      showToast("Aset berhasil dihapus!", "success");
    } catch (error) {
      console.error("Error deleting asset:", error);
      showToast("Gagal menghapus aset!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageChange({ target: { files } } as any);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Silakan pilih file gambar!", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Ukuran file terlalu besar! Maksimal 5MB", "error");
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
    if (!formData.nama_aset.trim() || !formData.slug.trim()) {
      showToast("Nama Aset dan Slug tidak boleh kosong!", "error");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;

      if (fileInputRef.current?.files?.[0]) {
        setUploadingImage(true);
        imageUrl = await uploadImageToImgBBStore(fileInputRef.current.files[0]);
        setUploadingImage(false);
      }

      const updatedFormData = { ...formData, image_url: imageUrl };

      if (editingAsset) {
        const { error } = await supabase
          .from("marketplace_assets")
          .update(updatedFormData)
          .eq("id", editingAsset.id);
        if (error) throw error;

        const updatedAssets = assets.map((a) =>
          a.id === editingAsset.id ? { ...a, ...updatedFormData } : a
        );
        setAssets(updatedAssets);

        // Update filtered assets if needed
        if (searchQuery.trim() === "") {
          setFilteredAssets(updatedAssets);
        } else {
          // Reapply filters
          const filtered = updatedAssets.filter(
            (asset) =>
              asset.nama_aset
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              asset.kategori_aset
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              asset.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (asset.tagline &&
                asset.tagline
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())) ||
              (asset.deskripsi &&
                asset.deskripsi
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          );
          setFilteredAssets(filtered);
        }

        showToast("Aset berhasil diperbarui!", "success");
      } else {
        const { data, error } = await supabase
          .from("marketplace_assets")
          .insert([updatedFormData])
          .select();
        if (error) throw error;

        const newAssets = [...(data || []), ...assets];
        setAssets(newAssets);

        // Update filtered assets if needed
        if (searchQuery.trim() === "") {
          setFilteredAssets(newAssets);
        } else {
          // Reapply filters
          const filtered = newAssets.filter(
            (asset) =>
              asset.nama_aset
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              asset.kategori_aset
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              asset.jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (asset.tagline &&
                asset.tagline
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())) ||
              (asset.deskripsi &&
                asset.deskripsi
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          );
          setFilteredAssets(filtered);
        }

        setTotalItems(newAssets.length);
        showToast("Aset berhasil ditambahkan!", "success");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving asset:", error);
      showToast(
        `Gagal menyimpan aset: ${
          error instanceof Error ? error.message : "Terjadi kesalahan"
        }`,
        "error"
      );
      setUploadingImage(false);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LogoLoading size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sedang memuat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        {/* Header Section - Diperbaiki dengan Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Kelola Marketplace
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleAddAsset}
                className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Tambah Aset
              </button>

              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Cari aset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredAssets.length)} dari{" "}
          {filteredAssets.length} aset
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Nama Aset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Lisensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {currentItems.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {asset.nama_aset}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <TagIcon className="h-4 w-4 mr-1" />
                      {asset.kategori_aset}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        asset.jenis === "premium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {asset.jenis === "premium" ? (
                        <StarIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <GiftIcon className="h-4 w-4 mr-1" />
                      )}
                      {asset.jenis === "premium" ? "Premium" : "Freebies"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-slate-400 mr-1" />
                      {asset.jenis === "premium"
                        ? formatCurrency(asset.harga_aset)
                        : "Gratis"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 text-slate-400 mr-1" />
                      {asset.jenis_lisensi}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAsset(asset)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentItems.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <ShoppingBagIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {asset.nama_aset}
                    </h3>
                    <div className="flex items-center mt-1">
                      <TagIcon className="h-4 w-4 text-slate-400 mr-1" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {asset.kategori_aset}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    asset.jenis === "premium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
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
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-slate-400 mr-1" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {asset.jenis === "premium"
                      ? formatCurrency(asset.harga_aset)
                      : "Gratis"}
                  </span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 text-slate-400 mr-1" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {asset.jenis_lisensi}
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditAsset(asset)}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery
                ? "Tidak ada aset yang ditemukan"
                : "Tidak ada aset marketplace"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : "Belum ada aset yang ditambahkan ke marketplace."}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={handleAddAsset}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Tambah Aset Baru
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-slate-500 dark:text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === page
                        ? "bg-primary text-white border-primary"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Asset */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingAsset ? "Edit Aset" : "Tambah Aset Baru"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image Upload & Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nama Aset
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.nama_aset}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_aset: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Slug (URL-friendly)
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Gambar Aset
                    </label>
                    <div
                      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="flex flex-col items-center justify-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-48 w-auto object-contain mb-4"
                          />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Klik atau seret untuk mengganti gambar
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <PhotoIcon className="h-12 w-12 text-slate-400 mb-4" />
                          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">
                              Klik untuk mengunggah
                            </span>{" "}
                            atau seret dan lepas
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            WEBP, PNG, JPG, atau GIF (MAKS. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Kategori Aset
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.kategori_aset}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kategori_aset: e.target.value,
                        })
                      }
                      placeholder="Contoh: Logo, Icon, Illustration"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jenis Aset
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="mr-2"
                          value="premium"
                          checked={formData.jenis === "premium"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jenis: e.target.value as "premium" | "freebies",
                            })
                          }
                        />
                        <span className="flex items-center">
                          <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                          Premium
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="mr-2"
                          value="freebies"
                          checked={formData.jenis === "freebies"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jenis: e.target.value as "premium" | "freebies",
                            })
                          }
                        />
                        <span className="flex items-center">
                          <GiftIcon className="h-4 w-4 mr-1 text-green-500" />
                          Freebies
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.jenis === "premium" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Harga Aset (IDR)
                      </label>
                      <input
                        type="number"
                        className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                        value={formData.harga_aset}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            harga_aset: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Right Column - Asset Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jenis Lisensi
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.jenis_lisensi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jenis_lisensi: e.target.value,
                        })
                      }
                      placeholder="Contoh: Commercial Use, Personal Use"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tagline
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.tagline}
                      onChange={(e) =>
                        setFormData({ ...formData, tagline: e.target.value })
                      }
                      placeholder="Tagline singkat untuk aset ini"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Deskripsi
                    </label>
                    <textarea
                      rows={6}
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={formData.deskripsi}
                      onChange={(e) =>
                        setFormData({ ...formData, deskripsi: e.target.value })
                      }
                      placeholder="Deskripsi lengkap tentang aset ini"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAsset}
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {uploadingImage
                    ? "Mengunggah Gambar..."
                    : saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
