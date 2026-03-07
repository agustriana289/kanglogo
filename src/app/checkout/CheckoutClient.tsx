"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CreditCard, ShieldCheck, CheckCircle2, Package, Mail, Ticket, Loader2, X, Tag } from "lucide-react";
import FadeIn from "@/components/landing/FadeIn";
import { calculateDiscountedPrice } from "@/utils/discounts";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface CheckoutClientProps {
  user: any;
  item: any;
  type: "service" | "product";
  selectedPlan: any;
  initialDiscounts?: any[];
}

export default function CheckoutClient({ user, item, type, selectedPlan, initialDiscounts = [] }: CheckoutClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const [discounts, setDiscounts] = useState<any[]>(initialDiscounts);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [verifyingVoucher, setVerifyingVoucher] = useState(false);

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const scriptSrc = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    if (document.getElementById("midtrans-snap")) return;
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = scriptSrc;
    script.setAttribute("data-client-key", clientKey);
    document.head.appendChild(script);
    return () => {
      const s = document.getElementById("midtrans-snap");
      if (s) document.head.removeChild(s);
    };
  }, []);

  const handleFieldChange = (label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVerifyingVoucher(true);
    try {
      const { data, error } = await supabase
        .from("store_discounts")
        .select("*")
        .eq("code", voucherCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) throw new Error("Voucher code not found or inactive.");
      
      if (data.end_date && new Date(data.end_date) < new Date()) throw new Error("Voucher has expired.");
      if (data.start_date && new Date(data.start_date) > new Date()) throw new Error("Voucher is not active yet.");
      if (data.usage_limit && data.used_count >= data.usage_limit) throw new Error("Voucher usage limit reached.");
      if (data.min_purchase > selectedPlan.price) throw new Error(`Minimum purchase of Rp ${new Intl.NumberFormat('id-ID').format(data.min_purchase)} required.`);

      setAppliedVoucher(data);
      showToast("Voucher applied successfully!", "success");
    } catch (error: any) {
      showToast(error.message, "error");
      setAppliedVoucher(null);
    } finally {
      setVerifyingVoucher(false);
    }
  };

  const getFinalPricing = () => {
    const basePrice = selectedPlan?.price || 0;
    const allDiscounts = appliedVoucher ? [appliedVoucher, ...discounts] : discounts;
    return calculateDiscountedPrice(basePrice, allDiscounts, item.id, type);
  };

  const { originalPrice, discountedPrice, appliedDiscount } = getFinalPricing();

  const handleCheckout = async () => {
    if (item.form_fields && item.form_fields.length > 0) {
      for (const field of item.form_fields) {
        if (field.required && !formData[field.label]) {
          return showToast(`Please fill out the required field: ${field.label}`, "error");
        }
      }
    }

    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const { data: orderData, error: orderError } = await supabase
        .from('store_orders')
        .insert({
          user_id: user.id,
          service_id: type === "service" ? item.id : null,
          product_id: type === "product" ? item.id : null,
          order_number: orderNumber,
          selected_package: selectedPlan,
          form_data: formData,
          total_amount: discountedPrice,
          status: 'pending',
          payment_status: 'unpaid',
          discount_id: appliedDiscount?.id || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (appliedDiscount?.id) {
        await supabase.rpc('increment_discount_usage', { discount_id: appliedDiscount.id });
      }

      await supabase.from('user_activities').insert({
        user_id: user.id,
        title: `${type === "service" ? "Service request" : "Product purchase"} submitted for`,
        highlight: `#${orderData.id.split('-')[0].toUpperCase()}`,
        highlight_color: 'text-indigo-600',
      });

      const tokenRes = await fetch("/api/midtrans/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: discountedPrice,
          customerName: user.user_metadata?.full_name || user.email,
          customerEmail: user.email,
          itemName: `${item.title} - ${selectedPlan.name}`,
        }),
      });

      const { token, error: tokenError } = await tokenRes.json();
      if (tokenError || !token) throw new Error(tokenError || "Failed to get payment token");

      setLoading(false);

      window.snap?.pay(token, {
        onSuccess: (result) => {
          showToast("Payment successful! Redirecting to workspace...", "success");
          router.push(`/workspace/${orderData.id}`);
        },
        onPending: (result) => {
          showToast("Payment pending. We'll update your order once confirmed.", "info");
          router.push(`/dashboard`);
        },
        onError: (result) => {
          showToast("Payment failed. Please try again.", "error");
        },
        onClose: () => {
          showToast("Payment window closed. You can complete payment from your dashboard.", "info");
          router.push(`/dashboard`);
        },
      });

    } catch (error: any) {
      showToast(error.message || "Something went wrong.", "error");
      setLoading(false);
    }
  };

  return (
    <FadeIn delay={150}>
      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden mb-6 flex flex-col md:flex-row">
        
        {/* Order Details Left */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
             <Package size={20} className="text-indigo-600" />
             Order Summary
          </h2>

          <div className="flex items-start gap-4 mb-6">
            <div className="h-20 w-20 shrink-0 bg-white flex items-center justify-center rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-sm">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-slate-400" />
                )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block bg-indigo-50 px-2 py-0.5 rounded-md w-fit ring-1 ring-indigo-100">
                {type === "service" ? "Service" : "Product"}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-1">Plan: <span className="font-semibold text-slate-700">{selectedPlan.name}</span></p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="text-slate-900 font-bold">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
            </div>
            {appliedDiscount && (
              <div className="flex items-center justify-between text-sm text-emerald-600 font-bold pb-2">
                <span className="flex items-center gap-1.5"><Tag size={14} /> Discount ({appliedDiscount.name})</span>
                <span>- Rp {Number(originalPrice - discountedPrice).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-slate-500 font-medium pb-4 border-b border-slate-200">
              <span>Taxes & Fees</span>
              <span className="text-slate-900 font-bold">Free</span>
            </div>
            <div className="flex items-center justify-between text-lg pt-2">
              <span className="font-extrabold text-slate-900">Total Price</span>
              <div className="text-right">
                {appliedDiscount && (
                  <span className="text-xs text-slate-400 line-through mr-2 font-medium">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
                )}
                <span className="font-extrabold text-indigo-600 tracking-tight">Rp {Number(discountedPrice).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          {/* Promo Code Section */}
          <div className="mt-8 bg-white rounded-2xl p-5 ring-1 ring-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Ticket size={16} className="text-indigo-500" /> Have a promo code?
            </h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value)}
                placeholder="Enter code" 
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold uppercase tracking-wider rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 px-4 py-2.5 transition-all outline-none"
              />
              <button 
                onClick={handleApplyVoucher}
                disabled={verifyingVoucher || !voucherCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {verifyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {appliedVoucher && (
              <div className="mt-3 flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-emerald-200/50">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Voucher Applied</span>
                <button onClick={() => setAppliedVoucher(null)} className="hover:text-emerald-900 transition-colors"><X size={14} /></button>
              </div>
            )}
          </div>

          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Included in {selectedPlan.name}</h4>
              <ul className="space-y-2.5">
                {selectedPlan.features.map((feat: string, i: number) => (
                  <li key={i} className="flex gap-x-3 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Customer Information Right */}
        <div className="w-full md:w-[55%] p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Mail size={20} className="text-indigo-600" />
              Information
            </h2>
            
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Email Address</label>
              <div className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium opacity-80 cursor-not-allowed">
                {user.email}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 mt-2 flex items-center gap-1.5 font-bold">
                 <ShieldCheck size={14} /> Logged in securely
              </p>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {item.form_fields && item.form_fields.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 mb-5 uppercase">
                Project Requirements
              </h2>
              <div className="space-y-5">
                {item.form_fields.map((field: any, idx: number) => (
                  <div key={idx}>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea 
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        rows={3} 
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none resize-none shadow-sm"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === "select" && field.options ? (
                      <select
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none shadow-sm"
                      >
                        <option value="" disabled>Select an option</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={field.type === 'file' ? 'url' : 'text'}
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none shadow-sm"
                        placeholder={field.type === 'file' ? 'Provide a drive link...' : `Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:shadow-lg focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  Checkout - Rp {Number(discountedPrice).toLocaleString('id-ID')}
                </>
              )}
            </button>
            <p className="text-center text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-4 leading-relaxed max-w-[250px] mx-auto">
              By confirming, you agree to our Terms of Service.
            </p>
          </div>
        </div>

      </div>
    </FadeIn>
  );
}
