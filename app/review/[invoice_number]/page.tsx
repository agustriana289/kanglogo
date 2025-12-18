// app/review/[invoice_number]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Testimonial } from "@/types/testimonial";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import { Star, CheckCircle, Package } from "lucide-react";

interface RatingCategory {
    key: "rating_service" | "rating_design" | "rating_communication";
    label: string;
    description: string;
}

const ratingCategories: RatingCategory[] = [
    { key: "rating_service", label: "Layanan", description: "Kecepatan dan kualitas layanan" },
    { key: "rating_design", label: "Hasil Desain", description: "Kualitas desain yang dihasilkan" },
    { key: "rating_communication", label: "Komunikasi", description: "Responsif dan keramahan tim" },
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

    // Form state
    const [ratings, setRatings] = useState({
        rating_service: 5,
        rating_design: 5,
        rating_communication: 5,
    });
    const [reviewText, setReviewText] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pertama, cari order berdasarkan invoice_number
                const { data: orderData, error: orderError } = await supabase
                    .from("orders")
                    .select("*, services(title)")
                    .eq("invoice_number", invoice_number)
                    .single();

                if (orderError || !orderData) {
                    setError("Invoice tidak ditemukan.");
                    setLoading(false);
                    return;
                }

                setOrderInfo(orderData);

                // Cek apakah sudah ada testimoni untuk order ini
                const { data: testiData, error: testiError } = await supabase
                    .from("testimonials")
                    .select("*")
                    .eq("order_id", orderData.id)
                    .single();

                if (testiData) {
                    setTestimonial(testiData);
                    if (testiData.submitted_at) {
                        setSubmitted(true);
                    }
                }
            } catch (err) {
                setError("Terjadi kesalahan saat memuat data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [invoice_number]);

    const handleRatingChange = (category: keyof typeof ratings, value: number) => {
        setRatings((prev) => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reviewText.trim()) {
            alert("Mohon isi ulasan Anda.");
            return;
        }

        setSubmitting(true);

        try {
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
            } else {
                // Create new testimonial
                const { error: insertError } = await supabase
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
                    });

                if (insertError) throw insertError;
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error("Error submitting testimonial:", err);
            alert("Gagal mengirim testimoni. Silakan coba lagi.");
        } finally {
            setSubmitting(false);
        }
    };

    // Star rating component
    const StarRating = ({
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
                        className={`${star <= value
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                            } transition-colors`}
                    />
                </button>
            ))}
        </div>
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
                <div className="container mx-auto max-w-md px-4 text-center">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Terima Kasih!
                        </h1>
                        <p className="text-gray-600">
                            Testimoni Anda telah berhasil dikirim. Kami sangat menghargai feedback Anda!
                        </p>
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
                                        <p className="font-medium text-gray-800">{category.label}</p>
                                        <p className="text-sm text-gray-500">{category.description}</p>
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
                            <label
                                htmlFor="reviewText"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Ceritakan Pengalaman Anda
                            </label>
                            <textarea
                                id="reviewText"
                                rows={5}
                                className="w-full rounded-xl border border-gray-300 shadow-sm p-4 focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none resize-none"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Bagikan pengalaman Anda menggunakan layanan kami..."
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
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
