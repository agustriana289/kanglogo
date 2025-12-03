"use client"; // Tetap client component karena ada interaksi klik

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Service } from "@/types/service";
import { supabase } from "@/lib/supabase";

export default function Pricing() {
  const router = useRouter();
  const [featuredService, setFeaturedService] = useState<Service | null>(null);
  const [otherServices, setOtherServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Ambil layanan featured
      const { data: featured, error: featuredError } = await supabase
        .from("services")
        .select("*")
        .eq("is_featured", true)
        .single();

      if (featuredError) {
        console.error("Error fetching featured service:", featuredError);
      } else {
        setFeaturedService(featured);
      }

      // 2. Ambil semua layanan lainnya
      const { data: all, error: allError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

      if (allError) {
        console.error("Error fetching all services:", allError);
      } else {
        // Filter layanan lainnya (bukan yang featured)
        setOtherServices((all || []).filter((s) => s.id !== featured?.id));
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleServiceClick = (service: Service) => {
    // Arahkan pengguna ke halaman detail layanan
    router.push(`/services/${service.slug}`);
  };

  if (loading || !featuredService) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section className="py-24 bg-slate-100" id="service">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-slate-700 sm:mb-5 md:text-6xl leading-[50px]">
            <span className="text-primary">Jasa </span>{" "}
            {featuredService.title.replace("Jasa ", "")}
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
            {featuredService.short_description}
          </p>
        </div>

        {/* --- Bagian 1: Daftar Harga Layanan Featured --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6 place-items-center mb-10">
          {featuredService.packages.map((plan, index) => (
            <div
              key={index}
              className={`flex-col p-6 bg-white rounded-2xl shadow-md transform transition-transform items-center`}
            >
              <div className="mb-6">
                <div
                  className={`text-center pb-4 mb-6 border-b border-slate-200`}
                >
                  <p className={`text-3xl font-bold text-primary`}>
                    {plan.name}
                  </p>
                </div>
                <div className="px-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className={`flex items-center text-slate-700`}
                      >
                        <div className="mr-2">
                          <svg
                            className={`w-4 h-4 text-primary`}
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
                <p className={`text-4xl font-extrabold text-slate-700`}>
                  <span className="text-4xl font-bold mb-8">
                    {plan.finalPrice}
                  </span>
                </p>
                <p
                  className={`text-md font-semibold md:mb-8 md:mt-2 uppercase text-slate-400 leading-4`}
                >
                  {plan.beforeoriginalPrice}{" "}
                  {plan.originalPrice && (
                    <span className={`line-through`}>{plan.originalPrice}</span>
                  )}{" "}
                </p>
                <a
                  className={`bg-primary text-white py-2 px-4 rounded-full text-lg transition duration-300 ease-in-out inline-flex items-center flex items-center justify-center w-full`}
                  href={`/order/new?service=${encodeURIComponent(
                    featuredService.slug
                  )}&package=${encodeURIComponent(plan.name)}`}
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
                <p
                  className={`mt-4 text-sm ${
                    plan.titleColor === "text-white"
                      ? "text-white"
                      : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- Bagian 2: Grid Layanan Lainnya --- */}
        <div className="text-center justify-center">
          <a
            className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-white rounded-full bg-primary shadow-sm hover:bg-primary/80 transition-all duration-500"
            href="/services"
          >
            Semua layanan
          </a>
        </div>
      </div>
    </section>
  );
}
