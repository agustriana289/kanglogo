"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
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
  {
    value: "pending_payment",
    label: "Belum Dibayar",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800",
  },
  {
    value: "paid",
    label: "Dibayar",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
  },
  {
    value: "accepted",
    label: "Diterima",
    bgClass: "bg-purple-100",
    textClass: "text-purple-800",
  },
  {
    value: "in_progress",
    label: "Dikerjakan",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
  },
  {
    value: "completed",
    label: "Selesai",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
  },
];

export default function StorePurchasesPage() {
  const [orders, setOrders] = useState<StoreOrderWithAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();

  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [bulkStatusDropdownOpen, setBulkStatusDropdownOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [showMobileStats, setShowMobileStats] = useState(false);

  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const bulkStatusDropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayment: 0,
    completed: 0,
    totalRevenue: 0,
  });

  const [selectedOrder, setSelectedOrder] =
    useState<StoreOrderWithAsset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editedStatus, setEditedStatus] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [isEditingDownloadLink, setIsEditingDownloadLink] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*, marketplace_assets (nama_aset, image_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const ordersData = data || [];
      setOrders(ordersData);
      setStats({
        totalOrders: ordersData.length,
        pendingPayment: ordersData.filter((o) => o.status === "pending_payment")
          .length,
        completed: ordersData.filter((o) => o.status === "completed").length,
        totalRevenue: ordersData
          .filter((o) => ["completed", "paid"].includes(o.status))
          .reduce((sum, o) => sum + o.price, 0),
      });
    } catch (error) {
      console.error(error);
      showAlert("error", "Error", "Gagal memuat data pembelian");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pageDropdownOpen &&
        pageDropdownRef.current &&
        !pageDropdownRef.current.contains(event.target as Node)
      )
        setPageDropdownOpen(false);
      if (
        bulkStatusDropdownOpen &&
        bulkStatusDropdownRef.current &&
        !bulkStatusDropdownRef.current.contains(event.target as Node)
      )
        setBulkStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pageDropdownOpen, bulkStatusDropdownOpen]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  const formatDateSafe = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  };
  const formatDateFull = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: id });
    } catch {
      return "-";
    }
  };
  const getAssetName = (order: StoreOrderWithAsset) =>
    order.marketplace_assets?.nama_aset || `Asset #${order.asset_id}`;

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
        .update({ status: editedStatus, download_link: downloadLink || null })
        .eq("id", selectedOrder.id);
      if (error) throw error;
      showAlert("success", "Berhasil", "Pesanan berhasil diperbarui!");
      fetchOrders();
      setShowDetailModal(false);
    } catch (error: any) {
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
      "Ya, Hapus",
      "Batal"
    );
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from("store_orders")
        .delete()
        .eq("id", selectedOrder.id);
      if (error) throw error;
      showAlert("success", "Berhasil", "Pesanan berhasil dihapus");
      setShowDetailModal(false);
      setSelectedOrders(selectedOrders.filter((id) => id !== selectedOrder.id));
      fetchOrders();
    } catch (error) {
      showAlert("error", "Gagal", "Gagal menghapus pesanan");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (
      orders.filter(
        (o) => selectedOrders.includes(o.id) && o.status !== "cancelled"
      ).length > 0
    ) {
      showAlert(
        "error",
        "Hapus Gagal",
        "Hanya pesanan dengan status 'Dibatalkan' yang dapat dihapus."
      );
      return;
    }
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus ${selectedOrders.length} pesanan terpilih?`,
      "error",
      "Ya, Hapus",
      "Batal"
    );
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from("store_orders")
        .delete()
        .in("id", selectedOrders);
      if (error) throw error;
      showAlert(
        "success",
        "Berhasil",
        `${selectedOrders.length} pesanan berhasil dihapus`
      );
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      showAlert("error", "Gagal", "Gagal menghapus pesanan");
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedOrders.length === 0) return;
    try {
      const { error } = await supabase
        .from("store_orders")
        .update({ status: newStatus })
        .in("id", selectedOrders);
      if (error) throw error;
      showAlert(
        "success",
        "Berhasil",
        `Status ${selectedOrders.length} pesanan berhasil diperbarui`
      );
      setBulkStatus("");
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      showAlert("error", "Gagal", "Gagal memperbarui status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_email.toLowerCase().includes(q) ||
      getAssetName(order).toLowerCase().includes(q);
    let matchesStatus = true;
    if (filterStatus === "Belum Dibayar")
      matchesStatus = order.status === "pending_payment";
    else if (filterStatus === "Lunas")
      matchesStatus = ["completed", "paid"].includes(order.status);
    const matchesProduct =
      !filterProduct ||
      getAssetName(order).toLowerCase().includes(filterProduct.toLowerCase());
    const matchesCustomer =
      !filterCustomer ||
      order.customer_name.toLowerCase().includes(filterCustomer.toLowerCase());
    return matchesSearch && matchesStatus && matchesProduct && matchesCustomer;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const CustomCheckbox = ({
    checked,
    onChange,
    variant = "default",
  }: {
    checked: boolean;
    onChange: () => void;
    variant?: "default" | "header";
  }) => (
    <button
      onClick={onChange}
      className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
        checked
          ? variant === "header"
            ? "text-white"
            : "text-primary"
          : variant === "header"
          ? "text-white/50 hover:text-white/80"
          : "text-gray-300 hover:text-gray-400"
      }`}
    >
      {checked ? (
        <CheckCircleIcon className="w-5 h-5" />
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </button>
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible)
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading)
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );

  const inputStyle =
    "w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none";

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Pembelian", val: stats.totalOrders },
          { label: "Belum Dibayar", val: stats.pendingPayment },
          { label: "Selesai", val: stats.completed },
          {
            label: "Total Pendapatan",
            val: formatCurrency(stats.totalRevenue),
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
          >
            <p className="text-slate-500 text-sm font-medium">{s.label}</p>
            <div className="flex items-end justify-between mt-3">
              <p className="text-2xl font-bold text-slate-800">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="sm:hidden mb-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <button
          onClick={() => setShowMobileStats(!showMobileStats)}
          className="flex items-center justify-between w-full font-semibold text-gray-800"
        >
          <span>Ringkasan</span>{" "}
          {showMobileStats ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
        {showMobileStats && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {[
              { l: "Total Pembelian", v: stats.totalOrders },
              { l: "Belum Dibayar", v: stats.pendingPayment },
              { l: "Selesai", v: stats.completed },
              { l: "Total Pendapatan", v: formatCurrency(stats.totalRevenue) },
            ].map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.l}</span>
                <span className="font-semibold">{s.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex">
            {["Semua", "Belum Dibayar", "Lunas"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setCurrentPage(1);
                }}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${
                  filterStatus === st
                    ? "shadow-sm text-gray-900 bg-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pesanan, nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="h-11 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FunnelIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-5 shadow-xl z-10">
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium">
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
                    <label className="mb-2 block text-xs font-medium">
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

      {selectedOrders.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedOrders.length} pesanan dipilih
          </span>
          <div className="flex gap-2">
            <div className="relative" ref={bulkStatusDropdownRef}>
              <button
                onClick={() =>
                  setBulkStatusDropdownOpen(!bulkStatusDropdownOpen)
                }
                className="h-9 flex items-center gap-2 px-3 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {bulkStatus
                    ? statusOptions.find((opt) => opt.value === bulkStatus)
                        ?.label
                    : "Ubah Status..."}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    bulkStatusDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {bulkStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {statusOptions.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setBulkStatus(o.value);
                        handleBulkStatusChange(o.value);
                        setBulkStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${o.bgClass} ${o.textClass}`}
                      >
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      )}

      {paginatedOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <FolderOpenIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium">Tidak ada pesanan</h3>
          <p className="text-gray-500 mt-1">
            Belum ada pesanan untuk filter ini.
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {paginatedOrders.map((o) => {
              const st =
                statusOptions.find((opt) => opt.value === o.status) ||
                statusOptions[0];
              return (
                <div
                  key={o.id}
                  className="bg-white rounded-lg shadow p-4 border border-slate-200 space-y-3"
                  onClick={() => openDetailModal(o)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {o.order_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bgClass} ${st.textClass}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{o.customer_name}</p>
                    </div>
                    <CustomCheckbox
                      checked={selectedOrders.includes(o.id)}
                      onChange={() =>
                        setSelectedOrders(
                          selectedOrders.includes(o.id)
                            ? selectedOrders.filter((id) => id !== o.id)
                            : [...selectedOrders, o.id]
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">
                        Produk
                      </span>
                      <span className="text-gray-900">{getAssetName(o)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">
                        Total
                      </span>
                      <span className="text-gray-900 font-medium text-sm">
                        {formatCurrency(o.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Tanggal</p>
                      <p className="text-sm text-gray-700">
                        {formatDateSafe(o.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link
                        href={`/invoice/${o.order_number}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(o);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">
                    <CustomCheckbox
                      variant="header"
                      checked={
                        selectedOrders.length === paginatedOrders.length &&
                        paginatedOrders.length > 0
                      }
                      onChange={() =>
                        setSelectedOrders(
                          selectedOrders.length === paginatedOrders.length
                            ? []
                            : paginatedOrders.map((o) => o.id)
                        )
                      }
                    />
                  </th>
                  {[
                    "No. Pesanan",
                    "Pelanggan",
                    "Produk",
                    "Total",
                    "Tanggal",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-6 py-4 font-medium">
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((o) => {
                  const st =
                    statusOptions.find((opt) => opt.value === o.status) ||
                    statusOptions[0];
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-gray-50 transition ${
                        selectedOrders.includes(o.id) ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <CustomCheckbox
                          checked={selectedOrders.includes(o.id)}
                          onChange={() =>
                            setSelectedOrders(
                              selectedOrders.includes(o.id)
                                ? selectedOrders.filter((id) => id !== o.id)
                                : [...selectedOrders, o.id]
                            )
                          }
                        />
                      </td>
                      <td
                        className="px-6 py-4 font-medium text-gray-900 hover:underline cursor-pointer"
                        onClick={() => openDetailModal(o)}
                      >
                        {o.order_number}
                      </td>
                      <td className="px-6 py-4">{o.customer_name}</td>
                      <td className="px-6 py-4">{getAssetName(o)}</td>
                      <td className="px-6 py-4">{formatCurrency(o.price)}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDateSafe(o.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bgClass} ${st.textClass}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/invoice/${o.order_number}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                            title="Invoice"
                          >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => openDetailModal(o)}
                            className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                            title="Detail"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
          <nav className="flex items-center space-x-4">
            <ul className="flex text-sm gap-2">
              <li>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 h-9 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
              </li>
              {getPageNumbers().map((p, i) => (
                <li key={i}>
                  {p === "..." ? (
                    <span className="w-9 h-9 flex items-center justify-center">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-9 h-9 border rounded-lg ${
                        currentPage === p
                          ? "text-primary bg-primary/10 border-primary"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )}
                </li>
              ))}
              <li>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 h-9 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </li>
            </ul>
          </nav>
          <div className="relative" ref={pageDropdownRef}>
            <button
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className="h-9 flex items-center gap-2 px-3 border rounded-lg bg-white hover:bg-gray-50 text-sm"
            >
              <span>{itemsPerPage} halaman</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${
                  pageDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {pageDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border rounded-lg shadow-lg z-20">
                {[10, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setItemsPerPage(v);
                      setPageDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      itemsPerPage === v
                        ? "text-primary font-medium bg-primary/5"
                        : ""
                    }`}
                  >
                    {v} halaman
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl my-8">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Detail Pembelian</h3>
                <p className="text-sm text-gray-500 font-mono">
                  {selectedOrder.order_number}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Pelanggan
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Nama:</span>{" "}
                      {selectedOrder.customer_name}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      {selectedOrder.customer_email}
                    </p>
                    {selectedOrder.customer_whatsapp && (
                      <p>
                        <span className="text-gray-500">WA:</span>{" "}
                        {selectedOrder.customer_whatsapp}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4" /> Produk
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Produk:</span>{" "}
                      {getAssetName(selectedOrder)}
                    </p>
                    <p>
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold">
                        {formatCurrency(selectedOrder.price)}
                      </span>
                    </p>
                    {selectedOrder.discount_code && (
                      <p>
                        <span className="text-gray-500">Diskon:</span>{" "}
                        <span className="text-green-600">
                          {selectedOrder.discount_code} (-
                          {formatCurrency(selectedOrder.discount_amount)})
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold mb-4">Kelola</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      className={inputStyle}
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Link File Final
                    </label>
                    {isEditingDownloadLink ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className={inputStyle}
                          value={downloadLink}
                          onChange={(e) => setDownloadLink(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => setIsEditingDownloadLink(false)}
                          className="px-3 bg-primary text-white rounded-lg"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() =>
                            downloadLink &&
                            window.open(
                              `/file/s/${selectedOrder.order_number}`,
                              "_blank"
                            )
                          }
                          className={`flex-1 flex items-center gap-2 px-3 py-2.5 border rounded-lg overflow-hidden ${
                            downloadLink
                              ? "cursor-pointer hover:bg-gray-50"
                              : ""
                          }`}
                        >
                          {downloadLink ? (
                            <>
                              <FolderOpenIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm truncate">
                                {downloadLink}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Belum ada link
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setIsEditingDownloadLink(true)}
                          className="p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Dibuat
                    </label>
                    <input
                      type="text"
                      className={`${inputStyle} bg-gray-50`}
                      value={formatDateFull(selectedOrder.created_at)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-between gap-3 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                {selectedOrder?.status === "completed" && (
                  <button
                    onClick={async () => {
                      if (!selectedOrder) return;
                      try {
                        const now = new Date();
                        const expiresAt = new Date(
                          now.getTime() + 7 * 24 * 60 * 60 * 1000
                        ); // 7 days

                        // Update testimonials dengan set timestamps
                        const { data: testimonials, error: fetchError } =
                          await supabase
                            .from("testimonials")
                            .select("id")
                            .eq("store_order_id", selectedOrder.id)
                            .maybeSingle();

                        if (fetchError) throw fetchError;

                        if (testimonials) {
                          // Update existing testimonial
                          const { error: updateError } = await supabase
                            .from("testimonials")
                            .update({
                              review_link_generated_at: now.toISOString(),
                              review_link_expires_at: expiresAt.toISOString(),
                            })
                            .eq("id", testimonials.id);

                          if (updateError) throw updateError;
                        } else {
                          // Create new testimonial with tracking
                          const { error: insertError } = await supabase
                            .from("testimonials")
                            .insert({
                              store_order_id: selectedOrder.id,
                              customer_name: selectedOrder.customer_name,
                              customer_email: selectedOrder.customer_email,
                              rating_service: 5,
                              rating_design: 5,
                              rating_communication: 5,
                              is_featured: false,
                              review_link_generated_at: now.toISOString(),
                              review_link_expires_at: expiresAt.toISOString(),
                            });

                          if (insertError) throw insertError;
                        }

                        // Copy link
                        const link = `${window.location.origin}/review/${selectedOrder.order_number}`;
                        await navigator.clipboard.writeText(link);

                        showAlert(
                          "success",
                          "Berhasil",
                          `Link testimoni disalin! Link berlaku selama 7 hari.`
                        );

                        // Refresh orders
                        await fetchOrders();
                      } catch (error: any) {
                        console.error(
                          "Error generating testimonial link:",
                          error
                        );
                        console.error("Full error details:", {
                          message: error.message,
                          status: error.status,
                          statusCode: error.statusCode,
                          details: error.details,
                        });
                        showAlert(
                          "error",
                          "Gagal",
                          error.message || "Gagal generate link testimoni."
                        );
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                    Minta Testimoni
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" /> Hapus
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 border rounded-lg bg-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
