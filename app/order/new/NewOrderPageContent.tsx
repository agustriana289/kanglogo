// app/order/new/NewOrderPageContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Service, ServicePackage } from "@/types/service";
import { PaymentMethod } from "@/types/payment-method";
import { supabase } from "@/lib/supabase";
import { Discount } from "@/types/discount";
import LogoLoading from "@/components/LogoLoading";

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
        customer_whatsapp: formData.customer_whatsapp ? `${formData.country_code}${formData.customer_whatsapp}` : "",
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

      router.push(`/order/${newOrder.invoice_number}`);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <LogoLoading size="xl" />
          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
            Pembelian Jasa
          </p>
        </div>
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
    <div className="py-8 mb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">
            Pembelian Jasa {service.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 bg-white rounded-lg shadow p-4">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      PAKET
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      ESTIMASI
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                      HARGA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {selectedPackage.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        <div className="font-semibold mb-1">Fitur:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedPackage.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700 align-top">
                      {selectedPackage.duration} Hari Kerja
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900 align-top">
                      {selectedPackage.finalPrice}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-6">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      Rp {basePrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {/* PERUBAHAN: Tampilkan diskon jika ada */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon ({appliedDiscount?.code})</span>
                      <span className="font-medium">
                        - Rp {discountAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-medium">Rp 0</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>Rp {finalPrice.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Data Pelanggan
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... input fields untuk customer_name, email, whatsapp ... */}
                <div>
                  <label
                    htmlFor="customer_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer_email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    name="customer_email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="nama@email.com"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer_whatsapp"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nomor WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                      id="customer_whatsapp"
                      name="customer_whatsapp"
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="812xxxxxxxx"
                      value={formData.customer_whatsapp}
                      onChange={(e) => setFormData({ ...formData, customer_whatsapp: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>

                {/* PERUBAHAN: Tambahkan input untuk kode diskon */}
                <div>
                  <label
                    htmlFor="discount_code"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Kode Diskon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="discount_code"
                      name="discount_code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan kode"
                      value={formData.discount_code}
                      onChange={handleInputChange}
                      disabled={!!appliedDiscount}
                    />
                    {!appliedDiscount ? (
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={isApplyingDiscount || !formData.discount_code}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                      >
                        {isApplyingDiscount ? "Menerapkan..." : "Terapkan"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  {discountError && (
                    <p className="text-red-500 text-xs mt-1">{discountError}</p>
                  )}
                  {appliedDiscount && (
                    <p className="text-green-600 text-xs mt-1">
                      Diskon berhasil diterapkan!
                    </p>
                  )}
                </div>

                {/* ... input field untuk payment_method ... */}
                <div>
                  <label
                    htmlFor="payment_method"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Metode Pembayaran
                  </label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Memproses..." : "Bayar Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
