"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Download,
    ChevronLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    ShoppingBag,
    ExternalLink,
    MessageCircle,
    Printer,
    FileText
} from "lucide-react";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import Link from "next/link";

export default function StoreInvoicePage() {
    const params = useParams();
    const invoice_number = params?.invoice_number as string;
    const router = useRouter();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [waNumber, setWaNumber] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const { data: orderData, error } = await supabase
                .from("store_orders")
                .select(`
          *,
          marketplace_assets (
            nama_aset,
            image_url,
            file_url
          ),
          payment_methods (
            name,
            account_number,
            holder_name,
            type
          )
        `)
                .eq("order_number", invoice_number)
                .single();

            if (error || !orderData) {
                console.error("Error fetching order:", error);
                setLoading(false);
                return;
            }
            setOrder(orderData);

            const { data: settings } = await supabase.from("website_settings").select("website_phone").single();
            if (settings?.website_phone) {
                setWaNumber(settings.website_phone.replace(/[^0-9]/g, "").startsWith("0")
                    ? "62" + settings.website_phone.replace(/[^0-9]/g, "").slice(1)
                    : settings.website_phone.replace(/[^0-9]/g, ""));
            }

            setLoading(false);
        };

        fetchData();
    }, [invoice_number]);

    if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><LogoPathAnimation /></div>;

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Invoice Tidak Ditemukan</h1>
                    <p className="text-slate-500 mb-6">Mohon maaf, invoice yang Anda cari tidak dapat ditemukan.</p>
                    <button onClick={() => router.push("/store")} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Ke Store</button>
                </div>
            </div>
        );
    }

    const subtotal = order.price + order.discount_amount;
    const finalPrice = order.price;

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/store" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
                        <ChevronLeft size={18} /> Kembali ke Store
                    </Link>
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium print:hidden">
                        <Printer size={18} /> Cetak Invoice
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-primary p-8 sm:p-12 text-white">
                        <div className="flex flex-col sm:flex-row justify-between gap-8">
                            <div>
                                <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Invoice Produk Digital</p>
                                <h1 className="text-3xl sm:text-4xl font-black mb-4">#{order.order_number}</h1>
                                <div className="flex items-center gap-3">
                                    {order.status === "pending_payment" ? (
                                        <span className="flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <Clock size={16} /> Menunggu Pembayaran
                                        </span>
                                    ) : order.status === "paid" ? (
                                        <span className="flex items-center gap-1.5 bg-blue-400/20 text-blue-200 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <Clock size={16} /> Verifikasi Admin
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 bg-green-400/20 text-green-300 px-4 py-1.5 rounded-full text-sm font-bold">
                                            <CheckCircle size={16} /> Pembayaran Selesai
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Tanggal Pesanan</p>
                                <p className="text-xl font-bold">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Detail Pelanggan</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <UserIcon size={18} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="font-bold text-slate-800">{order.customer_name}</p>
                                            <p className="text-sm text-slate-500">{order.customer_email}</p>
                                            <p className="text-sm text-slate-500">{order.customer_whatsapp}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Detail Produk</h3>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                                            {order.marketplace_assets?.image_url ? (
                                                <img src={order.marketplace_assets.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="text-slate-300" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 leading-tight mb-1">{order.marketplace_assets?.nama_aset}</p>
                                            <p className="text-xs text-primary font-bold px-2 py-0.5 bg-primary/5 rounded inline-block uppercase tracking-wider">Aset Digital</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {order.status === "completed" && order.marketplace_assets?.file_url && (
                                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                                    <h3 className="text-green-800 font-bold mb-3 flex items-center gap-2">
                                        <CheckCircle size={20} /> Produk Siap Diunduh!
                                    </h3>
                                    <a
                                        href={order.marketplace_assets.file_url}
                                        target="_blank"
                                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                                    >
                                        <Download size={18} /> Unduh File Sekarang
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Informasi Pembayaran</h3>
                                </div>
                                <div className="p-6">
                                    {order.payment_methods ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Transfer</p>
                                                <p className="font-bold text-slate-800">{order.payment_methods.type} - {order.payment_methods.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Rekening</p>
                                                <p className="text-2xl font-black text-primary font-mono tracking-wider">{order.payment_methods.account_number}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atas Nama</p>
                                                <p className="font-bold text-slate-800">{order.payment_methods.holder_name}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Metode pembayaran tidak tersedia</p>
                                    )}
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium tracking-tight">Harga Produk</span>
                                        <span className="font-bold text-slate-800 tracking-tight">Rp {subtotal.toLocaleString("id-ID")}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium tracking-tight">Potongan Harga</span>
                                            <span className="font-bold text-green-600 tracking-tight">- Rp {order.discount_amount.toLocaleString("id-ID")}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-800 font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-4">TOTAL BAYAR</span>
                                            <span className="text-3xl font-black text-primary tracking-tighter">Rp {finalPrice.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {order.status === "pending_payment" && (
                                <button
                                    onClick={() => router.push(`/store/${order.order_number}/confirm`)}
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <CreditCard size={22} /> Konfirmasi Pembayaran
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-100">
                        <p className="text-sm text-slate-400 mb-0">Invoice ini sah dan diproses secara otomatis oleh sistem KangLogo.</p>
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
                    <p className="text-slate-500 text-sm">Butuh bantuan terkait pesanan ini?</p>
                    <a
                        href={`https://wa.me/${waNumber}?text=Halo%20Admin,%20saya%20ada%20kendala%20dengan%20pesanan%20%23${order.order_number}`}
                        target="_blank"
                        className="flex items-center gap-2 text-primary font-bold text-sm bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <MessageCircle size={18} fill="currentColor" className="text-[#25D366]" /> Chat Bantuan Admin
                    </a>
                </div>
            </div>
        </div>
    );
}

function UserIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
