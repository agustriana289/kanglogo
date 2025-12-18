"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/types/order";
import { PaymentMethod } from "@/types/payment-method";
import { supabase } from "@/lib/supabase";
import { uploadToImgBB } from "@/lib/imgbb-upload";
import {
  Upload,
  CheckCircle,
  ArrowLeft,
  Image as ImageIcon,
  MessageCircle,
  CreditCard,
  FileText,
  User,
  ExternalLink
} from "lucide-react";
import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function ConfirmPaymentPage() {
  const params = useParams();
  const invoice_number = params?.invoice_number as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [waNumber, setWaNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Order with Service Title for informative display
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*, services(title)")
        .eq("invoice_number", invoice_number)
        .single();

      if (error || !orderData || orderData.status !== "pending_payment") {
        router.push(`/order/${invoice_number}`);
        return;
      }
      setOrder(orderData);

      // Fetch Payment Method
      if (orderData.payment_method_id) {
        const { data: pm } = await supabase.from("payment_methods").select("*").eq("id", orderData.payment_method_id).single();
        if (pm) setPaymentMethod(pm);
      } else if (orderData.payment_method) {
        // Fallback search by name
        const { data: pm } = await supabase.from("payment_methods")
          .select("*")
          .or(`name.ilike.%${orderData.payment_method}%,type.ilike.%${orderData.payment_method}%`)
          .limit(1)
          .maybeSingle();
        if (pm) setPaymentMethod(pm);
      }

      // Fetch WA number from settings
      const { data: settings } = await supabase.from("website_settings").select("website_phone").single();
      if (settings?.website_phone) {
        setWaNumber(settings.website_phone.replace(/[^0-9]/g, "").startsWith("0")
          ? "62" + settings.website_phone.replace(/[^0-9]/g, "").slice(1)
          : settings.website_phone.replace(/[^0-9]/g, ""));
      }

      setLoading(false);
    };

    fetchData();
  }, [invoice_number, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    setProofFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return alert("Silakan unggah bukti pembayaran.");

    setSubmitting(true);
    try {
      const { url: uploadedUrl, error: uploadError } = await uploadToImgBB(proofFile);
      if (uploadError) throw new Error("Gagal upload: " + uploadError);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid", proof_of_payment_url: uploadedUrl })
        .eq("id", order!.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from("order_logs").insert({
        order_id: order!.id,
        status: "paid",
        notes: `Konfirmasi pembayaran via web. Bukti: ${uploadedUrl}`
      });

      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert("Gagal mengirim konfirmasi. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><LogoPathAnimation /></div>;

  const waLink = `https://wa.me/${waNumber}?text=Halo%20Admin,%20saya%20sudah%20melakukan%20pembayaran%20untuk%20invoice%20%23${order?.invoice_number}.%20Mohon%20untuk%20segera%20diproses.`;

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push(`/order/${invoice_number}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={18} /> Kembali ke Invoice
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          {!success ? (
            <>
              {/* Previous structure layout liked by user */}
              <div className="bg-primary px-10 py-10 text-white relative">
                <div className="relative z-10">
                  <h1 className="text-2xl font-bold mb-1">Konfirmasi Pembayaran</h1>
                  <p className="text-white/70 text-sm">Unggah bukti transfer untuk memproses pesanan Anda</p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CreditCard size={80} />
                </div>
              </div>

              <div className="p-10 space-y-8">
                {/* Summary Section - Optimized Aesthetics based on Testimonial Form */}
                <div className="bg-slate-50 rounded-2xl p-7 space-y-4 border border-slate-200">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-500 flex items-center gap-2 font-medium"><FileText size={14} /> Nomor Invoice</span>
                      <span className="text-slate-800 font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200 group-hover:border-primary/30 transition-colors">#{order?.invoice_number}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-2 font-medium"><ImageIcon size={14} /> Nama Layanan</span>
                      <span className="text-slate-800 font-bold text-right max-w-[200px] break-words">
                        {(order as any)?.services?.title ? `${(order as any).services.title} (${order?.package_details?.name})` : order?.package_details?.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-2 font-medium"><User size={14} /> Nama Pelanggan</span>
                      <span className="text-slate-800 font-bold text-right">{order?.customer_name}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-between items-end mt-2">
                      <span className="text-slate-800 font-bold">Nominal Bayar</span>
                      <span className="text-3xl font-black text-primary leading-none">Rp {order?.final_price.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {paymentMethod && (
                    <div className="mt-6 pt-5 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Rekening Tujuan</p>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{paymentMethod.name}</p>
                          <p className="text-lg font-black text-slate-800 font-mono tracking-wider">{paymentMethod.account_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Atas Nama</p>
                          <p className="text-xs font-bold text-slate-600 uppercase italic">{paymentMethod.holder_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Section - Matching Testimonial Form aesthetics */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 ml-1">Unggah Screenshot Bukti</label>
                    <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer group ${proofFile ? "bg-primary/5 border-primary/30" : "bg-slate-50 border-slate-200 hover:border-primary/30"
                      }`}>
                      <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                      {!proofFile ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                            <Upload className="text-primary" size={28} />
                          </div>
                          <p className="text-slate-700 font-bold">Pilih file bukti bayar</p>
                          <p className="text-slate-400 text-xs mt-1">Format JPG, PNG (Maks. 5MB)</p>
                        </div>
                      ) : (
                        <div className="text-center w-full">
                          {filePreview ? (
                            <img src={filePreview} alt="Preview" className="max-h-56 rounded-xl border border-slate-200 mx-auto mb-4 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4">
                              <ImageIcon className="text-primary" size={28} />
                            </div>
                          )}
                          <p className="text-primary font-bold break-all px-4">{proofFile.name}</p>
                          <p className="text-slate-400 text-xs mt-1">Klik untuk mengganti screenshot</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!proofFile || submitting}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Mengirim...</span>
                      </div>
                    ) : "Kirim Konfirmasi"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-16 text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner shadow-green-200/50 text-green-600">
                <CheckCircle size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-800">Pembayaran Terkirim!</h2>
                <p className="text-slate-500 leading-relaxed max-w-[340px] mx-auto">Terima kasih! Bukti pembayaran Anda telah kami terima dan akan segera diproses oleh tim admin kami.</p>
              </div>

              <div className="pt-4 space-y-4">
                <a
                  href={waLink}
                  target="_blank"
                  className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#22c35e] transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <MessageCircle size={26} fill="white" /> Konfirmasi via WhatsApp
                </a>

                <button
                  onClick={() => router.push(`/order/${invoice_number}`)}
                  className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ExternalLink size={20} /> Kembali ke Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
