"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Download,
  Copy,
  Clock,
  CheckCircle,
  CreditCard,
  User,
  CircleDollarSign,
} from "lucide-react";
import { Order } from "@/types/order";
import { PaymentMethod } from "@/types/payment-method";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import InvoiceGate from "@/components/InvoiceGate";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoice_number = params?.id as string;
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
      // Try store_orders first
      const { data: storeOrder, error: storeError } = await supabase
        .from("store_orders")
        .select("*")
        .eq("invoice_number", invoice_number)
        .maybeSingle();

      if (storeOrder && !storeError) {
        // Use store order
        setOrder(storeOrder as any);

        if (storeOrder.payment_method_id) {
          const { data: paymentData } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("id", storeOrder.payment_method_id)
            .single();
          if (paymentData) setPaymentMethod(paymentData);
        } else if (storeOrder.payment_method) {
          const { data: paymentData } = await supabase
            .from("payment_methods")
            .select("*")
            .or(
              `name.ilike.%${storeOrder.payment_method}%,type.ilike.%${storeOrder.payment_method}%`
            )
            .limit(1)
            .maybeSingle();
          if (paymentData) setPaymentMethod(paymentData);
        }

        setLoading(false);

        // Timer
        if (
          storeOrder.payment_deadline &&
          storeOrder.status === "pending_payment"
        ) {
          const updateTimer = () => {
            const now = new Date().getTime();
            const dueTime = new Date(storeOrder.payment_deadline).getTime();
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
      } else {
        // Try regular orders
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("invoice_number", invoice_number)
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
      }
    };

    fetchOrder();
  }, [invoice_number]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = async () => {
    if (!order) return;

    setIsDownloading(true);

    try {
      // Jika order completed dan ada final_file_link, buka file manager
      if (order.status === "completed" && order.final_file_link) {
        router.push(`/file/o/${order.invoice_number}`);
      }
      // Jika tidak, generate dan download invoice PDF
      else {
        if (!invoiceRef.current) return;

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

        const html2pdf = (await import("html2pdf.js")).default;
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
      return "Lihat File";
    return "Unduh";
  };

  const getDownloadButtonTextLong = () => {
    if (isDownloading) return "Downloading...";
    if (order?.status === "completed" && order.final_file_link)
      return "Lihat File";

    return "Unduh Invoice";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
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

  const discountAmount = order.discount_amount || 0;
  const priceBeforeDiscount = order.final_price + discountAmount;
  const subtotal = priceBeforeDiscount;
  const tax = 0;

  return (
    <InvoiceGate
      customerEmail={order.customer_email}
      invoiceNumber={order.invoice_number}
    >
      <div className="min-h-screen bg-slate-100 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-primary px-8 py-10 text-white relative">
              <div className="relative z-10">
                <h1 className="text-2xl font-bold mb-2">Invoice Pembelian</h1>
                <p className="text-white/80">
                  Konfirmasi detail pesanan dan status pembayaran Anda
                </p>
              </div>
              <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-2 opacity-20 sm:opacity-100">
                <span className="text-xs uppercase tracking-widest font-medium text-white/60">
                  Nomor Invoice
                </span>
                <span className="text-2xl font-mono font-bold">
                  #{order.invoice_number}
                </span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Action Buttons Header */}
              <div className="flex flex-wrap gap-3 pb-8 border-b border-slate-100">
                <button
                  onClick={downloadFile}
                  disabled={isDownloading}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
                >
                  <Download size={18} className="text-primary" />
                  {getDownloadButtonText()}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold transition-all"
                >
                  <Download size={18} className="rotate-180 text-primary" />{" "}
                  Cetak
                </button>
                <button
                  onClick={copyLink}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 font-semibold transition-all"
                >
                  <Copy size={18} className="text-primary" />{" "}
                  {copied ? "Berhasil Disalin!" : "Salin Tautan"}
                </button>
              </div>

              {/* Info Sections */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Detail Pembayaran
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Status</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Metode</span>
                      <span className="font-semibold text-slate-800 text-sm">
                        {paymentMethod?.name || "Belum ditentukan"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Tanggal</span>
                      <span className="font-semibold text-slate-800 text-sm">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Informasi Pelanggan
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Nama</p>
                      <p className="font-bold text-slate-800">
                        {order.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium text-slate-700">
                        {order.customer_email}
                      </p>
                    </div>
                    {order.customer_whatsapp && (
                      <div>
                        <p className="text-slate-500">WhatsApp</p>
                        <p className="font-medium text-slate-700">
                          {order.customer_whatsapp}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Layanan yang Dipesan
                </h3>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="block sm:hidden p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <CircleDollarSign className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg">
                          {order.package_details?.name || "Paket Layanan"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Estimasi: {order.package_details?.duration || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500 text-sm">
                        Harga Paket
                      </span>
                      <span className="font-bold text-slate-800">
                        Rp {priceBeforeDiscount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <table className="hidden sm:table w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                          Item
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">
                          Estimasi
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">
                          Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-800">
                            {order.package_details?.name || "Paket Layanan"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Layanan Desain KangLogo
                          </p>
                        </td>
                        <td className="px-6 py-5 text-center text-slate-600 font-medium">
                          {order.package_details?.duration || "-"}
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-slate-800">
                          Rp {priceBeforeDiscount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary & Deadline */}
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div>
                  {order.status === "pending_payment" &&
                    order.payment_deadline && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-yellow-800">
                              Batas Pembayaran
                            </p>
                            <p className="text-xs text-yellow-700/70">
                              Segera selesaikan sebelum waktu habis
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-center">
                          {[
                            { label: "JAM", val: timeLeft.hours },
                            { label: "MENIT", val: timeLeft.minutes },
                            { label: "DETIK", val: timeLeft.seconds },
                          ].map((t, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col items-center"
                            >
                              <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-yellow-600 shadow-sm border border-yellow-100">
                                {String(t.val).padStart(2, "0")}
                              </div>
                              <span className="text-[10px] font-bold text-yellow-700/50 mt-1">
                                {t.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {paymentMethod && (
                    <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <h4 className="font-bold text-slate-800">
                          Instruksi Pembayaran
                        </h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bank/E-Wallet</span>
                          <span className="font-bold text-slate-800">
                            {paymentMethod.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Nomor Rekening</span>
                          <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded tracking-wider">
                            {paymentMethod.account_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Atas Nama</span>
                          <span className="font-bold text-slate-800">
                            {paymentMethod.holder_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium text-slate-800">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Diskon
                          {order.discount_code
                            ? ` (${order.discount_code})`
                            : ""}
                        </span>
                        <span className="font-bold text-green-600">
                          - Rp {discountAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pajak</span>
                      <span className="font-medium text-slate-800">
                        Rp {tax.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-800 font-bold">
                          Total Tagihan
                        </span>
                        <span className="text-2xl font-black text-primary">
                          Rp {order.final_price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.status === "pending_payment" ? (
                    <button
                      onClick={() =>
                        router.push(`/invoice/${order.invoice_number}/confirm`)
                      }
                      className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Konfirmasi Pembayaran
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={24} /> Terbayar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-100">
              <p className="text-sm text-slate-400">
                Pertanyaan? Hubungi tim support kami di{" "}
                <span className="text-primary font-bold">
                  halo@kanglogo.com
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </InvoiceGate>
  );
}
