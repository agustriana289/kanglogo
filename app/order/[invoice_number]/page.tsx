"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Copy,
  Clock,
  CheckCircle,
  CreditCard,
  Hash,
  User,
  CircleDollarSign,
} from "lucide-react";
import { Order } from "@/types/order";
import { PaymentMethod } from "@/types/payment-method";
import { supabase } from "@/lib/supabase";
import html2pdf from "html2pdf.js";
import LogoLoading from "@/components/LogoLoading";
import InvoiceGate from "@/components/InvoiceGate";

export default function InvoiceDetailPage({
  params,
}: {
  params: { invoice_number: string };
}) {
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("invoice_number", params.invoice_number)
        .single();

      if (orderError || !orderData) {
        console.error("Error fetching order:", orderError);
        setLoading(false);
        return;
      }

      console.log("Order data:", orderData);
      setOrder(orderData);

      if (orderData.payment_method_id) {
        const { data: paymentData, error: paymentError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("id", orderData.payment_method_id)
          .single();

        if (!paymentError && paymentData) {
          setPaymentMethod(paymentData);
        }
      } else if (orderData.payment_method) {
        const { data: paymentData, error: paymentError } = await supabase
          .from("payment_methods")
          .select("*")
          .or(
            `name.ilike.%${orderData.payment_method}%,type.ilike.%${orderData.payment_method}%`
          )
          .limit(1)
          .maybeSingle();

        if (paymentData) {
          setPaymentMethod(paymentData);
        }
      }

      setLoading(false);

      // Timer
      if (
        orderData.payment_deadline &&
        orderData.status === "pending_payment"
      ) {
        const updateTimer = () => {
          const now = new Date().getTime();
          const dueTime = new Date(orderData.payment_deadline).getTime();
          const difference = dueTime - now;

          if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor(
              (difference % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
          } else {
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
      }
    };

    fetchOrder();
  }, [params.invoice_number]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = async () => {
    if (!order) return;

    setIsDownloading(true);

    try {
      // Jika order completed dan ada final_file_link, download file final
      if (order.status === "completed" && order.final_file_link) {
        window.open(order.final_file_link, "_blank");
      }
      // Jika tidak, generate dan download invoice PDF
      else {
        if (!invoiceRef.current) return;

        // --- PERUBAHAN KRUSIAL ADA DI SINI ---
        const options = {
          margin: 10,
          filename: "invoice.pdf",
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: {
            unit: "mm" as const,
            format: "a4" as const,
            orientation: "portrait" as const,
          },
        };
        // --- AKHIR PERUBAHAN ---

        await html2pdf().set(options).from(invoiceRef.current).save();
      }
    } catch (error) {
      console.error("Error downloading:", error);
      alert("Gagal mendownload. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDownloadButtonText = () => {
    if (isDownloading) return "Downloading...";
    if (order?.status === "completed" && order.final_file_link)
      return "Unduh File";
    return "Unduh";
  };

  const getDownloadButtonTextLong = () => {
    if (isDownloading) return "Downloading...";
    if (order?.status === "completed" && order.final_file_link)
      return "Unduh File";
    return "Unduh Invoice";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Memuat Pesanan
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Invoice tidak ditemukan</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "Menunggu Pembayaran";
      case "paid":
        return "Dibayar";
      case "accepted":
        return "Diterima";
      case "in_progress":
        return "Dikerjakan";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const priceBeforeDiscount = order.final_price + order.discount_amount;
  const subtotal = priceBeforeDiscount;
  const tax = 0;

  return (
    <InvoiceGate customerEmail={order.customer_email} invoiceNumber={order.invoice_number}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-primary">
                Invoice #{order.invoice_number}
              </h1>
              <div className="flex gap-3">
                <button
                  onClick={downloadFile}
                  disabled={isDownloading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} /> {getDownloadButtonText()}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cetak
                </button>
              </div>
            </div>
          </div>

          <div ref={invoiceRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 bg-white rounded-lg shadow p-4">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      Bayar ke:
                    </h3>
                    <div className="text-gray-900 font-semibold mb-1">
                      KangLogo.com
                    </div>
                    <div className="text-sm text-gray-600">
                      Majalengka, Indonesia
                      <br />
                      halo@kanglogo.com
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      Invoice untuk:
                    </h3>
                    <div className="text-gray-900 font-semibold mb-1">
                      {order.customer_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.customer_email}
                      <br />
                      {order.customer_whatsapp}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden px-4 py-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Paket</p>
                      <p className="font-medium text-gray-900">
                        {order.package_details?.name || "Service Package"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Estimasi</p>
                        <p className="text-gray-700">{order.package_details?.duration || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Harga</p>
                        <p className="text-gray-700">Rp {priceBeforeDiscount.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    {order.discount_amount > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Diskon</p>
                        <p className="text-green-600 font-medium">- Rp {order.discount_amount.toLocaleString("id-ID")}</p>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 uppercase mb-1">Total Harga</p>
                      <p className="text-lg font-bold text-primary">Rp {order.final_price.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                          PAKET
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          ESTIMASI
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          HARGA
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          DISKON
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                          TOTAL HARGA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {order.package_details?.name || "Service Package"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {order.package_details?.duration || "-"}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700">
                          Rp {priceBeforeDiscount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          Rp {order.discount_amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-900">
                          Rp {order.final_price.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-6">
                  <div className="max-w-xs ml-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Diskon{" "}
                          {order.discount_code ? `(${order.discount_code})` : ""}
                        </span>
                        <span className="font-medium text-green-600">
                          - Rp {order.discount_amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pajak</span>
                      <span className="font-medium">
                        Rp {tax.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span>
                          Rp {order.final_price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {order.status === "pending_payment" && order.payment_deadline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="text-yellow-600" size={24} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Batas Waktu Pembayaran
                      </div>
                      <div className="text-sm text-gray-600">
                        Selesaikan pembayaran sebelum waktu habis
                      </div>
                    </div>
                    <div className="flex gap-2 text-2xl font-bold text-yellow-600">
                      <div className="bg-white px-3 py-2 rounded">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </div>
                      <span className="py-2">:</span>
                      <div className="bg-white px-3 py-2 rounded">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </div>
                      <span className="py-2">:</span>
                      <div className="bg-white px-3 py-2 rounded">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={downloadFile}
                  disabled={isDownloading}
                  className="bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} /> {getDownloadButtonTextLong()}
                </button>
                <button
                  onClick={copyLink}
                  className="bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
                >
                  <Copy size={18} /> {copied ? "Disalin!" : "Salin Tautan"}
                </button>
                {order.status === "pending_payment" && (
                  <button
                    onClick={() =>
                      router.push(`/order/${order.invoice_number}/confirm`)
                    }
                    className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Konfirmasi Pembayaran
                  </button>
                )}
                {(order.status === "paid" ||
                  order.status === "accepted" ||
                  order.status === "in_progress" ||
                  order.status === "completed") && (
                    <button
                      disabled
                      className="bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                    >
                      Dibayar
                    </button>
                  )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">Total Invoice:</span>
                  <span className="text-2xl font-bold">
                    Rp {order.final_price.toLocaleString("id-ID")}
                  </span>
                </div>
                <button
                  className={`w-full py-2 px-4 rounded-lg border font-medium mb-4 ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </button>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-gray-400" />
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="font-medium ml-auto">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  {order.payment_deadline && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-600">
                        Batas Waktu:
                      </span>
                      <span className="font-medium ml-auto">
                        {formatDate(order.payment_deadline)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {paymentMethod && (
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-medium ml-auto">
                      {paymentMethod.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-gray-600">Bank/E-wallet:</span>
                    <span className="font-medium ml-auto">
                      {paymentMethod.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-gray-400" />
                    <span className="text-gray-600">No Akun/Rekening:</span>
                    <span className="font-medium ml-auto">
                      {paymentMethod.account_number}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-600">Atas Nama:</span>
                    <span className="font-medium ml-auto">
                      {paymentMethod.holder_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InvoiceGate>
  );
}
