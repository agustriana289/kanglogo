"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { MarketplaceAsset } from "@/types/marketplace";
import LogoLoading from "@/components/LogoLoading";
import { uploadFile } from "@/lib/supabase-storage";
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
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Items per page
const ITEMS_PER_PAGE = 12;

export default function MarketplaceManagementPage() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MarketplaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

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
          asset.kategori_aset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.jenis.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAssets(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, assets]);

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

  const fetchAssets = async () => {
    setLoading(true);
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
      showAlert("error", "Error", "Gagal memuat aset marketplace!");
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
    const confirmed = await showConfirm(
      "Hapus Aset",
      "Apakah Anda yakin ingin menghapus aset ini?",
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

      const updatedAssets = assets.filter((a) => a.id !== id);
      setAssets(updatedAssets);
      setFilteredAssets(
        searchQuery ? updatedAssets.filter(a => a.nama_aset.toLowerCase().includes(searchQuery.toLowerCase())) : updatedAssets
      );
      setTotalItems(updatedAssets.length);
      showAlert("success", "Berhasil", "Aset berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting asset:", error);
      showAlert("error", "Gagal", "Gagal menghapus aset!");
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
        showAlert("success", "Berhasil", "Aset berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("marketplace_assets")
          .insert(updatedFormData);
        if (error) throw error;

        fetchAssets();
        showAlert("success", "Berhasil", "Aset berhasil ditambahkan!");
      }

      setShowModal(false);
    } catch (error: any) {
      console.error("Error saving asset:", error);
      showAlert("error", "Gagal", error.message || "Gagal menyimpan aset!");
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

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;

    const confirmed = await showConfirm(
      "Hapus Produk",
      `Apakah Anda yakin ingin menghapus ${selectedAssets.length} produk terpilih?`,
      "error",
      "Ya, Hapus"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("marketplace_assets")
        .delete()
        .in("id", selectedAssets);

      if (error) throw error;

      showAlert("success", "Berhasil", `${selectedAssets.length} produk berhasil dihapus!`);
      setSelectedAssets([]);
      fetchAssets();
    } catch (error) {
      console.error("Error bulk deleting assets:", error);
      showAlert("error", "Gagal", "Gagal menghapus produk!");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LogoLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header Section */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Daftar Produk
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalItems} produk ditemukan
            </p>
          </div>
          <button
            onClick={handleAddAsset}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah Produk
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="mt-6 flex flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-auto">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAssets.length > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 px-5 py-3 flex items-center justify-between rounded-xl border border-blue-100 dark:border-blue-800 transition-all">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedAssets.length} produk dipilih
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAssets([])}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Batal Pilih
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={saving}
              className="text-sm text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <ShoppingBagIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak ada produk</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Belum ada produk yang ditambahkan.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((asset) => (
            <div key={asset.id} className={`group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border transition overflow-hidden flex flex-col ${selectedAssets.includes(asset.id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700">
                {asset.image_url ? (
                  <img src={asset.image_url} alt={asset.nama_aset} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <PhotoIcon className="w-12 h-12" />
                  </div>
                )}

                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 cursor-pointer"
                    checked={selectedAssets.includes(asset.id)}
                    onChange={() => {
                      if (selectedAssets.includes(asset.id)) {
                        setSelectedAssets(selectedAssets.filter((id) => id !== asset.id));
                      } else {
                        setSelectedAssets([...selectedAssets, asset.id]);
                      }
                    }}
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-200">
                  <button
                    onClick={() => handleEditAsset(asset)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-300"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                  {formatCurrency(asset.harga_aset)}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{asset.nama_aset}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{asset.kategori_aset} - {asset.jenis}</p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${asset.jenis === 'premium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {asset.jenis}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(asset.created_at || new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
                        checked={selectedAssets.length === currentItems.length && currentItems.length > 0}
                        onChange={() => {
                          if (selectedAssets.length === currentItems.length) {
                            setSelectedAssets([]);
                          } else {
                            setSelectedAssets(currentItems.map((a) => a.id));
                          }
                        }}
                      />
                      <span>Produk</span>
                    </div>
                  </th>
                  <th className="px-6 py-4">Jenis</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((asset) => (
                  <tr key={asset.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${selectedAssets.includes(asset.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => {
                            if (selectedAssets.includes(asset.id)) {
                              setSelectedAssets(selectedAssets.filter((id) => id !== asset.id));
                            } else {
                              setSelectedAssets([...selectedAssets, asset.id]);
                            }
                          }}
                        />
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600">
                          {asset.image_url ? (
                            <img src={asset.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PhotoIcon className="h-5 w-5 m-auto text-gray-400 mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white underline-offset-4 hover:underline cursor-pointer" onClick={() => handleEditAsset(asset)}>
                            {asset.nama_aset}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {asset.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${asset.jenis === 'premium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        {asset.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {asset.kategori_aset}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(asset.harga_aset)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(asset.created_at || new Date().toISOString())}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditAsset(asset)}
                          className="text-gray-400 hover:text-blue-500 transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-gray-400 hover:text-red-500 transition"
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
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-0 py-4 mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} produk
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAsset ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gambar Produk
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary'} cursor-pointer`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative aspect-video max-h-48 mx-auto rounded-lg overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-gray-50 dark:bg-slate-900" />
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
                          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-gray-400">
                            <PhotoIcon className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        className={`${inputStyle} bg-gray-50 dark:bg-slate-800 text-gray-500`}
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-gray-600 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={saving || uploadingImage}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
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
