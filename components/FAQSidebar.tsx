// components/FAQSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface FAQSidebarProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
}

export default function FAQSidebar({ selectedCategory, onCategoryChange }: FAQSidebarProps) {
    const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            // Get all FAQs to count categories
            const { data: faqs, error } = await supabase
                .from("faqs")
                .select("category");

            if (error) {
                console.error("Error fetching FAQs:", error);
                return;
            }

            // Count categories
            const categoryCounts: { [key: string]: number } = {};
            faqs?.forEach((faq) => {
                if (faq.category) {
                    const cats = faq.category.split(",").map((c: string) => c.trim());
                    cats.forEach((cat: string) => {
                        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                    });
                }
            });

            // Convert to array and sort
            const categoryArray = Object.entries(categoryCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setCategories(categoryArray);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Categories Widget */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4 text-gray-900">
                    Kategori FAQ
                </h3>
                <div className="space-y-2">
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() => onCategoryChange(category.name)}
                            className={`flex justify-between items-center p-2 rounded-md hover:bg-gray-100 transition-colors w-full text-left ${selectedCategory === category.name ? "bg-primary/10" : ""
                                }`}
                        >
                            <span className={`text-sm ${selectedCategory === category.name ? "text-primary font-medium" : "text-gray-700"}`}>
                                {category.name}
                            </span>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                {category.count}
                            </span>
                        </button>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-gray-500 text-sm">
                            Belum ada kategori
                        </p>
                    )}
                </div>
            </div>

            {/* Help Widget */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Butuh Bantuan?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Jika pertanyaan Anda belum terjawab, jangan ragu untuk menghubungi kami.
                </p>
                <a
                    href="/contact"
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    Hubungi Kami
                </a>
            </div>
        </div>
    );
}
