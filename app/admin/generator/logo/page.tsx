"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { LogoAsset } from "@/types/logo-generator";
import LogoLoading from "@/components/LogoLoading";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    PhotoIcon,
    CubeIcon,
} from "@heroicons/react/24/outline";

// Items per page
const ITEMS_PER_PAGE = 12;

export default function LogoGeneratorAdminPage() {
    const [assets, setAssets] = useState<LogoAsset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<LogoAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { showAlert, showConfirm } = useAlert();

    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState<LogoAsset | null>(null);

    const [formData, setFormData] = useState({
        nama_aset: "",
        slug: "",
        kategori_aset: "",
        jenis_lisensi: "",
        svg_content: "",
    });

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
                    asset.kategori_aset?.toLowerCase().includes(searchQuery.toLowerCase())
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
                .from("logo_assets")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAssets(data || []);
            setFilteredAssets(data || []);
            setTotalItems(data?.length || 0);
        } catch (error) {
            console.error("Error fetching assets:", error);
            showAlert("error", "Error", "Gagal memuat aset logo!");
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
            jenis_lisensi: "",
            svg_content: "",
        });
        setShowModal(true);
    };

    const handleEditAsset = (asset: LogoAsset) => {
        setEditingAsset(asset);
        setFormData({
            nama_aset: asset.nama_aset,
            slug: asset.slug,
            kategori_aset: asset.kategori_aset,
            jenis_lisensi: asset.jenis_lisensi,
            svg_content: asset.svg_content,
        });
        setShowModal(true);
    };

    const handleDeleteAsset = async (id: number) => {
        const confirmed = await showConfirm(
            "Hapus Aset",
            "Apakah Anda yakin ingin menghapus aset logo ini?",
            "error",
            "Ya, Hapus"
        );
        if (!confirmed) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("logo_assets")
                .delete()
                .eq("id", id);
            if (error) throw error;

            const updatedAssets = assets.filter((a) => a.id !== id);
            setAssets(updatedAssets);
            setFilteredAssets(
                searchQuery ? updatedAssets.filter(a => a.nama_aset.toLowerCase().includes(searchQuery.toLowerCase())) : updatedAssets
            );
            setTotalItems(updatedAssets.length);
            showAlert("success", "Berhasil", "Aset logo berhasil dihapus!");
        } catch (error) {
            console.error("Error deleting asset:", error);
            showAlert("error", "Gagal", "Gagal menghapus aset logo!");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAsset = async () => {
        if (!formData.nama_aset.trim()) {
            showAlert("warning", "Validasi", "Nama Aset tidak boleh kosong!");
            return;
        }
        if (!formData.svg_content.trim()) {
            showAlert("warning", "Validasi", "Kode SVG tidak boleh kosong!");
            return;
        }

        setSaving(true);
        try {
            const updatedFormData = { ...formData };

            if (editingAsset) {
                const { error } = await supabase
                    .from("logo_assets")
                    .update(updatedFormData)
                    .eq("id", editingAsset.id);
                if (error) throw error;

                fetchAssets();
                showAlert("success", "Berhasil", "Aset logo berhasil diperbarui!");
            } else {
                const { error } = await supabase
                    .from("logo_assets")
                    .insert(updatedFormData);
                if (error) throw error;

                fetchAssets();
                showAlert("success", "Berhasil", "Aset logo berhasil ditambahkan!");
            }

            setShowModal(false);
        } catch (error: any) {
            console.error("Error saving asset:", error);
            showAlert("error", "Gagal", error.message || "Gagal menyimpan aset logo!");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
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
                            Generator Logo
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {totalItems} aset logo tersedia
                        </p>
                    </div>
                    <button
                        onClick={handleAddAsset}
                        className="bg-primary hover:bg-primary/80 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Tambah Aset
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari aset logo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {currentItems.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <CubeIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak ada aset</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Belum ada aset logo yang ditambahkan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentItems.map((asset) => (
                        <div key={asset.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition overflow-hidden flex flex-col">
                            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center p-8">
                                {/* SVG Preview */}
                                <div
                                    className="w-full h-full text-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                                    dangerouslySetInnerHTML={{ __html: asset.svg_content }}
                                />

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
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{asset.nama_aset}</h3>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{asset.kategori_aset}</p>

                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 line-clamp-1 max-w-[120px]" title={asset.jenis_lisensi}>{asset.jenis_lisensi || 'No License'}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {formatDate(asset.created_at || new Date().toISOString())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-0 py-4 mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} aset
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl my-8">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingAsset ? "Edit Aset Logo" : "Tambah Aset Logo"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nama Aset
                                    </label>
                                    <input
                                        type="text"
                                        className={inputStyle}
                                        value={formData.nama_aset}
                                        onChange={(e) => setFormData({ ...formData, nama_aset: e.target.value })}
                                        placeholder="Contoh: Shield Icon"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        className={inputStyle}
                                        value={formData.kategori_aset}
                                        onChange={(e) => setFormData({ ...formData, kategori_aset: e.target.value })}
                                        placeholder="Contoh: Abstract"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Jenis Lisensi
                                    </label>
                                    <input
                                        type="text"
                                        className={inputStyle}
                                        value={formData.jenis_lisensi}
                                        onChange={(e) => setFormData({ ...formData, jenis_lisensi: e.target.value })}
                                        placeholder="Contoh: MIT, Creative Commons"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Slug (Auto-generated)
                                    </label>
                                    <input
                                        type="text"
                                        className={`${inputStyle} bg-gray-50 dark:bg-slate-800 text-gray-500`}
                                        value={formData.slug}
                                        readOnly
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Kode SVG
                                    </label>
                                    <textarea
                                        rows={8}
                                        className={`${inputStyle} font-mono text-xs`}
                                        value={formData.svg_content}
                                        onChange={(e) => setFormData({ ...formData, svg_content: e.target.value })}
                                        placeholder='<svg ...>...</svg>'
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Paste kode properti SVG lengkap disini.</p>
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
                                disabled={saving}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-sm"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Aset"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
