// app/review/[invoice_number]/page.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Testimonial } from "@/types/testimonial";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { Star, CheckCircle, Package, Gift, AlertCircle } from "lucide-react";
import { createNewTestimonialNotification } from "@/lib/notifications";

interface RatingCategory {
  key: "rating_service" | "rating_design" | "rating_communication";
  label: string;
  description: string;
}

const ratingCategories: RatingCategory[] = [
  {
    key: "rating_service",
    label: "Layanan",
    description: "Kecepatan dan kualitas layanan",
  },
  {
    key: "rating_design",
    label: "Hasil Desain",
    description: "Kualitas desain yang dihasilkan",
  },
  {
    key: "rating_communication",
    label: "Komunikasi",
    description: "Responsif dan keramahan tim",
  },
];

export default function SubmitTestimonialPage() {
  const params = useParams();
  const invoice_number = params?.invoice_number as string;
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [generatedDiscount, setGeneratedDiscount] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);

  // Form state
  const [ratings, setRatings] = useState({
    rating_service: 5,
    rating_design: 5,
    rating_communication: 5,
  });
  const [reviewText, setReviewText] = useState("");

  // Utility function untuk menghitung jumlah kata
  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Utility function untuk generate random string dari invoice
  const generateRandomCode = (invoice: string): string => {
    // Ambil 5 karakter random dari invoice
    const alphanumeric = invoice.replace(/[^a-zA-Z0-9]/g, "");
    let result = "";
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * alphanumeric.length);
      result += alphanumeric[randomIndex].toUpperCase();
    }
    return result;
  };

  // Handle review text change dan hitung kata
  const handleReviewChange = (text: string) => {
    setReviewText(text);
    setWordCount(countWords(text));
  };

  useEffect(() => {
    if (!invoice_number) {
      setError("Invoice tidak ditemukan.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Pertama, cari order berdasarkan invoice_number
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            "id, invoice_number, customer_name, customer_email, package_details, services(title)"
          )
          .eq("invoice_number", invoice_number)
          .single();

        if (orderError || !orderData) {
          setError("Invoice tidak ditemukan.");
          setLoading(false);
          return;
        }

        setOrderInfo(orderData);

        // Cek apakah sudah ada testimoni untuk order ini dengan proper error handling
        const { data: testiData } = await supabase
          .from("testimonials")
          .select("*")
          .eq("order_id", orderData.id)
          .maybeSingle();

        if (testiData) {
          setTestimonial(testiData);

          // Check apakah review link sudah expire
          if (testiData.review_link_expires_at) {
            const expiresAt = new Date(testiData.review_link_expires_at);
            const now = new Date();

            if (now > expiresAt) {
              setError(
                "Link testimoni Anda sudah kadaluarsa. Mohon hubungi admin untuk mendapatkan link baru."
              );
              setLoading(false);
              return;
            }
          }

          if (testiData.submitted_at) {
            setSubmitted(true);
            // Set form data dari testimoni yang sudah ada
            setRatings({
              rating_service: testiData.rating_service || 5,
              rating_design: testiData.rating_design || 5,
              rating_communication: testiData.rating_communication || 5,
            });
            setReviewText(testiData.review_text || "");
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Terjadi kesalahan saat memuat data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [invoice_number]);

  const handleRatingChange = (
    category: keyof typeof ratings,
    value: number
  ) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewText.trim()) {
      alert("Mohon isi ulasan Anda.");
      return;
    }

    const currentWordCount = countWords(reviewText);

    // Validasi jumlah kata: min 10, max 30
    if (currentWordCount < 10) {
      alert(
        "Ulasan harus minimal 10 kata. Saat ini: " + currentWordCount + " kata."
      );
      return;
    }

    if (currentWordCount > 30) {
      alert(
        "Ulasan maksimal 30 kata. Saat ini: " + currentWordCount + " kata."
      );
      return;
    }

    setSubmitting(true);

    try {
      let discountData = null;

      // Create or update testimonial
      if (testimonial) {
        // Update existing testimonial
        const { error: updateError } = await supabase
          .from("testimonials")
          .update({
            rating_service: ratings.rating_service,
            rating_design: ratings.rating_design,
            rating_communication: ratings.rating_communication,
            review_text: reviewText.trim(),
            submitted_at: new Date().toISOString(),
          })
          .eq("id", testimonial.id);

        if (updateError) throw updateError;

        // Create notification for updated testimonial
        await createNewTestimonialNotification(testimonial.id);
      } else {
        // Create new testimonial
        const { data: newTestimonial, error: insertError } = await supabase
          .from("testimonials")
          .insert({
            order_id: orderInfo.id,
            customer_name: orderInfo.customer_name,
            customer_email: orderInfo.customer_email,
            service_name: orderInfo.package_details?.name || "Layanan KangLogo",
            rating_service: ratings.rating_service,
            rating_design: ratings.rating_design,
            rating_communication: ratings.rating_communication,
            review_text: reviewText.trim(),
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create notification for new testimonial
        if (newTestimonial?.id) {
          await createNewTestimonialNotification(newTestimonial.id);
        }
      }

      // Generate discount otomatis jika kata >= 20 dan <= 30
      if (currentWordCount >= 20) {
        const discountCode = `DIS${generateRandomCode(invoice_number)}`;
        const voucherName = `TESTIMONI-${invoice_number}`;

        // Buat discount di database
        const { data: newDiscount, error: discountError } = await supabase
          .from("discounts")
          .insert({
            code: discountCode,
            description: `Diskon 30% dari testimoni invoice ${invoice_number}`,
            type: "percentage",
            value: 30,
            is_automatic: false,
            service_id: null,
            usage_limit: 1,
            starts_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // 30 hari
            is_active: true,
          })
          .select();

        if (discountError) {
          console.error("Error creating discount:", discountError);
        } else {
          discountData = {
            code: discountCode,
            value: 30,
            voucherName: voucherName,
          };
          setGeneratedDiscount(discountData);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting testimonial:", err);
      alert("Gagal mengirim testimoni. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Star rating component - memoized to prevent unnecessary re-renders
  const StarRating = useCallback(
    memo(
      ({
        value,
        onChange,
      }: {
        value: number;
        onChange: (val: number) => void;
      }) => (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
      )
    ),
    []
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <LogoPathAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen py-16 bg-slate-100 flex items-center justify-center">
        <div className="container mx-auto max-w-md px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Link Tidak Valid
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="min-h-screen py-16 bg-slate-100 flex items-center justify-center">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-primary px-6 py-8 text-white text-center">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Terima Kasih!</h1>
              <p className="text-white/80">
                Testimoni Anda telah berhasil dikirim
              </p>
            </div>

            {/* Order/Product Info */}
            <div className="px-6 py-4 bg-slate-50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    {invoice_number}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {orderInfo?.services?.title
                      ? `${orderInfo.services.title} - ${orderInfo?.package_details?.name}`
                      : orderInfo?.package_details?.name || "Layanan KangLogo"}
                  </p>
                  {orderInfo?.customer_name && (
                    <p className="text-sm text-gray-500">
                      Pelanggan: {orderInfo.customer_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Testimoni Display */}
            <div className="p-6 space-y-6">
              {/* Discount Notification */}
              {generatedDiscount && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Gift className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 mb-2">
                        🎉 Selamat! Anda Mendapatkan Diskon!
                      </h3>
                      <p className="text-amber-800 text-sm mb-4">
                        Terima kasih telah memberikan testimoni lengkap. Anda
                        berhak mendapatkan diskon{" "}
                        <span className="font-bold">30%</span> untuk pembelian
                        berikutnya!
                      </p>
                      <div className="bg-white rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-xs text-amber-700 uppercase font-semibold mb-1">
                            Kode Diskon
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="bg-amber-100 text-amber-900 font-bold text-lg px-4 py-2 rounded flex-1 text-center">
                              {generatedDiscount.code}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  generatedDiscount.code
                                );
                                alert("Kode diskon berhasil disalin!");
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium transition-colors text-sm"
                            >
                              Salin
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-amber-700 uppercase font-semibold mb-1">
                            Potongan Harga
                          </p>
                          <p className="text-2xl font-bold text-amber-900">
                            30%
                          </p>
                        </div>
                        <div className="pt-3 border-t border-amber-200">
                          <p className="text-xs text-amber-700">
                            ✓ Berlaku 30 hari dari sekarang
                            <br />
                            ✓ Dapat digunakan 1 kali
                            <br />✓ Untuk semua layanan KangLogo
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Rating Display */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Penilaian Anda
                </h2>
                {ratingCategories.map((category) => (
                  <div
                    key={category.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {category.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star}>
                          <Star
                            size={32}
                            className={`${
                              star <= ratings[category.key]
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Text Display */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Ulasan Anda
                </h2>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {reviewText}
                  </p>
                </div>
              </div>

              {/* Submitted Info */}
              {testimonial?.submitted_at && (
                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                  <p>
                    Dikirim pada:{" "}
                    {new Date(testimonial.submitted_at).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}

              <p className="text-center text-gray-600 text-sm">
                Kami sangat menghargai feedback Anda!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-16 bg-slate-100">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-6 py-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Berikan Testimoni Anda</h1>
            <p className="text-white/80">
              Pendapat Anda sangat berarti bagi kami
            </p>
          </div>

          {/* Order/Product Info */}
          <div className="px-6 py-4 bg-slate-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{invoice_number}</p>
                <p className="font-semibold text-gray-800">
                  {orderInfo?.services?.title
                    ? `${orderInfo.services.title} - ${orderInfo?.package_details?.name}`
                    : orderInfo?.package_details?.name || "Layanan KangLogo"}
                </p>
                {orderInfo?.customer_name && (
                  <p className="text-sm text-gray-500">
                    Pelanggan: {orderInfo.customer_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Categories */}
            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Berikan Penilaian Anda
              </label>

              {ratingCategories.map((category) => (
                <div
                  key={category.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {category.label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                  </div>
                  <StarRating
                    value={ratings[category.key]}
                    onChange={(val) => handleRatingChange(category.key, val)}
                  />
                </div>
              ))}
            </div>

            {/* Review Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="reviewText"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ceritakan Pengalaman Anda
                </label>
                <span
                  className={`text-xs font-semibold ${
                    wordCount < 10
                      ? "text-red-600"
                      : wordCount <= 30
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {wordCount}/30 kata
                </span>
              </div>
              <textarea
                id="reviewText"
                rows={5}
                className={`w-full rounded-xl border shadow-sm p-4 focus:ring-1 focus:outline-none resize-none transition-colors ${
                  wordCount < 10 || wordCount > 30
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-primary focus:ring-primary"
                }`}
                value={reviewText}
                onChange={(e) => handleReviewChange(e.target.value)}
                placeholder="Bagikan pengalaman Anda menggunakan layanan kami..."
                maxLength={500}
                required
              />
              {wordCount < 10 && wordCount > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertCircle size={16} />
                  Minimal {10 - wordCount} kata lagi
                </div>
              )}
              {wordCount > 30 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertCircle size={16} />
                  Kurangi {wordCount - 30} kata
                </div>
              )}
              {wordCount >= 10 && wordCount <= 30 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  Siap dikirim
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || wordCount < 10 || wordCount > 30}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
            >
              {submitting ? "Mengirim..." : "Kirim Testimoni"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
