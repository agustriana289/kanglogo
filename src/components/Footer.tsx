import { Paintbrush } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import DynamicIcon from "./DynamicIcon";

export default async function Footer() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  const servicesLinks: { label: string; url: string }[] = settings?.footer_services_links || [];
  const companyLinks: { label: string; url: string }[] = settings?.footer_company_links || [];
  const legalLinks: { label: string; url: string }[] = settings?.footer_legal_links || [];
  const bottomLinks: { label: string; url: string }[] = settings?.footer_bottom_links || [];
  
  const socialLinks: { platform: string; url: string }[] = settings?.footer_social_links || [];

  return (
    <>
    <footer className="bg-slate-950 py-16 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              {settings?.logo_url ? (
                 <img src={settings.logo_url} alt={settings.website_name || "Logo"} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Paintbrush size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    {settings?.website_name ? settings.website_name.substring(0, 4) : "kang"}
                    <span className="text-indigo-500">
                      {settings?.website_name ? settings.website_name.substring(4) : "logo"}
                    </span>
                  </span>
                </>
              )}
            </div>
            <p className="mb-8 max-w-sm text-sm leading-relaxed">
              {settings?.footer_description || "Karna Logo Jangan Dibuat Biasa Saja"}
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, idx) => (
                <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-900 p-2 text-slate-400 transition-colors hover:bg-indigo-600 hover:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <DynamicIcon name={social.platform} size={18} />
                  <span className="sr-only">{social.platform}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-200 uppercase">Services</h3>
            <ul className="space-y-3 text-sm">
              {servicesLinks.map((link, idx) => (
                <li key={idx}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-200 uppercase">Company</h3>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((link, idx) => (
                <li key={idx}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-200 uppercase">Legal</h3>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link, idx) => (
                <li key={idx}><a href={link.url} className="transition-colors hover:text-white">{link.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm sm:flex-row">
          <p>
            {settings?.footer_copyright || `© ${new Date().getFullYear()} Kanglogo. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            {bottomLinks.map((link, idx) => (
              <a key={idx} href={link.url} className="transition-colors hover:text-white">{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
    {settings?.footer_custom_html && (
      <div dangerouslySetInnerHTML={{ __html: settings.footer_custom_html }} />
    )}
    </>
  );
}
