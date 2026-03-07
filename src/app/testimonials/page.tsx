import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import { Star, MessageSquareQuote } from "lucide-react";

export const metadata = {
  title: "Testimonials | Kanglogo",
  description: "Read what our clients have to say about our services.",
};

async function getTestimonials() {
  const supabase = await createClient();

  // Get users for avatar_url
  const { data: profiles } = await supabase.from("users").select("id, full_name, email, avatar_url");
  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p: any) => { if (p.id) profileMap[p.id] = p; });

  const { data } = await supabase
    .from("store_testimonials")
    .select("*, store_orders(order_number, form_data, store_products(title), store_services(title))")
    .order("created_at", { ascending: false });

  return (data || []).map((t: any) => ({
    ...t,
    client: t.user_id ? profileMap[t.user_id] || null : null
  }));
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  const getProjectTitle = (t: any) => {
    if (t.custom_project_title) return t.custom_project_title;
    
    const order = t.store_orders;
    if (!order) return "Project";

    const baseTitle = order.store_products?.title || order.store_services?.title || "Project";
    try {
      const fd = typeof order.form_data === "string" ? JSON.parse(order.form_data) : order.form_data;
      const note = fd?.["Project Title"] || fd?.["Nama Logo"] || fd?.["nama_logo"];
      return note ? `${baseTitle} — ${note}` : baseTitle;
    } catch { return baseTitle; }
  };

  const avgRating = (t: any) => {
    const vals = [t.rating_quality, t.rating_communication, t.rating_speed].filter(Boolean);
    if (!vals.length) return 5;
    return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
              <MessageSquareQuote size={14} />
              <span>Client Reviews</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              What Our Clients Say
            </h1>
            <p className="text-lg text-slate-600">
              Honest feedback and reviews from our amazing clients around the world.
            </p>
          </FadeIn>

          {testimonials.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No testimonials yet.</p>
              <p className="text-slate-400 text-sm mt-1">Our clients are still writing their amazing stories.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => {
                const rating = avgRating(t);
                const clientName = t.client_name || t.client?.full_name || t.client?.email?.split("@")[0] || "Happy Client";
                const projectTitle = getProjectTitle(t);

                return (
                  <FadeIn key={t.id} delay={150 + idx * 80}>
                    <article className="group bg-white rounded-3xl p-8 ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>

                      <blockquote className="flex-1 mb-8 text-slate-700 leading-relaxed italic">
                        &ldquo;{t.comment || "Great service and exactly what I needed. Highly recommended!"}&rdquo;
                      </blockquote>

                      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-100">
                        {t.client?.avatar_url ? (
                          <img
                            src={t.client.avatar_url}
                            alt={clientName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                            {clientName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{clientName}</div>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5 max-w-[200px] truncate">{projectTitle}</div>
                        </div>
                      </div>
                    </article>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
