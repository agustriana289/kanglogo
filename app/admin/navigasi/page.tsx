"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    PlusCircleIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function NavigasiPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [linkCategories, setLinkCategories] = useState<any[]>([]);
    const [links, setLinks] = useState<any[]>([]);
    const [socialMedia, setSocialMedia] = useState<any[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [editingLink, setEditingLink] = useState<string | null>(null);
    const [editingSocial, setEditingSocial] = useState<string | null>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [newLink, setNewLink] = useState({
        label: "",
        url: "",
        category_id: "",
    });
    const [newSocial, setNewSocial] = useState({
        name: "",
        url: "",
        icon_svg: "",
    });
    const [tempLinkData, setTempLinkData] = useState({ label: "", url: "" });
    const [tempSocialData, setTempSocialData] = useState({ name: "", url: "", icon_svg: "" });
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from("link_categories")
                .select("*")
                .order("order_index", { ascending: true });

            if (categoriesError) throw categoriesError;
            setLinkCategories(categoriesData || []);

            // Fetch links
            const { data: linksData, error: linksError } = await supabase
                .from("links")
                .select("*")
                .order("order_index", { ascending: true });

            if (linksError) throw linksError;
            setLinks(linksData || []);

            // Fetch social media
            const { data: socialData, error: socialError } = await supabase
                .from("social_media")
                .select("*")
                .order("order_index", { ascending: true });

            if (socialError) throw socialError;
            setSocialMedia(socialData || []);
        } catch (error: any) {
            console.error("Error fetching data:", error);
            showAlert("error", "Error", error.message || "Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddLink = async () => {
        if (!newLink.label || !newLink.url || !newLink.category_id) {
            showAlert("error", "Validasi", "Semua field harus diisi");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from("links").insert(newLink);

            if (error) throw error;

            setNewLink({ label: "", url: "", category_id: "" });
            setShowLinkModal(false);
            fetchData();
            showAlert("success", "Berhasil", "Link berhasil ditambahkan");
        } catch (error: any) {
            console.error("Error adding link:", error);
            showAlert("error", "Gagal", error.message || "Gagal menambahkan link");
        } finally {
            setSaving(false);
        }
    };

    const handleEditLink = (linkId: string, label: string, url: string) => {
        setEditingLink(linkId);
        setTempLinkData({ label, url });
    };

    const handleSaveLink = async (linkId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("links")
                .update(tempLinkData)
                .eq("id", linkId);

            if (error) throw error;

            setEditingLink(null);
            fetchData();
            showAlert("success", "Berhasil", "Link berhasil diperbarui");
        } catch (error: any) {
            console.error("Error updating link:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui link");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = async (id: string) => {
        const confirmed = await showConfirm(
            "Hapus Link",
            "Apakah Anda yakin ingin menghapus link ini?",
            "error",
            "Ya, Hapus"
        );
        if (!confirmed) return;

        setSaving(true);
        try {
            const { error } = await supabase.from("links").delete().eq("id", id);

            if (error) throw error;

            fetchData();
            showAlert("success", "Berhasil", "Link berhasil dihapus");
        } catch (error: any) {
            console.error("Error deleting link:", error);
            showAlert("error", "Gagal", error.message || "Gagal menghapus link");
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocial = async () => {
        if (!newSocial.name || !newSocial.url || !newSocial.icon_svg) {
            showAlert("error", "Validasi", "Semua field harus diisi");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from("social_media").insert(newSocial);

            if (error) throw error;

            setNewSocial({ name: "", url: "", icon_svg: "" });
            setShowSocialModal(false);
            fetchData();
            showAlert("success", "Berhasil", "Social media berhasil ditambahkan");
        } catch (error: any) {
            console.error("Error adding social media:", error);
            showAlert("error", "Gagal", error.message || "Gagal menambahkan social media");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSocial = (socialId: string, name: string, url: string, icon_svg: string) => {
        setEditingSocial(socialId);
        setTempSocialData({ name, url, icon_svg });
    };

    const handleSaveSocial = async (socialId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("social_media")
                .update(tempSocialData)
                .eq("id", socialId);

            if (error) throw error;

            setEditingSocial(null);
            fetchData();
            showAlert("success", "Berhasil", "Social media berhasil diperbarui");
        } catch (error: any) {
            console.error("Error updating social media:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui social media");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSocial = async (id: string) => {
        const confirmed = await showConfirm(
            "Hapus Social Media",
            "Apakah Anda yakin ingin menghapus social media ini?",
            "error",
            "Ya, Hapus"
        );
        if (!confirmed) return;

        setSaving(true);
        try {
            const { error } = await supabase.from("social_media").delete().eq("id", id);

            if (error) throw error;

            fetchData();
            showAlert("success", "Berhasil", "Social media berhasil dihapus");
        } catch (error: any) {
            console.error("Error deleting social media:", error);
            showAlert("error", "Gagal", error.message || "Gagal menghapus social media");
        } finally {
            setSaving(false);
        }
    };

    const getLinksByCategory = (categoryId: string) => {
        return links.filter((link) => link.category_id === categoryId);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Links by Category */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Tautan Navigasi</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola tautan header dan footer website.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="text-sm font-medium text-primary"
                        >
                            <PlusCircleIcon className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="p-6">
                        {linkCategories.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                Belum ada kategori link.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {linkCategories.map((category) => {
                                    const categoryLinks = getLinksByCategory(category.id);
                                    const isExpanded = expandedCategory === category.id;

                                    return (
                                        <div
                                            key={category.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() =>
                                                    setExpandedCategory(isExpanded ? null : category.id)
                                                }
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                                                    )}
                                                    <span className="font-medium text-gray-900">
                                                        {category.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        ({categoryLinks.length})
                                                    </span>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="p-4 space-y-2 bg-white">
                                                    {categoryLinks.length === 0 ? (
                                                        <p className="text-sm text-gray-500 text-center py-4">
                                                            Belum ada link di kategori ini.
                                                        </p>
                                                    ) : (
                                                        categoryLinks.map((link) => (
                                                            <div
                                                                key={link.id}
                                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                            >
                                                                {editingLink === link.id ? (
                                                                    <div className="flex-1 flex items-center gap-2">
                                                                        <div className="flex-1 space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                value={tempLinkData.label}
                                                                                onChange={(e) =>
                                                                                    setTempLinkData({
                                                                                        ...tempLinkData,
                                                                                        label: e.target.value,
                                                                                    })
                                                                                }
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                                                placeholder="Label"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                value={tempLinkData.url}
                                                                                onChange={(e) =>
                                                                                    setTempLinkData({
                                                                                        ...tempLinkData,
                                                                                        url: e.target.value,
                                                                                    })
                                                                                }
                                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                                                placeholder="URL"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleSaveLink(link.id)}
                                                                            disabled={saving}
                                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                            title="Simpan"
                                                                        >
                                                                            <CheckIcon className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingLink(null)}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                            title="Batal"
                                                                        >
                                                                            <XMarkIcon className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {link.label}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 truncate">
                                                                                {link.url}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleEditLink(link.id, link.label, link.url)
                                                                                }
                                                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                                                title="Edit"
                                                                            >
                                                                                <PencilIcon className="w-5 h-5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteLink(link.id)}
                                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                                title="Hapus"
                                                                            >
                                                                                <TrashIcon className="w-5 h-5" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola tautan social media Anda.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSocialModal(true)}
                            className="text-sm font-medium text-primary"
                        >
                            <PlusCircleIcon className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="p-6">
                        {socialMedia.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                Belum ada social media. Klik &quot;Tambah&quot; untuk menambahkan.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {socialMedia.map((social) => (
                                    <div
                                        key={social.id}
                                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        {editingSocial === social.id ? (
                                            <div className="flex-1 flex items-start gap-2">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={tempSocialData.name}
                                                        onChange={(e) =>
                                                            setTempSocialData({
                                                                ...tempSocialData,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Nama"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={tempSocialData.url}
                                                        onChange={(e) =>
                                                            setTempSocialData({
                                                                ...tempSocialData,
                                                                url: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="URL"
                                                    />
                                                    <textarea
                                                        value={tempSocialData.icon_svg}
                                                        onChange={(e) =>
                                                            setTempSocialData({
                                                                ...tempSocialData,
                                                                icon_svg: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                                                        rows={2}
                                                        placeholder="SVG Icon Code"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleSaveSocial(social.id)}
                                                    disabled={saving}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Simpan"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingSocial(null)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Batal"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {social.icon_svg && (
                                                        <div
                                                            className="w-6 h-6 flex-shrink-0"
                                                            dangerouslySetInnerHTML={{ __html: social.icon_svg }}
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {social.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{social.url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            handleEditSocial(
                                                                social.id,
                                                                social.name,
                                                                social.url,
                                                                social.icon_svg
                                                            )
                                                        }
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSocial(social.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Link */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Tambah Link</h2>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kategori
                                </label>
                                <select
                                    value={newLink.category_id}
                                    onChange={(e) =>
                                        setNewLink({ ...newLink, category_id: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="">Pilih kategori</option>
                                    {linkCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={newLink.label}
                                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Beranda"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL
                                </label>
                                <input
                                    type="text"
                                    value={newLink.url}
                                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="/"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddLink}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                            >
                                {saving ? "Menyimpan..." : "Tambah"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Social Media */}
            {showSocialModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Tambah Social Media</h2>
                            <button
                                onClick={() => setShowSocialModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama
                                </label>
                                <input
                                    type="text"
                                    value={newSocial.name}
                                    onChange={(e) => setNewSocial({ ...newSocial, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Facebook"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL
                                </label>
                                <input
                                    type="text"
                                    value={newSocial.url}
                                    onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Icon SVG
                                </label>
                                <textarea
                                    value={newSocial.icon_svg}
                                    onChange={(e) =>
                                        setNewSocial({ ...newSocial, icon_svg: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-xs"
                                    rows={4}
                                    placeholder="<svg>...</svg>"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSocialModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddSocial}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                            >
                                {saving ? "Menyimpan..." : "Tambah"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
