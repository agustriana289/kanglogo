"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/supabase-storage";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    PlusCircleIcon,
    TrashIcon,
    CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function SEOPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [metaTags, setMetaTags] = useState<any[]>([]);
    const [verificationTags, setVerificationTags] = useState<any[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");
    const [showMetaModal, setShowMetaModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [editingMetaTag, setEditingMetaTag] = useState<string | null>(null);
    const [newMetaTag, setNewMetaTag] = useState({
        id: "",
        name: "",
        content: "",
        property: "",
        is_verification: false,
    });
    const [tempMetaTag, setTempMetaTag] = useState({
        name: "",
        content: "",
        property: "",
    });
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // Fetch SEO settings
            const { data: settingsData, error: settingsError } = await supabase
                .from("website_settings")
                .select("*")
                .single();

            if (settingsError && settingsError.code !== "PGRST116") {
                console.error("Error fetching settings:", settingsError);
            } else if (settingsData) {
                setSettings(settingsData);
            }

            // Fetch meta tags
            const { data: metaTagsData, error: metaTagsError } = await supabase
                .from("meta_tags")
                .select("*")
                .order("created_at", { ascending: false });

            if (metaTagsError) {
                console.error("Error fetching meta tags:", metaTagsError);
            } else {
                setMetaTags(metaTagsData?.filter((tag) => !tag.is_verification) || []);
                setVerificationTags(metaTagsData?.filter((tag) => tag.is_verification) || []);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditField = (field: string, currentValue: string) => {
        setEditingField(field);
        setTempValue(currentValue || "");
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setTempValue("");
    };

    const handleSaveField = async (field: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("website_settings")
                .update({ [field]: tempValue })
                .eq("id", settings.id);

            if (error) throw error;

            setSettings({ ...settings, [field]: tempValue });
            setEditingField(null);
            showAlert("success", "Berhasil", "Pengaturan SEO berhasil diperbarui");
        } catch (error: any) {
            console.error("Error updating field:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui pengaturan");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            showAlert("error", "Error", "Harap pilih file gambar");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showAlert("error", "Error", "Ukuran file maksimal 2MB");
            return;
        }

        setSaving(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `seo-og-${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { publicUrl, error } = await uploadFile("assets", filePath, file);

            if (error) throw error;

            const { error: updateError } = await supabase
                .from("website_settings")
                .update({ seo_og_image: publicUrl })
                .eq("id", settings.id);

            if (updateError) throw updateError;

            setSettings({ ...settings, seo_og_image: publicUrl });
            showAlert("success", "Berhasil", "OG Image berhasil diupload");
        } catch (error: any) {
            console.error("Error uploading file:", error);
            showAlert("error", "Gagal", error.message || "Gagal mengupload file");
        } finally {
            setSaving(false);
        }
    };

    const handleAddMetaTag = async () => {
        if (!newMetaTag.name || !newMetaTag.content) {
            showAlert("error", "Validasi", "Nama dan konten harus diisi");
            return;
        }

        setSaving(true);
        try {
            if (newMetaTag.id) {
                // Update existing meta tag
                const { error } = await supabase
                    .from("meta_tags")
                    .update({
                        name: newMetaTag.name,
                        content: newMetaTag.content,
                        property: newMetaTag.property,
                    })
                    .eq("id", newMetaTag.id);

                if (error) throw error;
                showAlert("success", "Berhasil", "Meta tag berhasil diperbarui");
            } else {
                // Insert new meta tag - remove id field
                const { id, ...tagData } = newMetaTag;
                const { error } = await supabase.from("meta_tags").insert(tagData);

                if (error) throw error;
                showAlert("success", "Berhasil", "Meta tag berhasil ditambahkan");
            }

            setNewMetaTag({ id: "", name: "", content: "", property: "", is_verification: false });
            setShowMetaModal(false);
            setShowVerificationModal(false);
            fetchSettings();
        } catch (error: any) {
            console.error("Error saving meta tag:", error);
            showAlert("error", "Gagal", error.message || "Gagal menyimpan meta tag");
        } finally {
            setSaving(false);
        }
    };

    const handleEditMetaTag = (tag: any) => {
        setEditingMetaTag(tag.id);
        setTempMetaTag({
            name: tag.name,
            content: tag.content,
            property: tag.property || "",
        });
    };

    const handleSaveMetaTag = async (tagId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("meta_tags")
                .update(tempMetaTag)
                .eq("id", tagId);

            if (error) throw error;

            setEditingMetaTag(null);
            fetchSettings();
            showAlert("success", "Berhasil", "Meta tag berhasil diperbarui");
        } catch (error: any) {
            console.error("Error updating meta tag:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui meta tag");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMetaTag = async (id: string) => {
        const confirmed = await showConfirm(
            "Hapus Meta Tag",
            "Apakah Anda yakin ingin menghapus meta tag ini?",
            "error",
            "Ya, Hapus"
        );
        if (!confirmed) return;

        setSaving(true);
        try {
            const { error } = await supabase.from("meta_tags").delete().eq("id", id);

            if (error) throw error;

            fetchSettings();
            showAlert("success", "Berhasil", "Meta tag berhasil dihapus");
        } catch (error: any) {
            console.error("Error deleting meta tag:", error);
            showAlert("error", "Gagal", error.message || "Gagal menghapus meta tag");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
                <LogoPathAnimation />
            </div>
        );
    }

    const DetailRow = ({
        label,
        field,
        value,
        type = "text",
    }: {
        label: string;
        field: string;
        value: string;
        type?: string;
    }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {editingField === field ? (
                    <div className="mt-2 flex items-center gap-2">
                        {type === "textarea" ? (
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                rows={3}
                                autoFocus
                            />
                        ) : (
                            <input
                                type={type}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                autoFocus
                            />
                        )}
                        <button
                            onClick={() => handleSaveField(field)}
                            disabled={saving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Simpan"
                        >
                            <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Batal"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-900 mt-1">{value || "-"}</p>
                )}
            </div>
            {editingField !== field && (
                <button
                    onClick={() => handleEditField(field, value)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition ml-2"
                    title={`Edit ${label}`}
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Meta Tags */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Meta Tags</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Meta tags kustom untuk SEO.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setNewMetaTag({ id: "", name: "", content: "", property: "", is_verification: false });
                                setShowMetaModal(true);
                            }}
                            className="text-sm font-medium text-primary"
                        >
                            <PlusCircleIcon className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="p-6">
                        {metaTags.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                Belum ada meta tag. Klik &quot;Tambah&quot; untuk menambahkan.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {metaTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        {editingMetaTag === tag.id ? (
                                            <div className="flex-1 flex items-start gap-2">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={tempMetaTag.name}
                                                        onChange={(e) =>
                                                            setTempMetaTag({ ...tempMetaTag, name: e.target.value })
                                                        }
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Nama"
                                                    />
                                                    <textarea
                                                        value={tempMetaTag.content}
                                                        onChange={(e) =>
                                                            setTempMetaTag({ ...tempMetaTag, content: e.target.value })
                                                        }
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                        rows={2}
                                                        placeholder="Konten"
                                                    />
                                                    {tempMetaTag.property !== undefined && (
                                                        <input
                                                            type="text"
                                                            value={tempMetaTag.property}
                                                            onChange={(e) =>
                                                                setTempMetaTag({ ...tempMetaTag, property: e.target.value })
                                                            }
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                            placeholder="Property (opsional)"
                                                        />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleSaveMetaTag(tag.id)}
                                                    disabled={saving}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                    title="Simpan"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingMetaTag(null)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Batal"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{tag.content}</p>
                                                    {tag.property && (
                                                        <p className="text-xs text-blue-600 mt-1">Property: {tag.property}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEditMetaTag(tag)}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMetaTag(tag.id)}
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

                <div className="space-y-6">
                    {/* OG Image */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">OG Image</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Gambar yang ditampilkan saat website dibagikan.
                            </p>
                        </div>
                        <div className="p-6">
                            {settings?.seo_og_image && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={settings.seo_og_image}
                                        alt="OG Image"
                                        className="max-h-40 rounded-lg border border-gray-200"
                                    />
                                </div>
                            )}
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition">
                                <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Klik atau drag & drop untuk upload</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max. 2MB, 1200x630px)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Verification Tags */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Tag Verifikasi</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Verifikasi Google, Bing, dll.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setNewMetaTag({ id: "", name: "", content: "", property: "", is_verification: true });
                                    setShowVerificationModal(true);
                                }}
                                className="text-sm font-medium text-primary"
                            >
                                <PlusCircleIcon className="w-7 h-7" />
                            </button>
                        </div>
                        <div className="p-6">
                            {verificationTags.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    Belum ada tag verifikasi. Klik &quot;Tambah&quot; untuk menambahkan.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {verificationTags.map((tag) => (
                                        <div
                                            key={tag.id}
                                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            {editingMetaTag === tag.id ? (
                                                <div className="flex-1 flex items-start gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={tempMetaTag.name}
                                                            onChange={(e) =>
                                                                setTempMetaTag({ ...tempMetaTag, name: e.target.value })
                                                            }
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                                            placeholder="Nama"
                                                        />
                                                        <textarea
                                                            value={tempMetaTag.content}
                                                            onChange={(e) =>
                                                                setTempMetaTag({ ...tempMetaTag, content: e.target.value })
                                                            }
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary font-mono text-xs"
                                                            rows={2}
                                                            placeholder="Kode verifikasi"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveMetaTag(tag.id)}
                                                        disabled={saving}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Simpan"
                                                    >
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingMetaTag(null)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Batal"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1 truncate font-mono">
                                                            {tag.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEditMetaTag(tag)}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMetaTag(tag.id)}
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
            </div>


            {/* Modal Tambah Meta Tag */}
            {showMetaModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Tambah Meta Tag</h2>
                            <button
                                onClick={() => setShowMetaModal(false)}
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
                                    value={newMetaTag.name}
                                    onChange={(e) => setNewMetaTag({ ...newMetaTag, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Konten
                                </label>
                                <textarea
                                    value={newMetaTag.content}
                                    onChange={(e) => setNewMetaTag({ ...newMetaTag, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    rows={3}
                                    placeholder="Konten meta tag"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={newMetaTag.property}
                                    onChange={(e) => setNewMetaTag({ ...newMetaTag, property: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="og:title"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowMetaModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddMetaTag}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                            >
                                {saving ? "Menyimpan..." : "Tambah"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Verification Tag */}
            {showVerificationModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Tambah Tag Verifikasi</h2>
                            <button
                                onClick={() => setShowVerificationModal(false)}
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
                                    value={newMetaTag.name}
                                    onChange={(e) =>
                                        setNewMetaTag({ ...newMetaTag, name: e.target.value, is_verification: true })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="google-site-verification"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kode Verifikasi
                                </label>
                                <input
                                    type="text"
                                    value={newMetaTag.content}
                                    onChange={(e) =>
                                        setNewMetaTag({ ...newMetaTag, content: e.target.value, is_verification: true })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Kode verifikasi"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowVerificationModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddMetaTag}
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
