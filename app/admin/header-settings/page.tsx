"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    CodeBracketIcon,
    DocumentTextIcon,
    MegaphoneIcon,
} from "@heroicons/react/24/outline";

export default function HeaderSettingsPage() {
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
                await syncRobotsTxt(data.id);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const syncRobotsTxt = async (settingsId: string) => {
        try {
            const response = await fetch('/api/robots/current');
            const result = await response.json();

            if (result.content) {
                const { error } = await supabase
                    .from('website_settings')
                    .update({ robots_txt: result.content })
                    .eq('id', settingsId);

                if (!error) {
                    setSettings((prev: any) => ({ ...prev, robots_txt: result.content }));
                }
            }
        } catch (error) {
            console.error('Error syncing robots.txt:', error);
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

    const renderEditableField = (
        field: string,
        label: string,
        description: string,
        icon: React.ReactNode,
        isTextarea = false,
        rows = 4
    ) => {
        const isEditing = editingField === field;
        const value = settings?.[field] || "";

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
                            <p className="text-sm text-slate-500 mt-1">{description}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => handleEditField(field, value)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        {isTextarea ? (
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                rows={rows}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                                placeholder={`Masukkan ${label.toLowerCase()}...`}
                            />
                        ) : (
                            <input
                                type="text"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder={`Masukkan ${label.toLowerCase()}...`}
                            />
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSaveField(field)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Simpan
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                <XMarkIcon className="w-4 h-4" />
                                Batal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4">
                        {value ? (
                            <pre className="bg-slate-50 p-4 rounded-lg text-sm font-mono text-slate-700 overflow-x-auto max-h-40 overflow-y-auto border border-slate-200">
                                {value}
                            </pre>
                        ) : (
                            <p className="text-slate-400 italic">Belum ada konten</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        Pengaturan Header
                    </h1>
                    <p className="text-slate-600">
                        Kelola custom code, robots.txt, dan ads.txt untuk website Anda
                    </p>
                </div>

                <div className="space-y-6">
                    {renderEditableField(
                        "custom_head_code",
                        "Custom Head Code",
                        "HTML/JS yang akan diinjeksi ke <head> (Google AdSense, Analytics, dll)",
                        <CodeBracketIcon className="w-6 h-6" />,
                        true,
                        10
                    )}

                    {renderEditableField(
                        "robots_txt",
                        "robots.txt",
                        "Atur akses crawler search engine ke website Anda",
                        <DocumentTextIcon className="w-6 h-6" />,
                        true,
                        8
                    )}

                    {renderEditableField(
                        "ads_txt",
                        "ads.txt",
                        "File ads.txt untuk Google AdSense dan network iklan lainnya",
                        <MegaphoneIcon className="w-6 h-6" />,
                        true,
                        8
                    )}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Panduan
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2 ml-7">
                        <li>
                            <strong>Custom Head Code:</strong> Paste script Google AdSense atau tracking code lainnya
                        </li>
                        <li>
                            <strong>robots.txt:</strong> Accessible di <code className="bg-blue-100 px-2 py-0.5 rounded">/robots.txt</code>
                        </li>
                        <li>
                            <strong>ads.txt:</strong> Accessible di <code className="bg-blue-100 px-2 py-0.5 rounded">/ads.txt</code>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
