"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAlert } from "@/components/providers/AlertProvider";
import { Order } from "@/types/order";
import { Service, ServicePackage } from "@/types/service";
import LogoPathAnimation from "@/components/LogoPathAnimation";
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
  LinkIcon,
  FolderOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { format, addDays, isBefore } from "date-fns";
import { id } from "date-fns/locale";
import {
  createOrderStatusNotification,
  createOrderDeletedNotification,
} from "@/lib/notifications";

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [bulkStatusDropdownOpen, setBulkStatusDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const bulkStatusDropdownRef = useRef<HTMLDivElement>(null);

  // Stats
  const [stats, setStats] = useState({
    unpaid: 0,
    incomeThisMonth: 0,
    incomeThisYear: 0,
    totalIncome: 0,
  });

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit/Detail States
  const [editedStatus, setEditedStatus] = useState("");
  const [finalFileLink, setFinalFileLink] = useState("");
  const [isEditingFileLink, setIsEditingFileLink] = useState(false);
  const [editedCreatedAt, setEditedCreatedAt] = useState("");
  const [editedPaymentDeadline, setEditedPaymentDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestingTestimonial, setRequestingTestimonial] = useState(false);
  const [testimonialLink, setTestimonialLink] = useState<string | null>(null);

  // Edit Mode States
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedCustomerName, setEditedCustomerName] = useState("");
  const [editedCustomerEmail, setEditedCustomerEmail] = useState("");
  const [editedCustomerWhatsapp, setEditedCustomerWhatsapp] = useState("");
  const [editedServiceId, setEditedServiceId] = useState<number | null>(null);
  const [editedPackageDetails, setEditedPackageDetails] = useState<any>(null);
  const [editedFinalPrice, setEditedFinalPrice] = useState(0);
  const [editedDiscountCode, setEditedDiscountCode] = useState("");
  const [editedDiscountAmount, setEditedDiscountAmount] = useState(0);
  const [isEditingCustomService, setIsEditingCustomService] = useState(false);
  const [editedCustomPackageName, setEditedCustomPackageName] = useState("");

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
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(
    null
  );

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });
    if (data) setServices(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          services (
            id,
            title,
            slug
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      const ordersData = data || [];
      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showAlert("error", "Error", "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchOrders();
    fetchServices();
  }, [fetchOrders, fetchServices]);

  const calculateStats = (data: Order[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let unpaid = 0;
    let incomeThisMonth = 0;
    let incomeThisYear = 0;
    let totalIncome = 0;

    data.forEach((order) => {
      // Hitung Belum Dibayar (status pending_payment)
      if (order.status === "pending_payment") {
        unpaid += order.final_price;
      }

      // Hitung Penghasilan (status paid, accepted, completed, in_progress - asumsi uang masuk saat paid)
      // Kita gunakan status 'paid' dan status lanjutannya ('in_progress', 'completed', 'accepted')
      if (
        ["paid", "accepted", "in_progress", "completed"].includes(order.status)
      ) {
        totalIncome += order.final_price;

        const orderDate = new Date(order.created_at);

        // Income This Month
        if (
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        ) {
          incomeThisMonth += order.final_price;
        }

        // Income This Year
        if (orderDate.getFullYear() === currentYear) {
          incomeThisYear += order.final_price;
        }
      }
    });

    setStats({
      unpaid,
      incomeThisMonth,
      incomeThisYear,
      totalIncome,
    });
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    // Status Filter (Tab)
    if (filterStatus !== "Semua") {
      if (
        filterStatus === "Belum Dibayar" &&
        order.status !== "pending_payment"
      )
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
    const key =
      sortConfig.key === "customer" ? "customer_name" : sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!pageDropdownOpen && !bulkStatusDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pageDropdownOpen &&
        pageDropdownRef.current &&
        !pageDropdownRef.current.contains(event.target as Node)
      ) {
        setPageDropdownOpen(false);
      }
      if (
        bulkStatusDropdownOpen &&
        bulkStatusDropdownRef.current &&
        !bulkStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setBulkStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pageDropdownOpen, bulkStatusDropdownOpen]);

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
    setIsEditingFileLink(false);
    // Format dates for input type="date" (YYYY-MM-DD)
    setEditedCreatedAt(order.created_at ? order.created_at.split("T")[0] : "");
    setEditedPaymentDeadline(
      order.payment_deadline ? order.payment_deadline.split("T")[0] : ""
    );

    // Set edit mode states
    setIsEditingDetails(false);
    setEditedCustomerName(order.customer_name);
    setEditedCustomerEmail(order.customer_email);
    setEditedCustomerWhatsapp(order.customer_whatsapp);
    setEditedServiceId(order.service_id);
    setEditedPackageDetails(order.package_details);
    setEditedFinalPrice(order.final_price);
    setEditedDiscountCode(order.discount_code || "");
    setEditedDiscountAmount(order.discount_amount || 0);
    setIsEditingCustomService(false);
    setEditedCustomPackageName(order.package_details?.name || "");

    setShowDetailModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const updateData: any = {
        status: editedStatus,
        final_file_link: finalFileLink || null,
        created_at: editedCreatedAt
          ? new Date(editedCreatedAt).toISOString()
          : selectedOrder.created_at,
        payment_deadline: editedPaymentDeadline
          ? new Date(editedPaymentDeadline).toISOString()
          : null,
      };

      // Add edited fields if in edit mode
      if (isEditingDetails) {
        updateData.customer_name = editedCustomerName;
        updateData.customer_email = editedCustomerEmail;
        updateData.customer_whatsapp = editedCustomerWhatsapp;
        updateData.service_id = editedServiceId;

        // Handle custom service
        if (isEditingCustomService) {
          updateData.package_details = {
            name: editedCustomPackageName,
            price: editedFinalPrice,
            features: [],
          };
        } else {
          updateData.package_details = editedPackageDetails;
        }

        updateData.final_price = editedFinalPrice;
        updateData.discount_code = editedDiscountCode || null;
        updateData.discount_amount = editedDiscountAmount || 0;
      }

      console.log("Updating order dengan data:", updateData);
      console.log("finalFileLink current value:", finalFileLink);

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", selectedOrder.id);

      if (error) throw error;
      console.log("Order update berhasil");

      // Send notification if status changed
      if (editedStatus !== selectedOrder.status) {
        await createOrderStatusNotification(selectedOrder.id, editedStatus);
      }

      showAlert("success", "Sukses", "Pesanan berhasil diperbarui!");
      setIsEditingDetails(false);
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
      showAlert(
        "error",
        "Validasi Gagal",
        "Nama pelanggan dan total harga wajib diisi"
      );
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
        package_details: selectedPackage
          ? {
              name: selectedPackage.name,
              finalPrice: selectedPackage.finalPrice,
              duration: selectedPackage.duration,
              features: selectedPackage.features || [],
            }
          : {
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
    const nonCancelled = orders.filter(
      (o) => selectedOrders.includes(o.id) && o.status !== "cancelled"
    );
    if (nonCancelled.length > 0) {
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
        .from("orders")
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
      console.error(error);
      showAlert("error", "Gagal", "Gagal menghapus pesanan");
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedOrders.length === 0) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .in("id", selectedOrders);
      if (error) throw error;

      showAlert(
        "success",
        "Berhasil",
        `Status ${selectedOrders.length} pesanan berhasil diperbarui`
      );
      setBulkStatus(""); // Reset select
      setSelectedOrders([]); // Optional: Keep selected or clear? Usually nice to clear.
      fetchOrders();
    } catch (error) {
      console.error(error);
      showAlert("error", "Gagal", "Gagal memperbarui status");
    }
  };

  // Custom checkbox component with Heroicons (sama seperti di admin testimoni)
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

  // Generate page numbers with ellipsis (sama seperti di admin testimoni)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
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
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white dark:bg-slate-900">
        <LogoPathAnimation />
      </div>
    );

  const inputStyle =
    "bg-white dark:bg-slate-900 shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30";

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Overview Stats */}

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">Belum Dibayar</p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(stats.unpaid)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">
            Penghasilan Bulan Ini
          </p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(stats.incomeThisMonth)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">
            Penghasilan Tahun Ini
          </p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(stats.incomeThisYear)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-slate-500 text-sm font-medium">
            Total Penghasilan
          </p>
          <div className="flex items-end justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(stats.totalIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Tabs */}
          <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
            {["Semua", "Belum Dibayar", "Lunas"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
                className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${
                  filterStatus === status
                    ? "shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Right: Search, Filter, and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari invoice, nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="flex flex-row gap-3">
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="h-11 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
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

              {/* Add Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Invoice Baru</span>
                <span className="sm:hidden">Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="hidden sm:inline font-medium text-primary">
            {selectedOrders.length} pesanan dipilih
          </span>
          <div className="flex gap-2">
            {/* Custom Bulk Status Dropdown */}
            <div className="relative" ref={bulkStatusDropdownRef}>
              <button
                onClick={() =>
                  setBulkStatusDropdownOpen(!bulkStatusDropdownOpen)
                }
                className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-slate-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-300">
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
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setBulkStatus(option.value);
                        handleBulkStatusChange(option.value);
                        setBulkStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${option.bgClass} ${option.textClass}`}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {paginatedOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tidak ada pesanan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Belum ada pesanan untuk filter ini.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
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

                    <CustomCheckbox
                      checked={selectedOrders.includes(order.id)}
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
                      <span className="text-gray-900 font-medium text-sm">
                        {formatCurrency(order.final_price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">
                        Jatuh Tempo
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatDateSafe(
                          order.payment_deadline || order.work_deadline
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link
                        href={`/invoice/${order.invoice_number}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => openDetailModal(order)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead className="bg-primary text-white font-medium">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">
                      <CustomCheckbox
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
                        variant="header"
                      />
                    </th>
                    <th className="px-6 py-4">No. Invoice</th>
                    <th
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleSort("customer")}
                    >
                      Pelanggan
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      Tanggal Dibuat
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleSort("payment_deadline")}
                    >
                      Jatuh Tempo
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleSort("final_price")}
                    >
                      Total
                    </th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
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
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${
                          selectedOrders.includes(order.id)
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <CustomCheckbox
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => {
                              if (selectedOrders.includes(order.id))
                                setSelectedOrders(
                                  selectedOrders.filter((id) => id !== order.id)
                                );
                              else
                                setSelectedOrders([
                                  ...selectedOrders,
                                  order.id,
                                ]);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-sm font-medium text-gray-900 dark:text-white hover:underline cursor-pointer"
                            onClick={() => openDetailModal(order)}
                          >
                            {order.invoice_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDateSafe(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDateSafe(
                            order.payment_deadline || order.work_deadline
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(order.final_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOpt.bgClass} ${statusOpt.textClass}`}
                          >
                            {statusOpt.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/invoice/${order.invoice_number}`}
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Buka Invoice"
                            >
                              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => openDetailModal(order)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
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
          </div>
        </>
      )}

      {/* Pagination */}
      {sortedOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
          <nav
            aria-label="Page navigation"
            className="flex items-center space-x-4"
          >
            <ul className="flex -space-x-px text-sm gap-2">
              <li>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading shadow-xs font-medium leading-5 rounded-s-base text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  Sebelumnya
                </button>
              </li>
              {getPageNumbers().map((page, idx) => (
                <li key={idx}>
                  {page === "..." ? (
                    <span className="flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium shadow-xs font-medium leading-5 text-sm w-9 h-9 rounded-lg">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${
                        currentPage === page
                          ? "text-fg-brand bg-neutral-tertiary-medium border-default-medium"
                          : "text-body bg-neutral-secondary-medium border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading"
                      }`}
                    >
                      {page}
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
              <span className="text-gray-700 dark:text-gray-300">
                {itemsPerPage} halaman
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  pageDropdownOpen ? "rotate-180" : ""
                }`}
              />
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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      itemsPerPage === value
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

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingDetails(!isEditingDetails)}
                  className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition flex items-center gap-1.5"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  {isEditingDetails ? "Batal Edit" : "Edit Detail"}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Info Pelanggan
                  </h4>
                  {isEditingDetails ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Nama
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedCustomerName}
                          onChange={(e) =>
                            setEditedCustomerName(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedCustomerEmail}
                          onChange={(e) =>
                            setEditedCustomerEmail(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedCustomerWhatsapp}
                          onChange={(e) =>
                            setEditedCustomerWhatsapp(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ShoppingBagIcon className="w-4 h-4" /> Info Paket
                  </h4>
                  {isEditingDetails ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Layanan
                        </label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={
                            isEditingCustomService
                              ? "custom"
                              : editedServiceId || ""
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setIsEditingCustomService(true);
                              setEditedServiceId(null);
                              setEditedPackageDetails(null);
                            } else {
                              setIsEditingCustomService(false);
                              const serviceId = Number(e.target.value);
                              setEditedServiceId(serviceId);
                              const service = services.find(
                                (s) => s.id === serviceId
                              );
                              if (
                                service &&
                                service.packages &&
                                service.packages.length > 0
                              ) {
                                setEditedPackageDetails(service.packages[0]);
                                setEditedFinalPrice(
                                  Number(service.packages[0].finalPrice)
                                );
                              }
                            }
                          }}
                        >
                          <option value="">Pilih Layanan</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                          <option value="custom">
                            Custom (Layanan Khusus)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Paket
                        </label>
                        {isEditingCustomService ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editedCustomPackageName}
                            onChange={(e) =>
                              setEditedCustomPackageName(e.target.value)
                            }
                            placeholder="Masukkan nama paket custom"
                          />
                        ) : (
                          <select
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editedPackageDetails?.name || ""}
                            onChange={(e) => {
                              const service = services.find(
                                (s) => s.id === editedServiceId
                              );
                              const pkg = service?.packages?.find(
                                (p) => p.name === e.target.value
                              );
                              if (pkg) {
                                setEditedPackageDetails(pkg);
                                setEditedFinalPrice(Number(pkg.finalPrice));
                              }
                            }}
                            disabled={!editedServiceId}
                          >
                            <option value="">Pilih Paket</option>
                            {services
                              .find((s) => s.id === editedServiceId)
                              ?.packages?.map((pkg) => (
                                <option key={pkg.name} value={pkg.name}>
                                  {pkg.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Harga Final
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedFinalPrice}
                          onChange={(e) =>
                            setEditedFinalPrice(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Kode Diskon
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedDiscountCode}
                          onChange={(e) =>
                            setEditedDiscountCode(e.target.value)
                          }
                          placeholder="Opsional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Jumlah Diskon
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value={editedDiscountAmount}
                          onChange={(e) =>
                            setEditedDiscountAmount(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        <span className="text-gray-400">Paket:</span>{" "}
                        {selectedOrder.package_details.name}
                      </p>
                      <p>
                        <span className="text-gray-400">Total:</span>{" "}
                        {formatCurrency(selectedOrder.final_price)}
                      </p>
                      {selectedOrder.discount_code && (
                        <p>
                          <span className="text-gray-400">Diskon:</span>{" "}
                          {selectedOrder.discount_code} (-
                          {formatCurrency(selectedOrder.discount_amount || 0)})
                        </p>
                      )}
                    </div>
                  )}
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
                    {isEditingFileLink ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className={inputStyle}
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={finalFileLink}
                          onChange={(e) => {
                            console.log(
                              "Changing finalFileLink from:",
                              finalFileLink,
                              "to:",
                              e.target.value
                            );
                            setFinalFileLink(e.target.value);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            console.log(
                              "Closing edit mode. finalFileLink is now:",
                              finalFileLink
                            );
                            setIsEditingFileLink(false);
                          }}
                          className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 flex-shrink-0"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() =>
                            finalFileLink &&
                            window.open(
                              `/file/o/${selectedOrder?.invoice_number}`,
                              "_blank"
                            )
                          }
                          className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 overflow-hidden ${
                            finalFileLink
                              ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                              : ""
                          }`}
                        >
                          {finalFileLink ? (
                            <>
                              <FolderOpenIcon className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-sm text-gray-800 dark:text-white/90 truncate">
                                {finalFileLink}
                              </span>
                              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-white/30">
                              Belum ada link
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingFileLink(true)}
                          className="p-2 text-gray-500 hover:text-primary bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 flex-shrink-0"
                          title="Edit Link"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-between gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
              {/* Left side - Minta Testimoni for completed orders */}
              <div>
                {selectedOrder?.status === "completed" && (
                  <button
                    onClick={async () => {
                      if (!selectedOrder) return;
                      setRequestingTestimonial(true);
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
                            .eq("order_id", selectedOrder.id)
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
                              order_id: selectedOrder.id,
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
                        const link = `${window.location.origin}/review/${selectedOrder.invoice_number}`;
                        await navigator.clipboard.writeText(link);

                        showAlert(
                          "success",
                          "Berhasil",
                          `Link testimoni disalin! Link berlaku selama 7 hari.`
                        );

                        // Refresh orders untuk update state
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
                      } finally {
                        setRequestingTestimonial(false);
                      }
                    }}
                    disabled={requestingTestimonial}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                    {requestingTestimonial ? "Memproses..." : "Minta Testimoni"}
                  </button>
                )}
              </div>

              {/* Right side - Action buttons */}
              <div className="flex gap-3">
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
                    if (selectedOrder.status !== "cancelled") {
                      showAlert(
                        "error",
                        "Gagal",
                        "Hanya pesanan dengan status 'Dibatalkan' yang dapat dihapus"
                      );
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
                      const { error } = await supabase
                        .from("orders")
                        .delete()
                        .eq("id", selectedOrder.id);
                      if (error) throw error;

                      // Send delete notification
                      await createOrderDeletedNotification(
                        selectedOrder.invoice_number,
                        selectedOrder.customer_name
                      );

                      showAlert(
                        "success",
                        "Berhasil",
                        "Pesanan berhasil dihapus"
                      );
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
        </div>
      )}

      {/* Create Order Modal - with Styled Inputs */}
      {showCreateModal && (
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
                    setNewOrder({
                      ...newOrder,
                      customer_whatsapp: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Layanan
                </label>
                <select
                  className={inputStyle}
                  value={isCustomService ? "custom" : selectedServiceId || ""}
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
                      setNewOrder({
                        ...newOrder,
                        package_name: "",
                        final_price: 0,
                      });
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
                        setNewOrder({
                          ...newOrder,
                          package_name: e.target.value,
                        })
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
                      const selectedSvc = services.find(
                        (s) => s.id === selectedServiceId
                      );
                      const pkg = selectedSvc?.packages?.find(
                        (p: ServicePackage) => p.name === pkgName
                      );
                      setSelectedPackage(pkg || null);
                      setNewOrder({
                        ...newOrder,
                        package_name: pkgName,
                        final_price: pkg
                          ? parseInt(pkg.finalPrice.replace(/\D/g, ""))
                          : 0,
                      });
                    }}
                    disabled={!selectedServiceId}
                  >
                    <option value="">Pilih Paket</option>
                    {selectedServiceId &&
                      services
                        .find((s) => s.id === selectedServiceId)
                        ?.packages?.map((pkg: ServicePackage, idx: number) => (
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
                      setNewOrder({
                        ...newOrder,
                        discount_code: e.target.value,
                      })
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
                      setNewOrder({
                        ...newOrder,
                        discount_amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              {newOrder.discount_amount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                  <span className="text-green-700 dark:text-green-400">
                    Total Setelah Diskon:{" "}
                    <strong>
                      {formatCurrency(
                        newOrder.final_price - newOrder.discount_amount
                      )}
                    </strong>
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
      )}

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
                    const order = orders.find(
                      (o) => o.invoice_number === createdInvoice
                    );
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
    </div>
  );
}
