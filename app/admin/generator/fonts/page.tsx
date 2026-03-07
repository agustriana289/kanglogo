"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { LogoFont } from "@/types/logo-generator";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    LinkIcon,
    XMarkIcon,
    ChevronDownIcon,
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
        font_url_input: "",
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
    const pageDropdownRef = useRef<HTMLDivElement>(null);

    // Helper to parse Google Fonts URL
    const parseGoogleFontUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const familyParam = urlObj.searchParams.get("family");

            if (!familyParam) return null;

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

    // Pagination
    const totalPages = Math.ceil(filteredFonts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedFonts = filteredFonts.slice(indexOfFirstItem, indexOfLastItem);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!pageDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
                setPageDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [pageDropdownOpen]);

    const openModal = (font?: LogoFont) => {
        if (font) {
            setEditingFont(font);
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

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari font..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
                        />
                    </div>

                    {/* Right: Add Button */}
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Tambah Font
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredFonts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <LinkIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Tidak ada font
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {searchTerm ? "Coba ubah kata kunci pencarian Anda." : "Belum ada font yang ditambahkan."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-primary text-white font-medium">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">Nama Font</th>
                                    <th className="px-6 py-4">Google Font Family</th>
                                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedFonts.map((font) => (
                                    <tr
                                        key={font.id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {font.font_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                                                {font.google_font_family}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(font)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(font.id)}
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
            )}

            {/* Pagination */}
            {filteredFonts.length > 0 && (
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
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(
                                    (p) =>
                                        p === 1 ||
                                        p === totalPages ||
                                        (p >= currentPage - 1 && p <= currentPage + 1)
                                )
                                .map((page, idx) => (
                                    <li key={idx}>
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                                                    ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                                                    : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                                                }`}
                                        >
                                            {page}
                                        </button>
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

                    {/* Items Per Page - Custom Dropdown */}
                    <div className="hidden sm:inline relative" ref={pageDropdownRef}>
                        <button
                            onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                            className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                            <span className="text-gray-700 dark:text-gray-300">{itemsPerPage} halaman</span>
                            <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${pageDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {pageDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                {[10, 25, 50, 100].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => {
                                            setItemsPerPage(value);
                                            setPageDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-gray-700 dark:text-gray-300"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingFont ? "Edit Font" : "Tambah Font Baru"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex gap-2 items-start">
                                <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold mb-1">Cara Menambahkan:</p>
                                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                                        <li>Buka <a href="https://fonts.google.com" target="_blank" className="underline">Google Fonts</a></li>
                                        <li>Pilih font yang diinginkan</li>
                                        <li>Copy URL dari browser</li>
                                        <li>Paste di kolom dibawah ini</li>
                                    </ol>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm font-mono dark:bg-slate-900 dark:text-white"
                                    placeholder="https://fonts.googleapis.com/css2?family=Agbalumo&display=swap"
                                />
                                {formData.font_url_input && parseGoogleFontUrl(formData.font_url_input) && (
                                    <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <PlusIcon className="w-3 h-3" />
                                        Terdeteksi: <strong>{parseGoogleFontUrl(formData.font_url_input)?.font_name}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Simpan Font
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
