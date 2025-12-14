"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoLoading from "@/components/LogoLoading";
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

export default function StoreFileManagerPage({
    params,
}: {
    params: Promise<{ order: string }>;
}) {
    const { order: orderNumber } = use(params);
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

    // Folder navigation
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrderAndFiles();
    }, [orderNumber]);

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

            // Set root folder ID on first load
            if (!rootFolderId) {
                setRootFolderId(data.folderId);
                setCurrentFolderId(data.folderId);
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

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <LogoLoading size="xl" />
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
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Kembali ke Invoice
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            File Manager
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Order #{orderData.order_number} - {orderData.customer_name}
                        </p>
                    </div>

                    {/* File Manager Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        {/* Header with breadcrumb */}
                        <div className="mb-4 flex items-center justify-between px-6">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => navigateBack(-1)}
                                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Root</span>
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

                        {/* Table */}
                        <div className="max-w-full overflow-x-auto">
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
                </div>
            </div>
        </InvoiceGate>
    );
}
