"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplaceAsset } from "@/types/marketplace";
import { supabase } from "@/lib/supabase";
import { createStorePurchaseNotification } from "@/lib/notifications";
import { XMarkIcon, CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface PurchaseModalProps {
    asset: MarketplaceAsset;
    isOpen: boolean;
    onClose: () => void;
}

interface DiscountInfo {
    code: string;
    type: "percentage" | "fixed";
    value: number;
}

export default function PurchaseModal({ asset, isOpen, onClose }: PurchaseModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"form" | "success">("form");
    const [orderNumber, setOrderNumber] = useState("");
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_email: "",
        customer_whatsapp: "",
        country_code: "+62",
        payment_method: "Bank Transfer",
        discount_code: "",
    });
    const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
    const [discountError, setDiscountError] = useState("");
    const [checkingDiscount, setCheckingDiscount] = useState(false);

    const checkDiscountCode = async () => {
        if (!formData.discount_code.trim()) {
            setDiscountInfo(null);
            setDiscountError("");
            return;
        }

        setCheckingDiscount(true);
        setDiscountError("");
        try {
            const { data, error } = await supabase
                .from("discounts")
                .select("*")
                .eq("code", formData.discount_code.trim().toUpperCase())
                .single();

            if (error || !data) {
                setDiscountError("Kode diskon tidak valid");
                setDiscountInfo(null);
            } else {
                // Check if expired
                const now = new Date();
                if (data.expires_at && new Date(data.expires_at) < now) {
                    setDiscountError("Kode diskon sudah kadaluarsa");
                    setDiscountInfo(null);
                } else if (data.usage_limit && data.usage_count >= data.usage_limit) {
                    setDiscountError("Kode diskon sudah mencapai batas penggunaan");
                    setDiscountInfo(null);
                } else {
                    setDiscountInfo({
                        code: data.code,
                        type: data.type,
                        value: data.value,
                    });
                    setDiscountError("");
                }
            }
        } catch {
            setDiscountError("Gagal memvalidasi kode diskon");
            setDiscountInfo(null);
        } finally {
            setCheckingDiscount(false);
        }
    };

    const calculateDiscount = () => {
        if (!discountInfo) return 0;
        const originalPrice = asset.harga_aset;
        if (discountInfo.type === "percentage") {
            return Math.round((originalPrice * discountInfo.value) / 100);
        }
        return discountInfo.value;
    };

    const getFinalPrice = () => {
        const originalPrice = asset.jenis === "freebies" ? 0 : asset.harga_aset;
        const discount = calculateDiscount();
        return Math.max(0, originalPrice - discount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customer_name || !formData.customer_email) {
            alert("Nama dan email wajib diisi");
            return;
        }

        setLoading(true);
        try {
            // Generate order number
            const dateStr = format(new Date(), "yyyyMMdd");
            const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
            const newOrderNumber = `STR-${dateStr}-${randomStr}`;

            const finalPrice = getFinalPrice();
            const discountAmount = calculateDiscount();

            // Create store order with discount info
            const { data, error } = await supabase.from("store_orders").insert({
                order_number: newOrderNumber,
                asset_id: asset.id,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_whatsapp: formData.customer_whatsapp ? `${formData.country_code}${formData.customer_whatsapp}` : null,
                price: finalPrice,
                discount_code: discountInfo?.code || null,
                discount_amount: discountAmount,
                status: asset.jenis === "freebies" || finalPrice === 0 ? "completed" : "pending_payment",
            }).select().single();

            if (error) throw error;

            // Create notification
            await createStorePurchaseNotification(
                data.id,
                newOrderNumber,
                formData.customer_name,
                asset.nama_aset
            );

            // Kirim email notifikasi ke pelanggan dan admin
            try {
                await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "store",
                        invoiceNumber: newOrderNumber,
                        customerName: formData.customer_name,
                        customerEmail: formData.customer_email,
                        customerWhatsapp: formData.customer_whatsapp ? `${formData.country_code}${formData.customer_whatsapp}` : "",
                        productName: asset.nama_aset,
                        price: finalPrice,
                        discountAmount: discountAmount,
                    }),
                });
            } catch (emailError) {
                console.error("Error sending email notification:", emailError);
                // Don't block order creation if email fails
            }

            setOrderNumber(newOrderNumber);
            setStep("success");
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Gagal membuat pesanan");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep("form");
        setFormData({
            customer_name: "",
            customer_email: "",
            customer_whatsapp: "",
            country_code: "+62",
            payment_method: "Bank Transfer",
            discount_code: "",
        });
        setDiscountInfo(null);
        setDiscountError("");
        setOrderNumber("");
        onClose();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!isOpen) return null;

    const inputStyle = "w-full rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {step === "form" ? (asset.jenis === "premium" ? "Beli Aset" : "Unduh Gratis") : "Pesanan Berhasil"}
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {step === "form" ? (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            {/* Asset Info */}
                            <div className="bg-gray-50 rounded-lg p-4 flex gap-4">
                                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                    {asset.image_url && (
                                        <img src={asset.image_url} alt={asset.nama_aset} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{asset.nama_aset}</h4>
                                    <p className="text-sm text-gray-500">{asset.kategori_aset}</p>
                                    <p className={`text-lg font-bold ${asset.jenis === "premium" ? "text-primary" : "text-green-600"}`}>
                                        {asset.jenis === "premium" ? formatCurrency(asset.harga_aset) : "Gratis"}
                                    </p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={inputStyle}
                                    placeholder="Nama Anda"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    className={inputStyle}
                                    placeholder="email@example.com"
                                    value={formData.customer_email}
                                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp (opsional)
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-24 rounded-lg border border-gray-300 py-2.5 px-2 text-sm text-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
                                        value={formData.country_code}
                                        onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                    >
                                        <option value="+62">🇮🇩 +62</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+60">🇲🇾 +60</option>
                                        <option value="+65">🇸🇬 +65</option>
                                        <option value="+61">🇦🇺 +61</option>
                                        <option value="+81">🇯🇵 +81</option>
                                        <option value="+82">🇰🇷 +82</option>
                                        <option value="+86">🇨🇳 +86</option>
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+49">🇩🇪 +49</option>
                                        <option value="+33">🇫🇷 +33</option>
                                    </select>
                                    <input
                                        type="tel"
                                        className="flex-1 rounded-lg border border-gray-300 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
                                        placeholder="812xxxx xxxx"
                                        value={formData.customer_whatsapp}
                                        onChange={(e) => setFormData({ ...formData, customer_whatsapp: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>

                            {asset.jenis === "premium" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Metode Pembayaran
                                        </label>
                                        <select
                                            className={inputStyle}
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        >
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="E-Wallet">E-Wallet</option>
                                            <option value="QRIS">QRIS</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kode Diskon (opsional)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className={`flex-1 ${inputStyle} ${discountInfo ? 'border-green-500 bg-green-50' : discountError ? 'border-red-500 bg-red-50' : ''}`}
                                                placeholder="Masukkan kode..."
                                                value={formData.discount_code}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, discount_code: e.target.value.toUpperCase() });
                                                    setDiscountInfo(null);
                                                    setDiscountError("");
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={checkDiscountCode}
                                                disabled={checkingDiscount || !formData.discount_code.trim()}
                                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {checkingDiscount ? "..." : "Cek"}
                                            </button>
                                        </div>
                                        {discountInfo && (
                                            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                                                <CheckIcon className="w-4 h-4" />
                                                <span>Diskon {discountInfo.type === "percentage" ? `${discountInfo.value}%` : formatCurrency(discountInfo.value)} berhasil diterapkan!</span>
                                            </div>
                                        )}
                                        {discountError && (
                                            <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                                <XCircleIcon className="w-4 h-4" />
                                                <span>{discountError}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Summary */}
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Harga Asli</span>
                                            <span className="text-gray-900">{formatCurrency(asset.harga_aset)}</span>
                                        </div>
                                        {discountInfo && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-600">Diskon</span>
                                                <span className="text-green-600">-{formatCurrency(calculateDiscount())}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                                            <span className="text-gray-900">Total</span>
                                            <span className="text-primary text-lg">{formatCurrency(getFinalPrice())}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${asset.jenis === "premium"
                                    ? "bg-primary hover:bg-primary/90"
                                    : "bg-green-600 hover:bg-green-700"
                                    }`}
                            >
                                {loading ? "Memproses..." : (asset.jenis === "premium" ? "Lanjutkan Pembayaran" : "Unduh Sekarang")}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                            {asset.jenis === "premium" ? "Pesanan Berhasil Dibuat!" : "Terima Kasih!"}
                        </h4>
                        <p className="text-gray-500 mb-2">
                            Nomor Pesanan:
                        </p>
                        <p className="text-2xl font-mono font-bold text-primary mb-4">
                            {orderNumber}
                        </p>
                        {asset.jenis === "premium" ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
                                <p className="text-sm text-yellow-800">
                                    Silakan lakukan pembayaran dan konfirmasikan kepada kami. Kami akan mengirimkan link download ke email Anda setelah pembayaran dikonfirmasi.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mb-6">
                                Link download akan dikirimkan ke email Anda dalam beberapa saat.
                            </p>
                        )}
                        <button
                            onClick={() => {
                                onClose();
                                router.push(`/store/${orderNumber}`);
                            }}
                            className="w-full py-3 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Lanjut ke Invoice
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
