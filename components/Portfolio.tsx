// components/Portfolio.tsx
"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10); // Batasi jumlah proyek yang ditampilkan di homepage

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section className="py-12 sm:py-24 bg-slate-100" id="porto">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 overflow-hidden">
        <div className="pb-16">
          <div className="text-center">
            <h1 className="max-w-2xl mx-auto font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-[50px]">
              <span className="text-primary">Portofolio</span> Klien Kami
            </h1>
            <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
              Dari UMKM hingga korporasi besar, mereka telah mempercayakan
              desainnya kepada kami.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`}>
              <div className="relative w-full pb-[100%] overflow-hidden cursor-pointer group">
                {project.image_url ? (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="bg-white shadow-sm rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="bg-white shadow-sm rounded-2xl absolute top-0 left-0 w-full h-full flex items-center justify-center text-slate-500">
                    No Image
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex justify-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center py-2.5 px-6 text-base font-semibold text-center text-white rounded-full bg-primary shadow-sm hover:bg-primary/80 transition-all duration-500"
            >
              Lihat Semua Proyek
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
