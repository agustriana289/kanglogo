"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import InvoiceGate from "@/components/InvoiceGate";
import {
    FolderIcon,
    DocumentIcon,
    PhotoIcon,
    VideoCameraIcon,
    MusicalNoteIcon,
    ArchiveBoxIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    ChevronRightIcon,
    HomeIcon,
    ArrowLeftIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    category: string;
    size: string;
    modifiedTime: string;
    isFolder: boolean;
    downloadLink: string | null;
    viewLink: string;
}

interface FolderPath {
    id: string;
    name: string;
}

// File type icon component
function FileTypeIcon({ category, className = "w-5 h-5" }: { category: string; className?: string }) {
    switch (category) {
        case "Folder":
            return <FolderIcon className={`${className} text-yellow-500`} />;
        case "Image":
            return <PhotoIcon className={`${className} text-green-500`} />;
        case "Video":
            return <VideoCameraIcon className={`${className} text-purple-500`} />;
        case "Audio":
            return <MusicalNoteIcon className={`${className} text-pink-500`} />;
        case "Document":
            return <DocumentIcon className={`${className} text-red-500`} />;
        case "Archive":
            return <ArchiveBoxIcon className={`${className} text-orange-500`} />;
        default:
            return <DocumentIcon className={`${className} text-gray-500`} />;
    }
}

export default function StoreFileManagerPage() {
    const params = useParams();
    const orderNumber = params?.order as string;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [orderData, setOrderData] = useState<{
        order_number: string;
        customer_name: string;
        customer_email: string;
        download_link: string | null;
        status: string;
    } | null>(null);
    const [websitePhone, setWebsitePhone] = useState<string>("");

    // Folder navigation
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);
    const [rootFolderName, setRootFolderName] = useState<string>("Files");

    useEffect(() => {
        fetchOrderAndFiles();
        fetchWebsiteSettings();
    }, [orderNumber]);

    const fetchWebsiteSettings = async () => {
        const { data } = await supabase
            .from("website_settings")
            .select("website_phone")
            .single();
        if (data?.website_phone) {
            setWebsitePhone(data.website_phone);
        }
    };

    const fetchOrderAndFiles = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch store order data
            const { data: order, error: orderError } = await supabase
                .from("store_orders")
                .select("order_number, customer_name, customer_email, download_link, status")
                .eq("order_number", orderNumber)
                .single();

            if (orderError || !order) {
                setError("Order tidak ditemukan");
                setLoading(false);
                return;
            }

            setOrderData(order);

            if (!order.download_link) {
                setError("File belum tersedia untuk order ini");
                setLoading(false);
                return;
            }

            if (order.status !== "completed") {
                setError("File hanya tersedia untuk order yang sudah selesai");
                setLoading(false);
                return;
            }

            // Fetch Drive folder contents
            await fetchFolderContents(order.download_link);

        } catch (err) {
            console.error("Error:", err);
            setError("Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    };

    const fetchFolderContents = async (folderUrl: string, folderId?: string) => {
        try {
            const params = new URLSearchParams();
            if (folderId) {
                params.set("folderId", folderId);
            } else {
                params.set("folderUrl", folderUrl);
            }

            const response = await fetch(`/api/drive?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat file");
            }

            setFiles(data.files);

            // Set root folder ID and name on first load
            if (!rootFolderId) {
                setRootFolderId(data.folderId);
                setCurrentFolderId(data.folderId);
                setRootFolderName(data.folderName || "Files");
            }

        } catch (err: any) {
            console.error("Error fetching files:", err);
            setError(err.message || "Gagal memuat file dari Google Drive");
        }
    };

    const navigateToFolder = async (folder: DriveFile) => {
        setLoading(true);
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
        setCurrentFolderId(folder.id);
        await fetchFolderContents("", folder.id);
        setLoading(false);
    };

    const navigateBack = async (index?: number) => {
        setLoading(true);

        let targetFolderId: string;
        let newPath: FolderPath[];

        if (index === undefined || index < 0) {
            // Go to root
            targetFolderId = rootFolderId!;
            newPath = [];
        } else {
            // Go to specific folder in path
            targetFolderId = folderPath[index].id;
            newPath = folderPath.slice(0, index + 1);
        }

        setFolderPath(newPath);
        setCurrentFolderId(targetFolderId);
        await fetchFolderContents("", targetFolderId);
        setLoading(false);
    };

    const handleDownload = (file: DriveFile) => {
        if (file.downloadLink) {
            window.open(file.downloadLink, "_blank");
        } else {
            // For Google Docs/Sheets/etc, open in viewer
            window.open(file.viewLink, "_blank");
        }
    };

    const handleOpenInDrive = () => {
        if (orderData?.download_link) {
            window.open(orderData.download_link, "_blank");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getWhatsAppLink = () => {
        const cleanedNumber = websitePhone.replace(/\D/g, "");
        return `https://wa.me/${cleanedNumber}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Data tidak ditemukan"}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return (
        <InvoiceGate customerEmail={orderData.customer_email} invoiceNumber={orderData.order_number}>
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            File Akhir untuk Proyek {orderData.order_number}
                        </h1>
                    </div>

                    {/* File Manager Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        {/* Header with breadcrumb */}
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between px-6 gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => navigateBack(-1)}
                                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{rootFolderName}</span>
                                </button>

                                {folderPath.map((folder, index) => (
                                    <div key={folder.id} className="flex items-center gap-1">
                                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                        <button
                                            onClick={() => navigateBack(index)}
                                            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary"
                                        >
                                            {folder.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {files.filter(f => !f.isFolder).length} file
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block sm:hidden space-y-3 px-6 pb-4">
                            {files.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800">
                                    Folder ini kosong
                                </div>
                            ) : (
                                files.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm ${file.isFolder ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
                                        onClick={() => file.isFolder && navigateToFolder(file)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="shrink-0 p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                                    <FileTypeIcon category={file.category} className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                                        {file.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {file.category} • {file.isFolder ? "-" : file.size}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                                            <span className="text-[10px] text-gray-400">
                                                {formatDate(file.modifiedTime)}
                                            </span>

                                            {!file.isFolder && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(file.viewLink, "_blank");
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-slate-700 rounded-lg transition"
                                                        title="Lihat"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(file);
                                                        }}
                                                        className="p-2 text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm shadow-primary/30 transition"
                                                        title="Download"
                                                    >
                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block max-w-full overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 border-t border-gray-200 px-6 py-3 dark:border-gray-800">
                                    <div className="col-span-5 flex items-center">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Nama File
                                        </p>
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Kategori
                                        </p>
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Ukuran
                                        </p>
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Terakhir Diubah
                                        </p>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Aksi
                                        </p>
                                    </div>
                                </div>

                                {/* Table Body */}
                                {files.length === 0 ? (
                                    <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                                        Folder ini kosong
                                    </div>
                                ) : (
                                    files.map((file) => (
                                        <div
                                            key={file.id}
                                            className={`grid grid-cols-12 border-t border-gray-100 px-6 py-4 dark:border-gray-800 ${file.isFolder ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""
                                                }`}
                                            onClick={() => file.isFolder && navigateToFolder(file)}
                                        >
                                            <div className="col-span-5 flex items-center">
                                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400">
                                                    <FileTypeIcon category={file.category} />
                                                    <span className="truncate max-w-[300px]">{file.name}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex items-center">
                                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                                    {file.category}
                                                </p>
                                            </div>
                                            <div className="col-span-2 flex items-center">
                                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                                    {file.isFolder ? "-" : file.size}
                                                </p>
                                            </div>
                                            <div className="col-span-2 flex items-center">
                                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                                    {formatDate(file.modifiedTime)}
                                                </p>
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                {!file.isFolder && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file);
                                                            }}
                                                            className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                                                            title="Download"
                                                        >
                                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(file.viewLink, "_blank");
                                                            }}
                                                            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                                                            title="Lihat"
                                                        >
                                                            <EyeIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Download All Button */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleOpenInDrive}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/80 shadow-lg"
                        >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                            Unduh File Desain
                        </button>
                    </div>

                    {/* Thank You Message */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                            Terima kasih telah order di kanglogo.com. Semoga desain anda jadi simbol kesuksesan anda.
                        </p>
                        {websitePhone && (
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                Jika ada kendala atau kesalahan dalam pengiriman file, silahkan hubungi{" "}
                                <a
                                    href={getWhatsAppLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium"
                                >
                                    {websitePhone}
                                </a>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </InvoiceGate>
    );
}
