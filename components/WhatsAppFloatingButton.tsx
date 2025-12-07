"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WhatsAppFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const pathname = usePathname();

    // Hide on admin and login pages
    const isHiddenPage = pathname.startsWith("/admin") || pathname.startsWith("/login");

    useEffect(() => {
        if (isHiddenPage) return;

        // Fetch phone number from website settings
        const fetchSettings = async () => {
            const { data } = await supabase
                .from("website_settings")
                .select("website_phone")
                .single();

            if (data?.website_phone) {
                // Clean the phone number (remove spaces, dashes, etc.)
                const cleanedNumber = data.website_phone.replace(/[^0-9]/g, "");
                // Convert to international format if starts with 0
                const formattedNumber = cleanedNumber.startsWith("0")
                    ? "62" + cleanedNumber.slice(1)
                    : cleanedNumber;
                setPhoneNumber(formattedNumber);
            }
        };

        fetchSettings();

        // Show button with animation after a delay
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, [isHiddenPage]);

    // Don't render on admin/login pages
    if (isHiddenPage) return null;

    // Get WhatsApp URL
    const getWhatsAppUrl = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator?.userAgent || "");
        const baseUrl = isMobile ? "https://wa.me/" : "https://web.whatsapp.com/send?phone=";
        return `${baseUrl}${phoneNumber}`;
    };

    return (
        <>
            {/* Floating Button */}
            <div
                className={`fixed bottom-10 right-6 z-50 transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    }`}
            >
                {/* Text Bubble */}
                <div
                    className={`absolute right-full top-0 mr-4 w-44 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm text-left py-3 px-4 rounded-2xl shadow-lg transition-all duration-300 ${isOpen ? "translate-y-4 opacity-0 invisible" : "translate-y-0 opacity-100"
                        }`}
                >
                    <span className="block text-sm">Butuh bantuan?</span>
                    <span className="block font-bold">Hubungi kami!</span>
                </div>

                {/* Button Icon */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-gradient-to-b from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                    aria-label="WhatsApp Chat"
                >
                    {/* WhatsApp Icon - shown when popup is closed */}
                    <svg
                        className={`w-7 h-7 text-white transition-all duration-300 ${isOpen ? "scale-0 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100"
                            }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>

                    {/* Close Icon - shown when popup is open */}
                    <svg
                        className={`w-4 h-4 text-white absolute transition-all duration-300 ${isOpen ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-180 opacity-0"
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Popup */}
            <div
                className={`fixed bottom-32 right-6 z-40 w-80 max-w-[calc(100%-50px)] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100 visible" : "translate-y-12 opacity-0 invisible"
                    }`}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 pl-16">
                    {/* WhatsApp Icon */}
                    <div className="absolute left-4 top-5">
                        <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-base">Ada pertanyaan?</h3>
                    <p className="text-sm text-white/90 mt-0.5">
                        Chat dengan kami via <strong>WhatsApp</strong>
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white p-4">
                    <p className="text-xs text-gray-500 font-medium mb-3">
                        Kami akan merespons secepat mungkin.
                    </p>

                    {/* Contact Item */}
                    <a
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 group"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-green-200 flex-shrink-0">
                            <img
                                src="/icons/avatar.png"
                                alt="Admin"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-800">Agus Triana</p>
                            <p className="text-xs text-gray-500">Admin Kanglogo.com</p>
                        </div>

                        {/* WhatsApp Icon */}
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                    </a>
                </div>
            </div>
        </>
    );
}
