"use client";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoLoading from "@/components/LogoLoading";
import { uploadFile } from "@/lib/supabase-storage";
import Link from "next/link";
import {
    ArrowLeftIcon,
    PhotoIcon,
    XMarkIcon,
    CloudArrowUpIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

// Opsi untuk jenis proyek (kategori)
const projectTypes = [
    "Logo",
    "Branding",
    "Banner",
    "Brosur",
    "Compro",
    "Kemasan",
    "Template",
    "Icon",
    "Custom",
    "Lainnya",
];

// Opsi untuk aplikasi yang digunakan
const applicationOptions = [
    "Adobe Illustrator",
    "Adobe Photoshop",
    "Adobe AfterEffect",
    "CorelDraw",
    "Affinity Designer",
    "Inkscape",
    "Blender",
    "Canva",
];

interface FileItem {
    id: string;
    file: File;
    preview: string;
    title: string;
    slug: string;
    owner: string;
    deskripsi_proyek: string;
    filosofi_proyek: string;
    status: "pending" | "uploading" | "success" | "error";
    errorMessage?: string;
}

export default function BatchUploadPage() {
    const { showAlert, showConfirm } = useAlert();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global Settings
    const [globalSettings, setGlobalSettings] = useState({
        start_date: "",
        end_date: "",
        type: "",
        aplikasi_yang_digunakan: [] as string[],
    });

    // Files State
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ success: 0, failed: 0, total: 0 });

    // Generate slug from title
    const generateSlug = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    // Handle file selection
    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: FileItem[] = [];

        Array.from(selectedFiles).forEach((file) => {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                showAlert("warning", "Peringatan", `${file.name} bukan file gambar!`);
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert("warning", "Peringatan", `${file.name} terlalu besar! Maksimal 5MB`);
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const fileItem: FileItem = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    preview: reader.result as string,
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                    slug: generateSlug(file.name.replace(/\.[^/.]+$/, "")),
                    owner: "",
                    deskripsi_proyek: "",
                    filosofi_proyek: "",
                    status: "pending",
                };
                setFiles((prev) => [...prev, fileItem]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [showAlert]);

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    // Update individual file
    const updateFile = (id: string, field: keyof FileItem, value: string) => {
        setFiles((prev) =>
            prev.map((f) => {
                if (f.id === id) {
                    const updated = { ...f, [field]: value };
                    // Auto-generate slug when title changes
                    if (field === "title") {
                        updated.slug = generateSlug(value);
                    }
                    return updated;
                }
                return f;
            })
        );
    };

    // Remove file
    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    // Handle application checkbox
    const handleApplicationChange = (app: string) => {
        setGlobalSettings((prev) => {
            const apps = [...prev.aplikasi_yang_digunakan];
            if (apps.includes(app)) {
                return { ...prev, aplikasi_yang_digunakan: apps.filter((a) => a !== app) };
            } else {
                return { ...prev, aplikasi_yang_digunakan: [...apps, app] };
            }
        });
    };

    // Upload all files
    const handleUploadAll = async () => {
        // Validate
        const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");
        if (pendingFiles.length === 0) {
            showAlert("warning", "Peringatan", "Tidak ada file untuk diupload!");
            return;
        }

        // Check if all files have titles
        const missingTitles = pendingFiles.filter((f) => !f.title.trim());
        if (missingTitles.length > 0) {
            showAlert("warning", "Validasi", "Semua file harus memiliki nama proyek!");
            return;
        }

        const confirmed = await showConfirm(
            "Upload Proyek",
            `Anda akan mengupload ${pendingFiles.length} proyek. Lanjutkan?`,
            "info",
            "Ya, Upload"
        );
        if (!confirmed) return;

        setIsUploading(true);
        setUploadProgress({ success: 0, failed: 0, total: pendingFiles.length });

        let successCount = 0;
        let failedCount = 0;

        for (const fileItem of pendingFiles) {
            // Update status to uploading
            setFiles((prev) =>
                prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading" as const } : f))
            );

            try {
                // Upload image to Supabase Storage
                const fileName = `${Date.now()}-${fileItem.file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
                const filePath = `projects/${fileName}`;

                const { publicUrl, error: uploadError } = await uploadFile("assets", filePath, fileItem.file);

                if (uploadError) {
                    throw new Error("Gagal mengupload gambar");
                }

                // Insert project data
                const projectData = {
                    title: fileItem.title,
                    slug: fileItem.slug,
                    type: globalSettings.type || null,
                    owner: fileItem.owner || null,
                    start_date: globalSettings.start_date || null,
                    end_date: globalSettings.end_date || null,
                    image_url: publicUrl,
                    deskripsi_proyek: fileItem.deskripsi_proyek || null,
                    filosofi_proyek: fileItem.filosofi_proyek || null,
                    aplikasi_yang_digunakan: JSON.stringify(globalSettings.aplikasi_yang_digunakan),
                };

                const { error: insertError } = await supabase.from("projects").insert(projectData);

                if (insertError) {
                    throw new Error(insertError.message);
                }

                // Success
                setFiles((prev) =>
                    prev.map((f) => (f.id === fileItem.id ? { ...f, status: "success" as const } : f))
                );
                successCount++;
                setUploadProgress((prev) => ({ ...prev, success: successCount }));
            } catch (error: any) {
                // Error
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileItem.id
                            ? { ...f, status: "error" as const, errorMessage: error.message }
                            : f
                    )
                );
                failedCount++;
                setUploadProgress((prev) => ({ ...prev, failed: failedCount }));
            }
        }

        setIsUploading(false);

        if (failedCount === 0) {
            showAlert("success", "Berhasil", `${successCount} proyek berhasil diupload!`);
        } else {
            showAlert(
                "warning",
                "Selesai",
                `${successCount} berhasil, ${failedCount} gagal. Periksa file yang gagal dan coba lagi.`
            );
        }
    };

    // Clear successful files
    const clearSuccessful = () => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"));
    };

    const inputStyle =
        "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

    const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;
    const successCount = files.filter((f) => f.status === "success").length;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/projects"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                                Batch Upload Proyek
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Upload banyak proyek sekaligus dengan pengaturan global
                            </p>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="flex items-center gap-3">
                            {successCount > 0 && (
                                <button
                                    onClick={clearSuccessful}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    Hapus yang berhasil ({successCount})
                                </button>
                            )}
                            <button
                                onClick={handleUploadAll}
                                disabled={isUploading || pendingCount === 0}
                                className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Mengupload... ({uploadProgress.success}/{uploadProgress.total})
                                    </>
                                ) : (
                                    <>
                                        <CloudArrowUpIcon className="w-5 h-5" />
                                        Upload Semua ({pendingCount})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Settings */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    🔧 Pengaturan Global
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Pengaturan ini akan diterapkan ke semua proyek yang diupload
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Mulai
                        </label>
                        <input
                            type="date"
                            className={inputStyle}
                            value={globalSettings.start_date}
                            onChange={(e) => setGlobalSettings({ ...globalSettings, start_date: e.target.value })}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Selesai
                        </label>
                        <input
                            type="date"
                            className={inputStyle}
                            value={globalSettings.end_date}
                            onChange={(e) => setGlobalSettings({ ...globalSettings, end_date: e.target.value })}
                        />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kategori
                        </label>
                        <select
                            className={inputStyle}
                            value={globalSettings.type}
                            onChange={(e) => setGlobalSettings({ ...globalSettings, type: e.target.value })}
                        >
                            <option value="">Pilih Kategori</option>
                            {projectTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Applications */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aplikasi yang Digunakan
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {applicationOptions.map((app) => (
                            <label
                                key={app}
                                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                            >
                                <input
                                    type="checkbox"
                                    checked={globalSettings.aplikasi_yang_digunakan.includes(app)}
                                    onChange={() => handleApplicationChange(app)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="truncate">{app}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div className="mb-6">
                <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${isDragging
                            ? "border-primary bg-primary/5"
                            : "border-gray-300 dark:border-gray-700 hover:border-primary bg-white dark:bg-white/[0.03]"
                        }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
                        <PhotoIcon className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Drag & drop file gambar di sini
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        atau klik untuk memilih file
                    </p>
                    <p className="text-xs text-gray-400">Maksimal 5MB per file • Format: JPG, PNG, GIF, WebP</p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        📋 Daftar File ({files.length})
                    </h3>

                    {files.map((fileItem, index) => (
                        <div
                            key={fileItem.id}
                            className={`rounded-xl border p-4 transition ${fileItem.status === "success"
                                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                                    : fileItem.status === "error"
                                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                        : fileItem.status === "uploading"
                                            ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                                            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]"
                                }`}
                        >
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Preview */}
                                <div className="flex-shrink-0">
                                    <div className="relative w-full lg:w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                                        <img
                                            src={fileItem.preview}
                                            alt={fileItem.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {fileItem.status === "success" && (
                                            <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                                                <CheckCircleIcon className="w-10 h-10 text-white" />
                                            </div>
                                        )}
                                        {fileItem.status === "error" && (
                                            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                                                <ExclamationCircleIcon className="w-10 h-10 text-white" />
                                            </div>
                                        )}
                                        {fileItem.status === "uploading" && (
                                            <div className="absolute inset-0 bg-blue-500/80 flex items-center justify-center">
                                                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Nama Proyek *
                                        </label>
                                        <input
                                            type="text"
                                            className={`${inputStyle} text-sm py-2`}
                                            value={fileItem.title}
                                            onChange={(e) => updateFile(fileItem.id, "title", e.target.value)}
                                            placeholder="Nama proyek"
                                            disabled={fileItem.status !== "pending" && fileItem.status !== "error"}
                                        />
                                    </div>

                                    {/* Client */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Klien
                                        </label>
                                        <input
                                            type="text"
                                            className={`${inputStyle} text-sm py-2`}
                                            value={fileItem.owner}
                                            onChange={(e) => updateFile(fileItem.id, "owner", e.target.value)}
                                            placeholder="Nama klien"
                                            disabled={fileItem.status !== "pending" && fileItem.status !== "error"}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Deskripsi
                                        </label>
                                        <input
                                            type="text"
                                            className={`${inputStyle} text-sm py-2`}
                                            value={fileItem.deskripsi_proyek}
                                            onChange={(e) => updateFile(fileItem.id, "deskripsi_proyek", e.target.value)}
                                            placeholder="Deskripsi singkat"
                                            disabled={fileItem.status !== "pending" && fileItem.status !== "error"}
                                        />
                                    </div>

                                    {/* Philosophy */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Filosofi
                                        </label>
                                        <input
                                            type="text"
                                            className={`${inputStyle} text-sm py-2`}
                                            value={fileItem.filosofi_proyek}
                                            onChange={(e) => updateFile(fileItem.id, "filosofi_proyek", e.target.value)}
                                            placeholder="Filosofi desain"
                                            disabled={fileItem.status !== "pending" && fileItem.status !== "error"}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0 flex items-start">
                                    {(fileItem.status === "pending" || fileItem.status === "error") && (
                                        <button
                                            onClick={() => removeFile(fileItem.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition"
                                            title="Hapus"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Error Message */}
                            {fileItem.status === "error" && fileItem.errorMessage && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    Error: {fileItem.errorMessage}
                                </p>
                            )}

                            {/* Slug Preview */}
                            <div className="mt-2 text-xs text-gray-400">
                                Slug: <span className="font-mono">{fileItem.slug || "-"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {files.length === 0 && (
                <div className="text-center py-12">
                    <PhotoIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        Belum ada file yang dipilih. Drag & drop atau klik area di atas untuk memilih file.
                    </p>
                </div>
            )}
        </div>
    );
}
