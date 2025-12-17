"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    CurrencyDollarIcon,
    UserIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowTopRightOnSquareIcon,
    FolderOpenIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface StoreOrderWithAsset {
    id: number;
    order_number: string;
    asset_id: number;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string | null;
    price: number;
    discount_code: string | null;
    discount_amount: number;
    status: string;
    download_link: string | null;
    created_at: string;
    marketplace_assets: {
        nama_aset: string;
        image_url: string | null;
    } | null;
}

const statusOptions = [
    { value: "pending_payment", label: "Belum Dibayar", bgClass: "bg-yellow-100 dark:bg-yellow-900/20", textClass: "text-yellow-800 dark:text-yellow-400" },
    { value: "paid", label: "Dibayar", bgClass: "bg-blue-100 dark:bg-blue-900/20", textClass: "text-blue-800 dark:text-blue-400" },
    { value: "accepted", label: "Diterima", bgClass: "bg-purple-100 dark:bg-purple-900/20", textClass: "text-purple-800 dark:text-purple-400" },
    { value: "in_progress", label: "Dikerjakan", bgClass: "bg-orange-100 dark:bg-orange-900/20", textClass: "text-orange-800 dark:text-orange-400" },
    { value: "completed", label: "Selesai", bgClass: "bg-green-100 dark:bg-green-900/20", textClass: "text-green-800 dark:text-green-400" },
    { value: "cancelled", label: "Dibatalkan", bgClass: "bg-red-100 dark:bg-red-900/20", textClass: "text-red-800 dark:text-red-400" },
];

const ITEMS_PER_PAGE = 10;

export default function StorePurchasesPage() {
    const [orders, setOrders] = useState<StoreOrderWithAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua");
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileStats, setShowMobileStats] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filterProduct, setFilterProduct] = useState("");
    const [filterCustomer, setFilterCustomer] = useState("");
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<StoreOrderWithAsset | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editedStatus, setEditedStatus] = useState("");
    const [downloadLink, setDownloadLink] = useState("");
    const [isEditingDownloadLink, setIsEditingDownloadLink] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showAlert, showConfirm } = useAlert();

    // Stats
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingPayment: 0,
        completed: 0,
        totalRevenue: 0,
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("store_orders")
            .select(`
        *,
        marketplace_assets (
          nama_aset,
          image_url
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching store orders:", error);
            showAlert("error", "Error", "Gagal memuat data pembelian");
        } else {
            setOrders(data || []);
            // Calculate stats
            const ordersData = data || [];
            setStats({
                totalOrders: ordersData.length,
                pendingPayment: ordersData.filter(o => o.status === "pending_payment").length,
                completed: ordersData.filter(o => o.status === "completed").length,
                totalRevenue: ordersData.filter(o => o.status === "completed" || o.status === "paid").reduce((sum, o) => sum + o.price, 0),
            });
        }
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy", { locale: id });
        } catch {
            return "-";
        }
    };

    const formatDateFull = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy", { locale: id });
        } catch {
            return "-";
        }
    };

    const getAssetName = (order: StoreOrderWithAsset) => {
        return order.marketplace_assets?.nama_aset || `Asset #${order.asset_id}`;
    };

    const openDetailModal = (order: StoreOrderWithAsset) => {
        setSelectedOrder(order);
        setEditedStatus(order.status);
        setDownloadLink(order.download_link || "");
        setIsEditingDownloadLink(false);
        setShowDetailModal(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedOrder) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from("store_orders")
                .update({
                    status: editedStatus,
                    download_link: downloadLink || null,
                })
                .eq("id", selectedOrder.id);

            if (error) throw error;
            showAlert("success", "Berhasil", "Pesanan berhasil diperbarui!");
            fetchOrders();
            setShowDetailModal(false);
        } catch (error: any) {
            console.error("Error:", error);
            showAlert("error", "Gagal", error.message || "Gagal memperbarui pesanan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedOrder) return;
        const confirmed = await showConfirm(
            "Hapus Pesanan",
            "Apakah Anda yakin ingin menghapus pesanan ini?",
            "error",
            "Hapus"
        );
        if (!confirmed) return;

        try {
            const { error } = await supabase.from("store_orders").delete().eq("id", selectedOrder.id);
            if (error) throw error;
            showAlert("success", "Berhasil", "Pesanan berhasil dihapus");
            setShowDetailModal(false);
            fetchOrders();
        } catch (error) {
            console.error(error);
            showAlert("error", "Gagal", "Gagal menghapus pesanan");
        }
    };

    // Filter orders
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getAssetName(order).toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (filterStatus === "Belum Dibayar") {
            matchesStatus = order.status === "pending_payment";
        } else if (filterStatus === "Lunas") {
            matchesStatus = order.status === "completed" || order.status === "paid";
        }

        const matchesProduct = !filterProduct || getAssetName(order).toLowerCase().includes(filterProduct.toLowerCase());
        const matchesCustomer = !filterCustomer || order.customer_name.toLowerCase().includes(filterCustomer.toLowerCase());

        return matchesSearch && matchesStatus && matchesProduct && matchesCustomer;
    });

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const inputStyle = "w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2.5 px-4 text-sm text-gray-800 dark:text-white dark:bg-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none";

    if (loading) return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
            <LogoPathAnimation />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
            {/* Overview Stats */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                <div className="block sm:hidden mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-800 dark:text-white/90">
                            Ringkasan
                        </h2>
                        <button
                            onClick={() => setShowMobileStats(!showMobileStats)}
                            className="sm:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {showMobileStats ? (
                                <ChevronUpIcon className="w-5 h-5" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
                <div
                    className={`${showMobileStats ? "grid" : "hidden"
                        } grid-cols-1 rounded-xl border border-gray-200 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0 dark:divide-gray-800 dark:border-gray-800`}
                >
                    <div className="border-b p-5 sm:border-r lg:border-b-0">
                        <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
                            Total Pembelian
                        </p>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {stats.totalOrders}
                        </h3>
                    </div>
                    <div className="border-b p-5 lg:border-b-0">
                        <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
                            Belum Dibayar
                        </p>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {stats.pendingPayment}
                        </h3>
                    </div>
                    <div className="border-b p-5 sm:border-r sm:border-b-0">
                        <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
                            Selesai
                        </p>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {stats.completed}
                        </h3>
                    </div>
                    <div className="p-5">
                        <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
                            Total Pendapatan
                        </p>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {formatCurrency(stats.totalRevenue)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 flex-wrap gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Daftar Pembelian
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Semua transaksi pembelian toko
                        </p>
                    </div>
                    <div className="flex gap-3.5 flex-wrap">
                        {/* Filter Tabs */}
                        <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
                            {["Semua", "Belum Dibayar", "Lunas"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${filterStatus === status
                                        ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Search & Filter Button */}
                        <div className="flex gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari pesanan, nama..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none xl:w-[300px] dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className="shadow-sm flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-[11px] text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 h-11 sm:w-auto sm:px-4"
                                >
                                    <FunnelIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Filter</span>
                                </button>
                                {showFilterDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800 z-10 transition-all origin-top-right">
                                        <div className="mb-4">
                                            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Produk
                                            </label>
                                            <input
                                                type="text"
                                                value={filterProduct}
                                                onChange={(e) => setFilterProduct(e.target.value)}
                                                placeholder="Filter produk..."
                                                className={inputStyle}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Pelanggan
                                            </label>
                                            <input
                                                type="text"
                                                value={filterCustomer}
                                                onChange={(e) => setFilterCustomer(e.target.value)}
                                                placeholder="Filter pelanggan..."
                                                className={inputStyle}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilterDropdown(false)}
                                            className="bg-primary hover:bg-primary/80 w-full h-10 rounded-lg text-sm font-medium text-white transition"
                                        >
                                            Terapkan Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-4 px-4 pb-4">
                    {paginatedOrders.map((order) => {
                        const statusOpt = statusOptions.find((opt) => opt.value === order.status) || statusOptions[0];
                        return (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600 space-y-3"
                                onClick={() => openDetailModal(order)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {order.order_number}
                                            </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusOpt.bgClass} ${statusOpt.textClass}`}
                                            >
                                                {statusOpt.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {order.customer_name}
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-bg-primary focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                                        checked={selectedOrders.includes(order.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => {
                                            if (selectedOrders.includes(order.id))
                                                setSelectedOrders(selectedOrders.filter((id) => id !== order.id));
                                            else setSelectedOrders([...selectedOrders, order.id]);
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                                            Produk
                                        </span>
                                        <span className="text-gray-900 dark:text-white">{getAssetName(order)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                                            Total
                                        </span>
                                        <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(order.price)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                                            Tanggal
                                        </span>
                                        {formatDate(order.created_at)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="p-4 whitespace-nowrap min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-bg-primary focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                                                checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                                                onChange={() => {
                                                    if (selectedOrders.length === paginatedOrders.length)
                                                        setSelectedOrders([]);
                                                    else
                                                        setSelectedOrders(paginatedOrders.map((o) => o.id));
                                                }}
                                            />
                                        </label>
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            No. Pesanan
                                        </span>
                                    </div>
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Pelanggan
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Produk
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Tanggal
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Tidak ada data pembelian
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => {
                                    const statusOpt = statusOptions.find((opt) => opt.value === order.status) || statusOptions[0];
                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                                        >
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-bg-primary focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                                                        checked={selectedOrders.includes(order.id)}
                                                        onChange={() => {
                                                            if (selectedOrders.includes(order.id))
                                                                setSelectedOrders(selectedOrders.filter((id) => id !== order.id));
                                                            else setSelectedOrders([...selectedOrders, order.id]);
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {order.order_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                {order.customer_name}
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                {getAssetName(order)}
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                {formatCurrency(order.price)}
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOpt.bgClass} ${statusOpt.textClass}`}>
                                                    {statusOpt.label}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/store/invoice/${order.order_number}`}
                                                        target="_blank"
                                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                                        Buka
                                                    </Link>
                                                    <button
                                                        onClick={() => openDetailModal(order)}
                                                        className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 transition"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {filteredOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} sampai {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} dari {filteredOrders.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                                if (currentPage > 3) pageNum = currentPage - 2 + i;
                                if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition ${currentPage === pageNum
                                        ? "bg-primary text-white"
                                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl my-8">
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detail Pembelian</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{selectedOrder.order_number}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Two Column Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Info Pelanggan */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" /> Info Pelanggan
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500">Nama:</span> <span className="text-gray-900 dark:text-white">{selectedOrder.customer_name}</span></p>
                                        <p><span className="text-gray-500">Email:</span> <span className="text-gray-900 dark:text-white">{selectedOrder.customer_email}</span></p>
                                        {selectedOrder.customer_whatsapp && (
                                            <p><span className="text-gray-500">WhatsApp:</span> <span className="text-gray-900 dark:text-white">{selectedOrder.customer_whatsapp}</span></p>
                                        )}
                                    </div>
                                </div>

                                {/* Info Produk */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <CurrencyDollarIcon className="w-4 h-4" /> Info Produk
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500">Produk:</span> <span className="text-gray-900 dark:text-white">{getAssetName(selectedOrder)}</span></p>
                                        <p><span className="text-gray-500">Total:</span> <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(selectedOrder.price)}</span></p>
                                        {selectedOrder.discount_code && (
                                            <p><span className="text-gray-500">Diskon:</span> <span className="text-green-600">{selectedOrder.discount_code} (-{formatCurrency(selectedOrder.discount_amount || 0)})</span></p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kelola Status Section */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Kelola Status</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                        <select className={inputStyle} value={editedStatus} onChange={(e) => setEditedStatus(e.target.value)}>
                                            {statusOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link File Final</label>
                                        {isEditingDownloadLink ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className={inputStyle}
                                                    placeholder="https://drive.google.com/drive/folders/..."
                                                    value={downloadLink}
                                                    onChange={(e) => setDownloadLink(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingDownloadLink(false)}
                                                    className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 flex-shrink-0"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    onClick={() => downloadLink && window.open(`/file/s/${selectedOrder?.order_number}`, '_blank')}
                                                    className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 overflow-hidden ${downloadLink ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600' : ''}`}
                                                >
                                                    {downloadLink ? (
                                                        <>
                                                            <FolderOpenIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                                            <span className="text-sm text-gray-800 dark:text-white truncate">
                                                                {downloadLink}
                                                            </span>
                                                            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            Belum ada link
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingDownloadLink(true)}
                                                    className="p-2 text-gray-500 hover:text-primary bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 flex-shrink-0"
                                                    title="Edit Link"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Dibuat</label>
                                        <input
                                            type="text"
                                            className={`${inputStyle} bg-gray-50 dark:bg-slate-600`}
                                            value={formatDateFull(selectedOrder.created_at)}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-end gap-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="px-4 sm:px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 sm:px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Hapus Pesanan</span>
                                <span className="sm:hidden">Hapus</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
