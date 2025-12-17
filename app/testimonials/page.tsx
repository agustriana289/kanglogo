// app/testimonials/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Testimonial, getAverageRating } from "@/types/testimonial";
import { supabase } from "@/lib/supabase";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import Link from "next/link";

const ITEMS_PER_PAGE = 12;

// Star rating display component
const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                className={`${size === "md" ? "w-5 h-5" : "w-4 h-4"} ${star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);



export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [filterSource, setFilterSource] = useState<"all" | "service" | "store">("all");

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const { data, error } = await supabase
                    .from("testimonials")
                    .select("*")
                    .not("submitted_at", "is", null)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setTestimonials(data || []);
                setFilteredTestimonials(data || []);
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = testimonials;

        // Filter by rating
        if (filterRating) {
            filtered = filtered.filter((t) => Math.round(getAverageRating(t)) === filterRating);
        }

        // Filter by source
        if (filterSource === "service") {
            filtered = filtered.filter((t) => t.order_id !== null);
        } else if (filterSource === "store") {
            filtered = filtered.filter((t) => t.store_order_id !== null);
        }

        setFilteredTestimonials(filtered);
        setCurrentPage(1);
    }, [filterRating, filterSource, testimonials]);

    // Pagination
    const totalPages = Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <main className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        Testimoni <span className="text-primary">Klien</span>
                    </h1>
                    <p className="text-slate-600 max-w-xl mx-auto">
                        Pendapat jujur dari klien yang telah menggunakan layanan kami
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Rating Filter */}
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setFilterRating(null)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition ${filterRating === null
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Semua
                                </button>
                                {[5, 4, 3].map((rating) => (
                                    <button
                                        key={rating}
                                        onClick={() => setFilterRating(rating)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1 ${filterRating === rating
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {rating}
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Source Filter */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex gap-1">
                                {[
                                    { key: "all", label: "Semua" },
                                    { key: "service", label: "Layanan" },
                                    { key: "store", label: "Toko" },
                                ].map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setFilterSource(opt.key as any)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition ${filterSource === opt.key
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <p className="text-sm text-gray-500 mb-4">
                    Menampilkan {currentItems.length} dari {filteredTestimonials.length} testimoni
                </p>

                {/* Testimonials Grid */}
                {currentItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada testimoni</h3>
                        <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentItems.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6"
                            >
                                {/* Header: Rating & Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <StarRating rating={Math.round(getAverageRating(testimonial))} size="md" />
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${testimonial.order_id
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-green-50 text-green-600"
                                            }`}
                                    >
                                        {testimonial.order_id ? "Layanan" : "Toko"}
                                    </span>
                                </div>

                                {/* Review Text */}
                                <p className="text-gray-600 leading-relaxed mb-4 line-clamp-5">
                                    "{testimonial.review_text}"
                                </p>

                                {/* Footer: Customer Info */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="font-semibold text-gray-900">
                                        {testimonial.customer_name || "Pelanggan"}
                                    </p>
                                    <p className="text-xs text-primary mt-0.5">
                                        {testimonial.service_name || testimonial.product_name || "Layanan KangLogo"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav aria-label="Page navigation" className="flex justify-center mt-10">
                        <ul className="flex -space-x-px text-sm">
                            {/* Previous Button */}
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-s-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                            </li>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <li key={page}>
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        aria-current={currentPage === page ? "page" : undefined}
                                        className={`flex items-center justify-center box-border border font-medium text-sm w-10 h-10 focus:outline-none transition-colors ${currentPage === page
                                            ? "text-primary bg-gray-100 border-gray-200 hover:text-primary"
                                            : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </li>
                            ))}

                            {/* Next Button */}
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-e-lg text-sm px-3 h-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </main>
    );
}
