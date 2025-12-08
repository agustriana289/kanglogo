"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogoFont } from "@/types/logo-generator";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    LinkIcon,
} from "@heroicons/react/24/outline";

export default function AdminFontsPage() {
    const [fonts, setFonts] = useState<LogoFont[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFont, setEditingFont] = useState<LogoFont | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        font_url_input: "", // Replaces complex separate inputs
    });

    // Helper to parse Google Fonts URL
    const parseGoogleFontUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const familyParam = urlObj.searchParams.get("family");

            if (!familyParam) return null;

            // familyParam example: "Open Sans:wght@400;700" or "Agbalumo"
            // We want to extract the clean name "Open Sans" or "Agbalumo"

            // 1. Remove weights part if exists (everything after :)
            // 2. Replace '+' with spaces
            const cleanName = familyParam.split(":")[0].replace(/\+/g, " ");

            return {
                font_name: cleanName,
                google_font_family: familyParam
            };
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        fetchFonts();
        // Insert Default Fonts if Empty on first load (Optional, but helper)
    }, []);

    const fetchFonts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("logo_fonts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching fonts:", error);
        } else {
            setFonts(data || []);
        }
        setLoading(false);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredFonts = fonts.filter((font) =>
        font.font_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (font?: LogoFont) => {
        if (font) {
            setEditingFont(font);
            // Reconstruct a likely URL for editing purpose, or just let them paste a new one
            setFormData({
                font_url_input: `https://fonts.googleapis.com/css2?family=${font.google_font_family}&display=swap`,
            });
        } else {
            setEditingFont(null);
            setFormData({
                font_url_input: "",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingFont(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsed = parseGoogleFontUrl(formData.font_url_input);

        if (!parsed) {
            alert("Invalid Google Fonts URL. Please paste the full URL from fonts.google.com");
            return;
        }

        const payload = {
            font_name: parsed.font_name,
            google_font_family: parsed.google_font_family,
        };

        let error;
        if (editingFont) {
            const { error: updateError } = await supabase
                .from("logo_fonts")
                .update(payload)
                .eq("id", editingFont.id);
            error = updateError;
        } else {
            // Check for duplicates
            const existing = fonts.find(f => f.font_name.toLowerCase() === parsed.font_name.toLowerCase());
            if (existing) {
                alert(`Font "${parsed.font_name}" already exists!`);
                return;
            }

            const { error: insertError } = await supabase
                .from("logo_fonts")
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            fetchFonts();
            closeModal();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this font?")) return;

        const { error } = await supabase.from("logo_fonts").delete().eq("id", id);
        if (error) {
            alert(`Error deleting: ${error.message}`);
        } else {
            fetchFonts();
        }
    };

    return (
        <section className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Kelola Font
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage fonts available in the Logo Generator by pasting Google Fonts URLs
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Tambah Font via URL
                    </button>
                </div>

                {/* Search & List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative max-w-sm">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari font..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-9 pr-4 py-2 text-sm border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Nama Font</th>
                                    <th className="px-6 py-3">Sumber Data (URL Param)</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredFonts.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-slate-400">
                                            Tidak ada font ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFonts.map((font) => (
                                        <tr
                                            key={font.id}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {font.font_name}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs bg-slate-50 p-1 rounded w-fit text-slate-500">
                                                {font.google_font_family}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(font)}
                                                        className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-md transition"
                                                        title="Edit URL"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(font.id)}
                                                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingFont ? "Edit Font" : "Tambah Font Baru"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2 items-start">
                                <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold mb-1">Cara Menambahkan:</p>
                                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                                        <li>Buka <a href="https://fonts.google.com" target="_blank" className="underline">Google Fonts</a></li>
                                        <li>Pilih font yang diinginkan</li>
                                        <li>Copy URL dari browser (Contoh: <code>https://fonts.googleapis.com/...</code>)</li>
                                        <li>Paste di kolom dibawah ini</li>
                                    </ol>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Google Fonts Link (URL)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.font_url_input}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            font_url_input: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border-slate-300 focus:ring-slate-500 focus:border-slate-500 text-sm font-mono"
                                    placeholder="https://fonts.googleapis.com/css2?family=Agbalumo&display=swap"
                                />
                                {formData.font_url_input && parseGoogleFontUrl(formData.font_url_input) && (
                                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                        <PlusIcon className="w-3 h-3" />
                                        Terdeteksi: <strong>{parseGoogleFontUrl(formData.font_url_input)?.font_name}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                                >
                                    Simpan Font
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
