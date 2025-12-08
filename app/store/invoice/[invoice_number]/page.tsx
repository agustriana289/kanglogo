"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
    Download,
    Copy,
    Clock,
    CheckCircle,
    CreditCard,
    Hash,
    User,
    Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import html2pdf from "html2pdf.js";
import LogoLoading from "@/components/LogoLoading";
import InvoiceGate from "@/components/InvoiceGate";

interface StoreOrder {
    id: number;
    order_number: string; // Using order_number as the main identifier
    invoice_number?: string; // Optional if not present in schema
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string | null;
    price: number;
    discount_code: string | null;
    discount_amount: number;
    final_price?: number;
    status: string;
    created_at: string;
    payment_method: string | null;
    payment_method_id?: number; // based on assumption
    // Joins
    marketplace_assets: {
        nama_aset: string;
        image_url: string | null;
    } | null;
    payment_methods?: {
        name: string;
        account_number: string;
        holder_name: string;
        type: string;
    } | null;
    download_link?: string | null;
}

export default function StoreInvoiceDetailPage({
    params,
}: {
    params: Promise<{ invoice_number: string }>;
}) {
    const { invoice_number } = use(params);
    const router = useRouter();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [order, setOrder] = useState<StoreOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [invoice_number]);

    const fetchOrder = async () => {
        // Fetch order with asset details
        const { data: orderData, error: orderError } = await supabase
            .from("store_orders")
            .select(`
        *,
        marketplace_assets (
          nama_aset,
          image_url
        )
      `)
            .eq("order_number", invoice_number) // Using order_number column
            .single();

        if (orderError || !orderData) {
            console.error("Error fetching store order:", orderError);
            setLoading(false);
            return;
        }

        // Try to fetch payment method details
        let paymentDetails = null;

        if (orderData.payment_method_id) {
            try {
                const { data: pm } = await supabase.from('payment_methods').select('*').eq('id', orderData.payment_method_id).single();
                paymentDetails = pm;
            } catch (e) { console.error(e); }
        } else if (orderData.payment_method) {
            try {
                const { data: pm } = await supabase.from('payment_methods')
                    .select('*')
                    .or(`name.ilike.%${orderData.payment_method}%,type.ilike.%${orderData.payment_method}%`)
                    .limit(1)
                    .maybeSingle();
                paymentDetails = pm;
            } catch (e) { console.error(e); }
        }

        setOrder({ ...orderData, payment_methods: paymentDetails });
        setLoading(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadFile = async () => {
        if (!invoiceRef.current) return;
        setIsDownloading(true);
        try {
            const options = {
                margin: 10,
                filename: `invoice-${order?.order_number}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
            };
            await html2pdf().set(options).from(invoiceRef.current).save();
        } catch (error) {
            console.error("Error downloading:", error);
            alert("Gagal mendownload invoice.");
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadAsset = () => {
        if (order?.download_link) {
            window.open(order.download_link, "_blank");
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LogoLoading size="xl" /></div>;
    if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Invoice tidak ditemukan</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "bg-green-100 text-green-800 border-green-200";
            case "completed": return "bg-green-100 text-green-800 border-green-200";
            case "pending_payment": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "cancelled": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending_payment": return "Menunggu Pembayaran";
            case "paid": return "Dibayar";
            case "completed": return "Selesai";
            case "cancelled": return "Dibatalkan";
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit", month: "long", year: "numeric",
        });
    };

    // Logic: Use 'price' as final price if that's what's stored, or logic from purchase modal.
    // Assuming 'price' is the amount to be paid.
    const finalPrice = order.price;
    const subtotal = finalPrice + (order.discount_amount || 0);

    return (
        <InvoiceGate customerEmail={order.customer_email} invoiceNumber={order.order_number}>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-6 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-primary">Invoice #{order.order_number}</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={downloadFile}
                                disabled={isDownloading}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 border disabled:opacity-50"
                            >
                                <Download size={18} /> {isDownloading ? "Downloading..." : "Unduh Invoice"}
                            </button>
                            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cetak</button>
                        </div>
                    </div>

                    <div ref={invoiceRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6 bg-white rounded-lg shadow p-4">
                            <div className="p-6 grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Bayar ke:</h3>
                                    <div className="text-gray-900 font-semibold mb-1">KangLogo.com</div>
                                    <div className="text-sm text-gray-600">Majalengka, Indonesia<br />halo@kanglogo.com</div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Invoice untuk:</h3>
                                    <div className="text-gray-900 font-semibold mb-1">{order.customer_name}</div>
                                    <div className="text-sm text-gray-600">{order.customer_email}<br />{order.customer_whatsapp}</div>
                                </div>
                            </div>

                            <div className="overflow-hidden">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr>
                                            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">PRODUK</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">HARGA</th>
                                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">DISKON</th>
                                            <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {order.marketplace_assets?.image_url ? (
                                                        <img src={order.marketplace_assets.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                                    ) : (<ImageIcon className="w-10 h-10 text-gray-300" />)}
                                                    <div className="font-medium text-gray-900">{order.marketplace_assets?.nama_aset || "Digital Asset"}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-700">Rp {subtotal.toLocaleString("id-ID")}</td>
                                            <td className="py-4 px-4 text-center text-gray-700">Rp {order.discount_amount.toLocaleString("id-ID")}</td>
                                            <td className="py-4 px-6 text-right font-medium text-gray-900">Rp {finalPrice.toLocaleString("id-ID")}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="p-6">
                                    <div className="max-w-xs ml-auto space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span></div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm"><span className="text-gray-600">Diskon</span><span className="font-medium text-green-600">- Rp {order.discount_amount.toLocaleString("id-ID")}</span></div>
                                        )}
                                        <div className="border-t pt-2 mt-2"><div className="flex justify-between text-base font-bold"><span>Total</span><span>Rp {finalPrice.toLocaleString("id-ID")}</span></div></div>
                                    </div>
                                </div>
                            </div>

                            {order.status === "pending_payment" && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                                    <Clock className="text-yellow-600" size={24} />
                                    <div>
                                        <div className="font-semibold text-gray-900">Menunggu Pembayaran</div>
                                        <div className="text-sm text-gray-600">Silakan selesaikan pembayaran sesuai instruksi.</div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {order.status === "completed" && order.download_link && (
                                    <button
                                        onClick={downloadAsset}
                                        className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                                    >
                                        <Download size={18} /> Unduh File
                                    </button>
                                )}
                                <button
                                    onClick={downloadFile}
                                    disabled={isDownloading}
                                    className="bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                >
                                    <Download size={18} /> Unduh Invoice
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
                                >
                                    <Copy size={18} /> {copied ? "Disalin!" : "Salin Tautan"}
                                </button>
                                {order.status === "pending_payment" && (
                                    <button
                                        onClick={() => router.push(`/store/payment-confirmation?order=${order.order_number}`)}
                                        className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Konfirmasi Pembayaran
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6"><span className="text-sm text-gray-600">Total Tagihan:</span><span className="text-2xl font-bold">Rp {finalPrice.toLocaleString("id-ID")}</span></div>
                                <button className={`w-full py-2 px-4 rounded-lg border font-medium mb-4 ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</button>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2"><CheckCircle size={16} className="text-gray-400" /><span className="text-gray-600">Dibuat:</span><span className="font-medium ml-auto">{formatDate(order.created_at)}</span></div>
                                </div>
                            </div>

                            {order.payment_methods && (
                                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
                                    <div className="flex items-center gap-2"><CreditCard size={16} className="text-gray-400" /><span className="text-gray-600">Metode:</span><span className="font-medium ml-auto">{order.payment_methods.type}</span></div>
                                    <div className="flex items-center gap-2"><CreditCard size={16} className="text-gray-400" /><span className="text-gray-600">Bank:</span><span className="font-medium ml-auto">{order.payment_methods.name}</span></div>
                                    <div className="flex items-center gap-2"><Hash size={16} className="text-gray-400" /><span className="text-gray-600">No. Rek:</span><span className="font-medium ml-auto">{order.payment_methods.account_number}</span></div>
                                    <div className="flex items-center gap-2"><User size={16} className="text-gray-400" /><span className="text-gray-600">A.N:</span><span className="font-medium ml-auto">{order.payment_methods.holder_name}</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </InvoiceGate>
    );
}
