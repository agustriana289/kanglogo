"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Order } from "@/types/order";
import { Service, ServicePackage } from "@/types/service";
import LogoLoading from "@/components/LogoLoading";
import {
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  PlusIcon,
  UserIcon,
  ShoppingBagIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { format, addDays, isBefore } from "date-fns";
import { id } from "date-fns/locale";
import { createOrderStatusNotification, createOrderDeletedNotification } from "@/lib/notifications";

// ... constants ...
const statusOptions = [
  {
    value: "pending_payment",
    label: "Belum Dibayar",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/20",
    textClass: "text-yellow-800 dark:text-yellow-400",
  },
  {
    value: "paid",
    label: "Dibayar",
    bgClass: "bg-blue-100 dark:bg-blue-900/20",
    textClass: "text-blue-800 dark:text-blue-400",
  },
  {
    value: "accepted",
    label: "Diterima",
    bgClass: "bg-purple-100 dark:bg-purple-900/20",
    textClass: "text-purple-800 dark:text-purple-400",
  },
  {
    value: "in_progress",
    label: "Dikerjakan",
    bgClass: "bg-orange-100 dark:bg-orange-900/20",
    textClass: "text-orange-800 dark:text-orange-400",
  },
  {
    value: "completed",
    label: "Selesai",
    bgClass: "bg-green-100 dark:bg-green-900/20",
    textClass: "text-green-800 dark:text-green-400",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    bgClass: "bg-red-100 dark:bg-red-900/20",
    textClass: "text-red-800 dark:text-red-400",
  },
];

const ITEMS_PER_PAGE = 10;

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();

  // UI States
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order | "customer";
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(""); // For bulk action dropdown
  const [showMobileStats, setShowMobileStats] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    overdue: 0,
    dueIn30Days: 0,
    avgTimePaid: 0,
    upcomingPayout: 0,
  });

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit/Detail States
  const [editedStatus, setEditedStatus] = useState("");
  const [finalFileLink, setFinalFileLink] = useState("");
  const [editedCreatedAt, setEditedCreatedAt] = useState("");
  const [editedPaymentDeadline, setEditedPaymentDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  // Create Order States
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_email: "",
    customer_whatsapp: "",
    package_name: "",
    final_price: 0,
    payment_method: "Bank Transfer",
    discount_code: "",
    discount_amount: 0,
  });
  const [creating, setCreating] = useState(false);
  const [isCustomService, setIsCustomService] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState("");

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("title", { ascending: true });

    if (!error && data) {
      setServices(data);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      showAlert("error", "Error", "Gagal memuat pesanan");
    } else {
      const ordersData = data || [];
      setOrders(ordersData);
      calculateStats(ordersData);
    }
    setLoading(false);
  };

  const calculateStats = (data: Order[]) => {
    const now = new Date();
    let overdue = 0;
    let dueIn30Days = 0;
    let upcomingPayout = 0;

    data.forEach((order) => {
      // Assuming 'final_price' is revenue
      if (order.status === "pending_payment") {
        upcomingPayout += order.final_price;
        if (order.payment_deadline) {
          const deadline = new Date(order.payment_deadline);
          if (isBefore(deadline, now)) {
            overdue += order.final_price;
          } else if (isBefore(deadline, addDays(now, 30))) {
            dueIn30Days += order.final_price;
          }
        }
      }
    });

    setStats({
      overdue,
      dueIn30Days,
      upcomingPayout,
      avgTimePaid: 24, // Hardcoded placeholder
    });
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    // Status Filter (Tab)
    if (filterStatus !== "Semua") {
      if (filterStatus === "Belum Dibayar" && order.status !== "pending_payment")
        return false;
      if (
        filterStatus === "Lunas" &&
        order.status !== "paid" &&
        order.status !== "completed" &&
        order.status !== "accepted"
      )
        return false;
    }

    // Advanced Filters
    if (
      filterPackage &&
      !order.package_details.name
        .toLowerCase()
        .includes(filterPackage.toLowerCase())
    )
      return false;
    if (
      filterCustomer &&
      !order.customer_name.toLowerCase().includes(filterCustomer.toLowerCase())
    )
      return false;

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.invoice_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_email.toLowerCase().includes(q) ||
        (order.package_details &&
          order.package_details.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sorting Logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const key = sortConfig.key === "customer" ? "customer_name" : sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: keyof Order | "customer") => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateSafe = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd MMM yyyy", { locale: id });
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setEditedStatus(order.status);
    setFinalFileLink(order.final_file_link || "");
    // Format dates for input type="date" (YYYY-MM-DD)
    setEditedCreatedAt(order.created_at ? order.created_at.split('T')[0] : "");
    setEditedPaymentDeadline(order.payment_deadline ? order.payment_deadline.split('T')[0] : "");
    setShowDetailModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: editedStatus,
          final_file_link: finalFileLink || null,
          created_at: editedCreatedAt ? new Date(editedCreatedAt).toISOString() : selectedOrder.created_at,
          payment_deadline: editedPaymentDeadline ? new Date(editedPaymentDeadline).toISOString() : null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Send notification if status changed
      if (editedStatus !== selectedOrder.status) {
        await createOrderStatusNotification(selectedOrder.id, editedStatus);
      }

      showAlert("success", "Sukses", "Pesanan berhasil diperbarui!");
      fetchOrders();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error("Error:", error);
      showAlert("error", "Gagal", error.message || "Gagal memperbarui pesanan");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name || !newOrder.final_price) {
      showAlert("error", "Validasi Gagal", "Nama pelanggan dan total harga wajib diisi");
      return;
    }
    setCreating(true);
    try {
      const dateStr = format(new Date(), "yyyyMMdd");
      const randomStr = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const invoiceNum = `INV-${dateStr}-${randomStr}`;

      const { error } = await supabase.from("orders").insert({
        invoice_number: invoiceNum,
        service_id: isCustomService ? null : selectedServiceId,
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_whatsapp: newOrder.customer_whatsapp,
        final_price: newOrder.final_price - newOrder.discount_amount,
        discount_code: newOrder.discount_code || null,
        discount_amount: newOrder.discount_amount || 0,
        package_details: selectedPackage ? {
          name: selectedPackage.name,
          finalPrice: selectedPackage.finalPrice,
          duration: selectedPackage.duration,
          features: selectedPackage.features || [],
        } : {
          name: newOrder.package_name || "Custom Service",
          finalPrice: String(newOrder.final_price),
          duration: "7 hari",
          features: [],
        },
        payment_method: newOrder.payment_method,
        status: "pending_payment",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Show success modal
      setCreatedInvoice(invoiceNum);
      setShowCreateModal(false);
      setShowSuccessModal(true);
      fetchOrders();

      // Reset form
      setSelectedServiceId(null);
      setSelectedPackage(null);
      setIsCustomService(false);
      setNewOrder({
        customer_name: "",
        customer_email: "",
        customer_whatsapp: "",
        package_name: "",
        final_price: 0,
        payment_method: "Bank Transfer",
        discount_code: "",
        discount_amount: 0,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      showAlert("error", "Gagal", "Gagal membuat invoice");
    } finally {
      setCreating(false);
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;

    // Check if all selected orders are cancelled
    const nonCancelled = orders.filter(o => selectedOrders.includes(o.id) && o.status !== 'cancelled');
    if (nonCancelled.length > 0) {
      showAlert("error", "Hapus Gagal", "Hanya pesanan dengan status 'Dibatalkan' yang dapat dihapus.");
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
      const { error } = await supabase.from('orders').delete().in('id', selectedOrders);
      if (error) throw error;

      showAlert("success", "Berhasil", `${selectedOrders.length} pesanan berhasil dihapus`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error(error);
      showAlert("error", "Gagal", "Gagal menghapus pesanan");
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedOrders.length === 0) return;

    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).in('id', selectedOrders);
      if (error) throw error;

      showAlert("success", "Berhasil", `Status ${selectedOrders.length} pesanan berhasil diperbarui`);
      setBulkStatus(""); // Reset select
      setSelectedOrders([]); // Optional: Keep selected or clear? Usually nice to clear.
      fetchOrders();
    } catch (error) {
      console.error(error);
      showAlert("error", "Gagal", "Gagal memperbarui status");
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <LogoLoading />
      </div>
    );

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Overview Stats */}
      {/* Overview Stats */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="sm:mb-6 flex items-center justify-between">
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-500 hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-primary hover:bg-primary/80"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Buat Invoice Baru</span>
            <span className="sm:hidden">Baru</span>
          </button>
        </div>
        <div
          className={`${showMobileStats ? "grid" : "hidden"
            } grid-cols-1 rounded-xl border border-gray-200 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0 dark:divide-gray-800 dark:border-gray-800`}
        >
          <div className="border-b p-5 sm:border-r lg:border-b-0">
            <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
              Terlewat Jatuh Tempo
            </p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(stats.overdue)}
            </h3>
          </div>
          <div className="border-b p-5 lg:border-b-0">
            <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
              Jatuh Tempo 30 Hari
            </p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(stats.dueIn30Days)}
            </h3>
          </div>
          <div className="border-b p-5 sm:border-r sm:border-b-0">
            <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
              Rata-rata Waktu Bayar
            </p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {stats.avgTimePaid} hari
            </h3>
          </div>
          <div className="p-5">
            <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">
              Estimasi Pemasukan
            </p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(stats.upcomingPayout)}
            </h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daftar Invoice
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Semua transaksi pesanan Anda
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
            {/* Search & Filter Button */}
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari invoice, nama..."
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
                        Paket
                      </label>
                      <input
                        type="text"
                        value={filterPackage}
                        onChange={(e) => setFilterPackage(e.target.value)}
                        placeholder="Filter paket..."
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

        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-5 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-800 transition-all animation-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-bg-primary dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedOrders.length} item dipilih
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={bulkStatus}
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value);
                  }
                }}
              >
                <option value="">Ubah Status...</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <TrashIcon className="w-4 h-4" /> Hapus
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {/* Mobile Card View */}
        <div className="mt-4 sm:mt-0 block sm:hidden space-y-4 px-4 pb-4">
          {paginatedOrders.map((order) => {
            const statusOpt =
              statusOptions.find((opt) => opt.value === order.status) ||
              statusOptions[0];
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
                        {order.invoice_number}
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
                  {/* Checkbox for Bulk Actions */}
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-bg-primary focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                    checked={selectedOrders.includes(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      if (selectedOrders.includes(order.id))
                        setSelectedOrders(
                          selectedOrders.filter((id) => id !== order.id)
                        );
                      else setSelectedOrders([...selectedOrders, order.id]);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                      Tanggal
                    </span>
                    {formatDateSafe(order.created_at)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                      Total
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium text-sm">
                      {formatCurrency(order.final_price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Desktop Table View */}
        <div className="hidden sm:block custom-scrollbar overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 whitespace-nowrap min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-bg-primary focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:ring-offset-slate-800"
                        checked={
                          selectedOrders.length === paginatedOrders.length &&
                          paginatedOrders.length > 0
                        }
                        onChange={() => {
                          if (selectedOrders.length === paginatedOrders.length)
                            setSelectedOrders([]);
                          else
                            setSelectedOrders(paginatedOrders.map((o) => o.id));
                        }}
                      />
                    </label>
                    <span
                      className="text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                      onClick={() => handleSort("invoice_number")}
                    >
                      No. Invoice
                    </span>
                  </div>
                </th>
                <th
                  className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("customer")}
                >
                  Pelanggan
                </th>
                <th
                  className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("created_at")}
                >
                  Tanggal Dibuat
                </th>
                <th
                  className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("payment_deadline")}
                >
                  Jatuh Tempo
                </th>
                <th
                  className="p-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("final_price")}
                >
                  Total
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
              {paginatedOrders.map((order) => {
                const statusOpt =
                  statusOptions.find((opt) => opt.value === order.status) ||
                  statusOptions[0];
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
                              setSelectedOrders(
                                selectedOrders.filter((id) => id !== order.id)
                              );
                            else setSelectedOrders([...selectedOrders, order.id]);
                          }}
                        />
                        <span
                          className="text-sm font-medium text-gray-900 dark:text-white hover:underline cursor-pointer"
                          onClick={() => openDetailModal(order)}
                        >
                          {order.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {order.customer_name}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateSafe(order.created_at)}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateSafe(
                        order.payment_deadline || order.work_deadline
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(order.final_price)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOpt.bgClass} ${statusOpt.textClass}`}
                      >
                        {statusOpt.label}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/order/${order.invoice_number}`}
                          target="_blank"
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          Buka
                        </Link>
                        <button
                          onClick={() => openDetailModal(order)}
                          className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between border-t border-gray-200 px-5 py-4 sm:flex-row dark:border-gray-800 gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            sampai{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedOrders.length)}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {sortedOrders.length}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
              )
              .map((page) => {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === page
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div >

      {/* Detail Modal */}
      {
        showDetailModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detail Pesanan
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.invoice_number}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" /> Info Pelanggan
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        <span className="text-gray-400">Nama:</span>{" "}
                        {selectedOrder.customer_name}
                      </p>
                      <p>
                        <span className="text-gray-400">Email:</span>{" "}
                        {selectedOrder.customer_email}
                      </p>
                      <p>
                        <span className="text-gray-400">WhatsApp:</span>{" "}
                        {selectedOrder.customer_whatsapp}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ShoppingBagIcon className="w-4 h-4" /> Info Paket
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        <span className="text-gray-400">Paket:</span>{" "}
                        {selectedOrder.package_details.name}
                      </p>
                      <p>
                        <span className="text-gray-400">Total:</span>{" "}
                        {formatCurrency(selectedOrder.final_price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Kelola Status
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select // This inputs was requested to be consistent
                        className={inputStyle}
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Link File Final
                      </label>
                      <input
                        type="text"
                        className={inputStyle}
                        placeholder="https://..."
                        value={finalFileLink}
                        onChange={(e) => setFinalFileLink(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tanggal Dibuat
                      </label>
                      <input
                        type="date"
                        className={inputStyle}
                        value={editedCreatedAt}
                        onChange={(e) => setEditedCreatedAt(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Jatuh Tempo
                      </label>
                      <input
                        type="date"
                        className={inputStyle}
                        value={editedPaymentDeadline}
                        onChange={(e) => setEditedPaymentDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  onClick={async () => {
                    if (!selectedOrder) return;
                    if (selectedOrder.status !== 'cancelled') {
                      showAlert("error", "Gagal", "Hanya pesanan dengan status 'Dibatalkan' yang dapat dihapus");
                      return;
                    }

                    const confirmed = await showConfirm(
                      "Hapus Pesanan",
                      "Apakah Anda yakin ingin menghapus pesanan ini secara permanen?",
                      "error",
                      "Hapus Permanen"
                    );
                    if (!confirmed) return;

                    try {
                      const { error } = await supabase.from('orders').delete().eq('id', selectedOrder.id);
                      if (error) throw error;

                      // Send delete notification
                      await createOrderDeletedNotification(
                        selectedOrder.invoice_number,
                        selectedOrder.customer_name
                      );

                      showAlert("success", "Berhasil", "Pesanan berhasil dihapus");
                      setShowDetailModal(false);
                      fetchOrders();
                    } catch (err) {
                      console.error(err);
                      showAlert("error", "Gagal", "Gagal menghapus pesanan");
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Hapus Pesanan
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Order Modal - with Styled Inputs */}
      {
        showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Buat Invoice Baru
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={newOrder.customer_name}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, customer_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className={inputStyle}
                    value={newOrder.customer_email}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, customer_email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={newOrder.customer_whatsapp}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, customer_whatsapp: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Layanan
                  </label>
                  <select
                    className={inputStyle}
                    value={isCustomService ? "custom" : (selectedServiceId || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomService(true);
                        setSelectedServiceId(null);
                        setSelectedPackage(null);
                      } else {
                        setIsCustomService(false);
                        const sId = Number(val);
                        setSelectedServiceId(sId || null);
                        setSelectedPackage(null);
                        setNewOrder({ ...newOrder, package_name: "", final_price: 0 });
                      }
                    }}
                  >
                    <option value="">Pilih Layanan</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.title}
                      </option>
                    ))}
                    <option value="custom">Custom (Layanan Khusus)</option>
                  </select>
                </div>
                {isCustomService ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nama Layanan/Paket Custom
                      </label>
                      <input
                        type="text"
                        className={inputStyle}
                        placeholder="Masukkan nama layanan..."
                        value={newOrder.package_name}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, package_name: e.target.value })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paket
                    </label>
                    <select
                      className={inputStyle}
                      value={newOrder.package_name}
                      onChange={(e) => {
                        const pkgName = e.target.value;
                        const selectedSvc = services.find(s => s.id === selectedServiceId);
                        const pkg = selectedSvc?.packages?.find((p: ServicePackage) => p.name === pkgName);
                        setSelectedPackage(pkg || null);
                        setNewOrder({
                          ...newOrder,
                          package_name: pkgName,
                          final_price: pkg ? parseInt(pkg.finalPrice.replace(/\D/g, '')) : 0,
                        });
                      }}
                      disabled={!selectedServiceId}
                    >
                      <option value="">Pilih Paket</option>
                      {selectedServiceId && services.find(s => s.id === selectedServiceId)?.packages?.map((pkg: ServicePackage, idx: number) => (
                        <option key={idx} value={pkg.name}>
                          {pkg.name} - {pkg.finalPrice}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Harga (Rp)
                  </label>
                  <input
                    type="number"
                    className={inputStyle}
                    value={newOrder.final_price}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        final_price: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kode Diskon
                    </label>
                    <input
                      type="text"
                      className={inputStyle}
                      placeholder="Opsional"
                      value={newOrder.discount_code}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, discount_code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Potongan (Rp)
                    </label>
                    <input
                      type="number"
                      className={inputStyle}
                      placeholder="0"
                      value={newOrder.discount_amount}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, discount_amount: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                {newOrder.discount_amount > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                    <span className="text-green-700 dark:text-green-400">
                      Total Setelah Diskon: <strong>{formatCurrency(newOrder.final_price - newOrder.discount_amount)}</strong>
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50"
                >
                  {creating ? "Membuat..." : "Buat Invoice"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Invoice Berhasil Dibuat!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nomor Invoice:
              </p>
              <p className="text-2xl font-mono font-bold text-primary mb-6">
                {createdInvoice}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    const order = orders.find(o => o.invoice_number === createdInvoice);
                    if (order) openDetailModal(order);
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80"
                >
                  Lihat Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
