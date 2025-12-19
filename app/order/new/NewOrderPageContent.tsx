// app/order/new/NewOrderPageContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Service, ServicePackage } from "@/types/service";
import { PaymentMethod } from "@/types/payment-method";
import { supabase } from "@/lib/supabase";
import { Discount } from "@/types/discount";
import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function NewOrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(
    null
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // PERUBAHAN: State untuk form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_whatsapp: "",
    country_code: "+62",
    payment_method: "",
    discount_code: "", // State untuk input kode diskon
  });

  // PERUBAHAN: State untuk diskon yang diterapkan
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  useEffect(() => {
    const serviceSlug = searchParams.get("service");
    const packageName = searchParams.get("package");

    if (!serviceSlug || !packageName) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("slug", serviceSlug)
        .single();

      if (serviceError || !serviceData) {
        console.error("Service not found:", serviceError);
        router.push("/");
        return;
      }

      const pkg = serviceData.packages.find(
        (p: ServicePackage) => p.name === decodeURIComponent(packageName)
      );
      if (!pkg) {
        console.error("Package not found");
        router.push("/");
        return;
      }
      setService(serviceData);
      setSelectedPackage(pkg);

      const { data: methodsData } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true);
      if (methodsData) {
        setPaymentMethods(methodsData);
        if (methodsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            payment_method: `${methodsData[0].type} - ${methodsData[0].name}`,
          }));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [searchParams, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // PERUBAHAN: Hapus error saat user mengetik ulang kode
    if (name === "discount_code") {
      setDiscountError(null);
    }
  };

  // PERUBAHAN: Fungsi untuk menerapkan diskon
  const applyDiscount = async () => {
    if (!formData.discount_code || !service) {
      setDiscountError("Masukkan kode diskon.");
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError(null);

    const now = new Date().toISOString();

    // Cari diskon yang berlaku
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", formData.discount_code.toUpperCase())
      .eq("is_active", true)
      .or(`service_id.eq.${service.id},service_id.is.null`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .single();

    if (error || !discount) {
      setDiscountError("Kode diskon tidak valid atau tidak berlaku.");
      setAppliedDiscount(null);
    } else {
      // Cek batas pemakaian
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        setDiscountError("Kode diskon telah mencapai batas pemakaian.");
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(discount);
      }
    }

    setIsApplyingDiscount(false);
  };

  // PERUBAHAN: Fungsi untuk menghapus diskon
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setFormData((prev) => ({ ...prev, discount_code: "" }));
    setDiscountError(null);
  };

  // PERUBAHAN: Fungsi untuk menghitung harga akhir
  const calculateFinalPrice = () => {
    if (!selectedPackage) return 0;
    const basePrice = parseInt(selectedPackage.finalPrice.replace(/\D/g, ""));
    if (!appliedDiscount) return basePrice;

    let discountAmount = 0;
    if (appliedDiscount.type === "percentage") {
      discountAmount = basePrice * (appliedDiscount.value / 100);
    } else {
      discountAmount = appliedDiscount.value;
    }

    return Math.max(0, basePrice - discountAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !selectedPackage) return;

    setSubmitting(true);
    try {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
      const invoiceNumber = `INV-${date}-${randomSuffix}`;

      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);

      const selectedPaymentMethod = paymentMethods.find(
        (m) => `${m.type} - ${m.name}` === formData.payment_method
      );

      const basePrice = parseInt(selectedPackage.finalPrice.replace(/\D/g, ""));
      const finalPrice = calculateFinalPrice();
      const discountAmount = basePrice - finalPrice;

      const orderData = {
        invoice_number: invoiceNumber,
        service_id: service.id,
        package_details: selectedPackage,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_whatsapp: formData.customer_whatsapp
          ? `${formData.country_code}${formData.customer_whatsapp}`
          : "",
        // PERUBAHAN: Simpan kode dan jumlah diskon
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        final_price: finalPrice,
        payment_method: formData.payment_method,
        payment_method_id: selectedPaymentMethod?.id || null,
        payment_deadline: paymentDeadline.toISOString(),
        work_duration_days: parseInt(selectedPackage.duration) || 0,
      };

      const { data: newOrder, error: insertError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (insertError || !newOrder) throw insertError;

      // PERUBAHAN: Jika diskon berhasil diterapkan, update used_count
      if (appliedDiscount) {
        await supabase.rpc("increment_discount_usage", {
          discount_id_to_increment: appliedDiscount.id,
        });
      }

      await supabase.from("order_logs").insert({
        order_id: newOrder.id,
        status: "pending_payment",
      });

      // Kirim email notifikasi ke pelanggan dan admin
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "service",
            invoiceNumber: invoiceNumber,
            customerName: formData.customer_name,
            customerEmail: formData.customer_email,
            customerWhatsapp: formData.customer_whatsapp,
            productName: `${service.title} - ${selectedPackage.name}`,
            price: finalPrice,
            discountAmount: discountAmount,
          }),
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't block order creation if email fails
      }

      router.push(`/invoice/${newOrder.invoice_number}`);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  if (!service || !selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Service details not found</div>
      </div>
    );
  }

  const basePrice = parseInt(selectedPackage.finalPrice.replace(/\D/g, ""));
  const finalPrice = calculateFinalPrice();
  const discountAmount = basePrice - finalPrice;

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 md:py-16 px-4 md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-manrope font-bold text-3xl md:text-4xl lg:text-5xl text-slate-800 mb-2">
            <span className="text-primary">Pembelian</span> Jasa{" "}
            {service.title.replace("Jasa ", "")}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Lengkapi data berikut untuk menyelesaikan pemesanan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Bagian Utama - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Details Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-slate-200">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
                Detail Paket
              </h2>

              {/* Mobile-friendly package display */}
              <div className="space-y-6">
                <div className="pb-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-primary mb-4">
                    {selectedPackage.name}
                  </h3>

                  {/* Duration and Price */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-slate-600 uppercase font-semibold mb-1">
                        Estimasi
                      </p>
                      <p className="text-lg md:text-xl font-bold text-slate-800">
                        {selectedPackage.duration}
                      </p>
                      <p className="text-xs text-slate-500">Hari Kerja</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-xs md:text-sm text-slate-600 uppercase font-semibold mb-1">
                        Harga
                      </p>
                      <p className="text-lg md:text-xl font-bold text-primary">
                        {selectedPackage.finalPrice}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm md:text-base font-semibold text-slate-700 mb-3">
                      Fitur Paket:
                    </p>
                    <ul className="space-y-2">
                      {selectedPackage.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-slate-700 text-sm md:text-base">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-slate-600 text-sm md:text-base">
                      Subtotal
                    </span>
                    <span className="font-semibold text-slate-900 text-sm md:text-base">
                      Rp {basePrice.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Discount if applied */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-green-200 bg-green-50 -mx-6 px-6 py-3 rounded-lg">
                      <span className="text-green-700 text-sm md:text-base">
                        Diskon ({appliedDiscount?.code})
                      </span>
                      <span className="font-semibold text-green-700 text-sm md:text-base">
                        - Rp {discountAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-slate-600 text-sm md:text-base">
                      Pajak
                    </span>
                    <span className="font-semibold text-slate-900 text-sm md:text-base">
                      Rp 0
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 bg-primary/5 -mx-6 px-6 py-4 rounded-lg">
                    <span className="font-bold text-slate-900 text-base md:text-lg">
                      Total
                    </span>
                    <span className="font-bold text-primary text-lg md:text-xl">
                      Rp {finalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Customer Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-slate-200 sticky top-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
                Data Pelanggan
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label
                    htmlFor="customer_name"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
                    placeholder="Masukkan nama lengkap"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="customer_email"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    name="customer_email"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
                    placeholder="nama@email.com"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label
                    htmlFor="customer_whatsapp"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Nomor WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm bg-white"
                      value={formData.country_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          country_code: e.target.value,
                        })
                      }
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
                      id="customer_whatsapp"
                      name="customer_whatsapp"
                      required
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
                      placeholder="812xxxxxxxx"
                      value={formData.customer_whatsapp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_whatsapp: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Kode Diskon */}
                <div>
                  <label
                    htmlFor="discount_code"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Kode Diskon (Opsional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="discount_code"
                      name="discount_code"
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm uppercase"
                      placeholder="DISKON2024"
                      value={formData.discount_code}
                      onChange={handleInputChange}
                      disabled={!!appliedDiscount}
                    />
                    {!appliedDiscount ? (
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={isApplyingDiscount || !formData.discount_code}
                        className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition font-semibold text-sm whitespace-nowrap"
                      >
                        {isApplyingDiscount ? "..." : "Terapkan"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold text-sm whitespace-nowrap"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  {discountError && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {discountError}
                    </p>
                  )}
                  {appliedDiscount && (
                    <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
                      <span>✓</span> Diskon berhasil diterapkan!
                    </p>
                  )}
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label
                    htmlFor="payment_method"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Metode Pembayaran
                  </label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm bg-white"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                  >
                    {paymentMethods.map((method) => (
                      <option
                        key={method.id}
                        value={`${method.type} - ${method.name}`}
                      >
                        {method.type} - {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-base md:text-lg hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block animate-spin">⚙️</span>
                        Memproses...
                      </span>
                    ) : (
                      "Bayar Sekarang"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
