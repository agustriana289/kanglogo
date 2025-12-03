// app/admin/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { Order } from "@/types/order";
import LogoLoading from "@/components/LogoLoading";
import {
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CreditCardIcon,
  PhotoIcon,
  ShoppingBagIcon,
  UserIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { createOrderStatusNotification } from "@/lib/notifications";

const statusOptions = [
  {
    value: "pending_payment",
    label: "Belum Dibayar",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  {
    value: "paid",
    label: "Dibayar",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    value: "accepted",
    label: "Diterima",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    value: "in_progress",
    label: "Dikerjakan",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  },
  {
    value: "completed",
    label: "Selesai",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  },
];

const filterOptions = [
  { value: "all", label: "Semua" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "last_month", label: "Bulan Kemarin" },
  { value: "this_year", label: "Tahun Ini" },
];

// Items per page
const ITEMS_PER_PAGE = 20;

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editedStatus, setEditedStatus] = useState("");
  const [finalFileLink, setFinalFileLink] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the range of items to display
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders(selectedFilter, searchQuery);
  }, [orders, selectedFilter, searchQuery]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching orders:", error);
      showToast("Gagal memuat pesanan", "error");
    } else {
      setOrders(data || []);
      setFilteredOrders(data || []);
      setTotalItems(data?.length || 0);
    }
    setLoading(false);
  };

  const filterOrders = (filter: string, search: string) => {
    let filtered = [...orders];
    const now = new Date();

    // Apply time filter
    switch (filter) {
      case "this_week":
        filtered = orders.filter(
          (order) =>
            new Date(order.created_at) >=
            new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - now.getDay()
            )
        );
        break;
      case "this_month":
        filtered = orders.filter(
          (order) =>
            new Date(order.created_at).getMonth() === now.getMonth() &&
            new Date(order.created_at).getFullYear() === now.getFullYear()
        );
        break;
      case "last_month":
        filtered = orders.filter((order) => {
          const orderDate = new Date(order.created_at);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            orderDate.getMonth() === lastMonth.getMonth() &&
            orderDate.getFullYear() === lastMonth.getFullYear()
          );
        });
        break;
      case "this_year":
        filtered = orders.filter(
          (order) =>
            new Date(order.created_at).getFullYear() === now.getFullYear()
        );
        break;
      default:
        filtered = orders;
    }

    // Apply search filter
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.invoice_number.toLowerCase().includes(searchLower) ||
          order.customer_name.toLowerCase().includes(searchLower) ||
          order.customer_email.toLowerCase().includes(searchLower) ||
          order.customer_whatsapp.toLowerCase().includes(searchLower) ||
          (order.package_details &&
            order.package_details.name.toLowerCase().includes(searchLower))
      );
    }

    setFilteredOrders(filtered);
    // Reset to first page when filter or search changes
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setEditedStatus(order.status);
    setFinalFileLink(order.final_file_link || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setEditedStatus("");
    setFinalFileLink("");
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder) return;

    setSaving(true);

    try {
      let updateData: any = { status: editedStatus };

      if (
        editedStatus === "in_progress" &&
        selectedOrder.status !== "in_progress"
      ) {
        const workDeadline = new Date();
        workDeadline.setDate(
          workDeadline.getDate() + (selectedOrder.work_duration_days || 7)
        );
        updateData.work_deadline = workDeadline.toISOString();
      }

      if (editedStatus === "completed") {
        updateData.final_file_link = finalFileLink || null;
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", selectedOrder.id);

      if (error) {
        console.error("Error updating order:", error);
        showToast("Gagal memperbarui pesanan.", "error");
      } else {
        // INTEGRASI NOTIFIKASI: Buat notifikasi jika status berubah
        if (editedStatus !== selectedOrder.status) {
          await createOrderStatusNotification(selectedOrder.id, editedStatus);
        }

        await supabase.from("order_logs").insert({
          order_id: selectedOrder.id,
          status: editedStatus,
          notes: `Status diubah menjadi ${getStatusLabel(editedStatus)}`,
        });

        showToast("Pesanan berhasil diperbarui!", "success");
        fetchOrders();
        closeModal();
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Terjadi kesalahan saat memperbarui pesanan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find((opt) => opt.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      statusOptions.find((opt) => opt.value === status)?.color ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <LogoLoading size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sedang memuat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-slate-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
        {/* Header Section - Diperbaiki dengan Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="block w-full sm:w-auto rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Cari pesanan..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredOrders.length)} dari{" "}
          {filteredOrders.length} pesanan
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Layanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-slate-200 dark:divide-slate-600">
              {currentItems.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-slate-400 mr-3" />
                      {order.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {order.package_details.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    Rp {order.final_price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {new Date(order.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(order)}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentItems.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start">
                  <ShoppingBagIcon className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {order.invoice_number}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {order.customer_name}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="ml-8">
                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <p>
                    <span className="font-medium">Layanan:</span>{" "}
                    {order.package_details.name}
                  </p>
                  <p>
                    <span className="font-medium">Total:</span> Rp{" "}
                    {order.final_price.toLocaleString("id-ID")}
                  </p>
                  <p>
                    <span className="font-medium">Tanggal:</span>{" "}
                    {new Date(order.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => openModal(order)}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {searchQuery
                ? "Tidak ada pesanan yang ditemukan"
                : "Tidak ada pesanan"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Coba ubah kata kunci pencarian Anda."
                : selectedFilter === "all"
                ? "Belum ada pesanan yang dibuat."
                : `Tidak ada pesanan untuk filter "${
                    filterOptions.find((opt) => opt.value === selectedFilter)
                      ?.label
                  }".`}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-slate-500 dark:text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === page
                        ? "bg-primary text-white border-primary"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal for Managing Order - Diperbaiki */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Detail Pesanan
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {selectedOrder.invoice_number}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-slate-400" />
                    Informasi Customer
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Nama:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.customer_name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <EnvelopeIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.customer_email}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <PhoneIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.customer_whatsapp}
                    </span>
                  </div>
                </div>

                {/* Package Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 flex items-center">
                    <ShoppingBagIcon className="h-5 w-5 mr-2 text-slate-400" />
                    Informasi Paket
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Nama Paket:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.package_details.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Durasi:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.package_details.duration || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Harga:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      Rp {selectedOrder.final_price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Diskon:
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        - Rp{" "}
                        {selectedOrder.discount_amount.toLocaleString("id-ID")}
                      </span>
                      {selectedOrder.discount_code && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-0.5 rounded">
                          {selectedOrder.discount_code}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-slate-400" />
                    Informasi Pembayaran
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCardIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {selectedOrder.payment_method}
                    </span>
                  </div>
                  {selectedOrder.proof_of_payment_url && (
                    <div>
                      <a
                        href={selectedOrder.proof_of_payment_url}
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                      >
                        <PhotoIcon className="h-4 w-4" /> Lihat Bukti Bayar
                      </a>
                    </div>
                  )}
                  {selectedOrder.payment_deadline && (
                    <div className="flex items-start gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Batas Bayar:
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {formatDate(selectedOrder.payment_deadline)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-slate-400" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Dibuat:
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {formatDate(selectedOrder.created_at)}
                      </div>
                    </div>
                    {selectedOrder.work_deadline && (
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Deadline Pengerjaan:
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {formatDate(selectedOrder.work_deadline)}
                        </div>
                      </div>
                    )}
                    {selectedOrder.work_duration_days && (
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Durasi Kerja:
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {selectedOrder.work_duration_days} hari
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-6 space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Kelola Status & File
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status Pesanan <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Status saat ini:{" "}
                      <span className="font-semibold">
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Link File Final{" "}
                      {editedStatus === "completed" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="url"
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm p-2 border dark:bg-slate-800 dark:text-white"
                      value={finalFileLink}
                      onChange={(e) => setFinalFileLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      disabled={editedStatus !== "completed"}
                    />
                    {selectedOrder.final_file_link && (
                      <a
                        href={selectedOrder.final_file_link}
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs mt-1"
                      >
                        <DocumentTextIcon className="h-4 w-4" /> Lihat file saat
                        ini
                      </a>
                    )}
                  </div>
                </div>

                {editedStatus === "completed" && !finalFileLink && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-400">
                    ⚠️ Link file final wajib diisi untuk status "Selesai"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                <a
                  href={`/order/${selectedOrder.invoice_number}`}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                  Lihat Invoice
                </a>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={
                      saving || (editedStatus === "completed" && !finalFileLink)
                    }
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
