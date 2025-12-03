// app/services/page.tsx
"use client"; // Ubah ke client component untuk handle interaksi

import { useState, useEffect } from "react";
import { Service } from "@/types/service";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import PublicFAQ from "@/components/PublicFAQ";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("❌ Supabase Error:", error);
          setError("Failed to fetch services");
          return;
        }

        setServices(data || []);

        // Set default selected service to the first one
        if (data && data.length > 0) {
          setSelectedService(data[0]);
        }
      } catch (err) {
        console.error("💥 Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 rounded-lg mb-8 border-2 border-red-300">
        <p className="text-red-800 font-semibold text-lg mb-2">
          ⚠️ Error Loading Services
        </p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!selectedService) {
    return (
      <div className="text-center p-8 bg-yellow-100 rounded-lg mb-8 border-2 border-yellow-300">
        <p className="text-yellow-800 font-semibold text-lg mb-2">
          No Services Found
        </p>
        <p className="text-yellow-700 text-sm">
          No services are currently available.
        </p>
      </div>
    );
  }

  return (
    <section className="py-24 bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-slate-700 sm:mb-5 md:text-6xl leading-[50px]">
            Jasa
            <span className="text-primary">
              {" "}
              {selectedService.title.replace("Jasa ", "")}
            </span>
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
            {selectedService.short_description}
          </p>
        </div>

        {/* Service Selection Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all ${
                selectedService.id === service.id
                  ? "bg-primary text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200"
              }`}
            >
              {service.title}
            </button>
          ))}
        </div>

        {/* Promotional Banner */}
        <div className="bg-primary/10 rounded-xl p-6 mb-10 text-center">
          <p className="text-lg font-bold text-slate-700">
            Hemat besar! Diskon sampai 50% hanya untuk pelanggan baru. Klaim
            sekarang!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6 place-items-center mb-10">
          {selectedService.packages && selectedService.packages.length > 0 ? (
            selectedService.packages.map((plan, index) => (
              <div
                key={index}
                className="flex-col p-6 bg-white rounded-2xl shadow-md transform transition-transform items-center"
              >
                <div className="mb-6">
                  <div className="text-center pb-4 mb-6 border-b border-slate-200">
                    <p className="text-3xl font-bold text-primary">
                      {plan.name}
                    </p>
                  </div>
                  <div className="px-6">
                    <ul className="space-y-2">
                      {plan.features &&
                        plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center text-slate-700"
                          >
                            <div className="mr-2">
                              <svg
                                className="w-4 h-4 text-primary"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <polyline
                                  fill="none"
                                  points="6,12 10,16 18,8"
                                  stroke="currentColor"
                                ></polyline>
                                <circle
                                  cx="12"
                                  cy="12"
                                  fill="none"
                                  r="11"
                                  stroke="currentColor"
                                ></circle>
                              </svg>
                            </div>
                            <p className="text-base font-normal leading-7">
                              {feature}
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-slate-700">
                    <span className="text-4xl font-bold mb-8">
                      {plan.finalPrice}
                    </span>
                  </p>
                  <p className="text-md font-semibold md:mb-8 md:mt-2 uppercase text-slate-400 leading-4">
                    {plan.beforeoriginalPrice}{" "}
                    {plan.originalPrice && (
                      <span className="line-through">{plan.originalPrice}</span>
                    )}
                  </p>
                  <a
                    href={`/order/new?service=${encodeURIComponent(
                      selectedService.slug
                    )}&package=${encodeURIComponent(plan.name)}`}
                    className="bg-primary text-white py-2 px-4 rounded-full text-lg transition duration-300 ease-in-out inline-flex items-center flex items-center justify-center w-full"
                  >
                    <svg
                      className="mr-2 w-4 md:w-6 aspect-square"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                    Pilih Paket
                  </a>
                  <p className="mt-4 text-sm text-slate-600">
                    {plan.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-yellow-100 rounded-lg border-2 border-yellow-300">
              <p className="text-yellow-800 font-semibold text-lg mb-2">
                No Packages Available
              </p>
              <p className="text-yellow-700 text-sm">
                No packages are currently available for this service.
              </p>
            </div>
          )}
        </div>

        {/* FAQ Section - Added here */}
        <PublicFAQ serviceTitle={selectedService.title} />
      </div>
    </section>
  );
}
