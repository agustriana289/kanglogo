import { notFound } from "next/navigation";
import { headers } from "next/headers"; // Tambahkan import ini
import { supabase } from "@/lib/supabase";
import { Project } from "@/types/project";
import ShareButtons from "./ShareButtons";
import ProjectImage from "@/components/ProjectImage";

export const revalidate = 0;

async function getProject(slug: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fungsi kecil untuk mengubah newline menjadi <br />
const formatMultiLine = (text: string | null | undefined) => {
  if (!text) return null;
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split("\n").length - 1 && <br />}
    </span>
  ));
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  // --- TAMBAHKAN BAGIAN INI ---
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const url = `https://${host}/projects/${slug}`;
  // --- AKHIR TAMBAHAN ---

  return (
    <section className="py-16 bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Kolom Kiri: Gambar */}
          {/* Kolom Kiri: Gambar */}
          <div className="w-full">
            {project.image_url ? (
              <ProjectImage src={project.image_url} alt={project.title} />
            ) : (
              <div className="w-full h-80 bg-slate-200 flex items-center justify-center text-slate-500 rounded-2xl">
                Tidak Ada Gambar
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail Proyek */}
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope font-bold text-3xl text-slate-700 md:text-4xl leading-[50px]">
                {project.title}
              </h1>
            </div>

            <div className="flex flex-row justify-between max-w-sm">
              <h3 className="font-semibold text-slate-900">Tanggal Mulai</h3>
              <p className="text-slate-600">{formatDate(project.start_date)}</p>
            </div>
            <div className="flex flex-row justify-between max-w-sm">
              <h3 className="font-semibold text-slate-900">Tanggal Selesai</h3>
              <p className="text-slate-600">{formatDate(project.end_date)}</p>
            </div>

            {project.owner && (
              <div className="flex flex-row justify-between max-w-sm">
                <h3 className="font-semibold text-slate-900">Owner Proyek</h3>
                <p className="text-slate-600">
                  {formatMultiLine(project.owner)}
                </p>
              </div>
            )}

            {project.type && (
              <div className="flex flex-row justify-between max-w-sm">
                <h3 className="font-semibold text-slate-900">Jenis Proyek</h3>
                <p className="text-slate-600">
                  {formatMultiLine(project.type)}
                </p>
              </div>
            )}

            {project.aplikasi_yang_digunakan && (
              <div className="flex flex-row justify-between max-w-sm">
                <h3 className="font-semibold text-slate-900">
                  Aplikasi yang digunakan
                </h3>
                <p className="text-slate-600">
                  {formatMultiLine(project.aplikasi_yang_digunakan)}
                </p>
              </div>
            )}

            {project.deskripsi_proyek && (
              <div>
                <h3 className="font-semibold text-slate-900">
                  Deskripsi Proyek
                </h3>
                <div
                  className="prose prose-sm text-slate-600 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: project.deskripsi_proyek.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            )}

            {project.filosofi_proyek && (
              <div>
                <h3 className="font-semibold text-slate-900">
                  Filosofi Proyek
                </h3>
                <div
                  className="prose prose-sm text-slate-600 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: project.filosofi_proyek.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            )}

            {project.komentar_proyek && (
              <div>
                <h3 className="font-semibold text-slate-900">
                  Komentar Desainer
                </h3>
                <div
                  className="prose prose-sm text-slate-600 max-w-none italic"
                  dangerouslySetInnerHTML={{
                    __html: project.komentar_proyek.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            )}

            {/* --- PERUBAHAN KRUSIAL ADA DI SINI --- */}
            <ShareButtons title={project.title} url={url} />
            {/* --- AKHIR PERUBAHAN --- */}
          </div>
        </div>
      </div>
    </section>
  );
}
