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
    CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function WebsiteSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("website_settings")
                .select("*")
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching settings:", error);
            } else if (data) {
                setSettings(data);
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
            showAlert("success", "Berhasil", "Pengaturan berhasil diperbarui");
        } catch (error: any) {
            console.error("Error updating field:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui pengaturan");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: File, type: string) => {
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
            const fileName = `${type}-${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { publicUrl, error } = await uploadFile("assets", filePath, file);

            if (error) throw error;

            const fieldName = `${type}_url`;
            const { error: updateError } = await supabase
                .from("website_settings")
                .update({ [fieldName]: publicUrl })
                .eq("id", settings.id);

            if (updateError) throw updateError;

            setSettings({ ...settings, [fieldName]: publicUrl });
            showAlert("success", "Berhasil", `${type === "logo" ? "Logo" : "Favicon"} berhasil diupload`);
        } catch (error: any) {
            console.error("Error uploading file:", error);
            showAlert("error", "Gagal", error.message || "Gagal mengupload file");
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
        editable = true,
    }: {
        label: string;
        field: string;
        value: string;
        type?: string;
        editable?: boolean;
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
            {editable && editingField !== field && (
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
                {/* Informasi Website */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Website</h2>
                        <p className="text-sm text-gray-500 mt-1">Pengaturan dasar website Anda.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <DetailRow
                            label="Nama Website"
                            field="website_name"
                            value={settings?.website_name}
                        />
                        <DetailRow
                            label="Deskripsi Website"
                            field="website_description"
                            value={settings?.website_description}
                            type="textarea"
                        />
                        <DetailRow
                            label="Email Website"
                            field="website_email"
                            value={settings?.website_email}
                            type="email"
                        />
                        <DetailRow
                            label="Nomor Telepon"
                            field="website_phone"
                            value={settings?.website_phone}
                            type="tel"
                        />
                        <DetailRow
                            label="Author"
                            field="website_author"
                            value={settings?.website_author}
                        />
                        <DetailRow
                            label="Negara"
                            field="website_country"
                            value={settings?.website_country}
                        />
                        <DetailRow
                            label="Bahasa"
                            field="website_language"
                            value={settings?.website_language}
                        />
                    </div>
                </div>

                {/* Upload Logo & Favicon */}
                <div className="space-y-6">
                    {/* Logo */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Logo</h2>
                            <p className="text-sm text-gray-500 mt-1">Upload logo website Anda.</p>
                        </div>
                        <div className="p-6">
                            {settings?.logo_url && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={settings.logo_url}
                                        alt="Logo"
                                        className="h-20 object-contain"
                                    />
                                </div>
                            )}
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition">
                                <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Klik atau drag & drop untuk upload</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG (Max. 2MB)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file, "logo");
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Favicon */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Favicon</h2>
                            <p className="text-sm text-gray-500 mt-1">Upload favicon website Anda.</p>
                        </div>
                        <div className="p-6">
                            {settings?.favicon_url && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={settings.favicon_url}
                                        alt="Favicon"
                                        className="h-8 w-8 object-contain"
                                    />
                                </div>
                            )}
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition">
                                <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Klik atau drag & drop untuk upload</span>
                                <span className="text-xs text-gray-400 mt-1">ICO, PNG (Max. 2MB, 32x32px)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file, "favicon");
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
