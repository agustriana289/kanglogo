import { Paintbrush } from "lucide-react";
import AuthButton from "./AuthButton";
import { createClient } from "@/utils/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // Fetch Header Settings
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const headerLinks: { label: string; url: string }[] = settings?.header_links || [];

  const isSticky = settings?.header_sticky ?? true;
  const isTransparent = settings?.header_transparent ?? false;
  const bgColor = settings?.header_bg_color || '#ffffff';
  const size = settings?.header_size || 'md';

  const sizeClasses = {
    sm: "h-12",
    md: "h-16",
    lg: "h-20"
  };

  const hexToRgba = (hex: string, opacity: number) => {
    let r = 255, g = 255, b = 255;
    if (hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  const headerBgStyle = isTransparent ? { backgroundColor: 'transparent' } : { backgroundColor: hexToRgba(bgColor, settings?.header_bg_opacity ?? 100) };

  return (
    <nav 
      className={`border-b border-slate-100 z-50 ${isSticky ? 'sticky top-0 backdrop-blur-md' : 'relative'}`}
      style={headerBgStyle}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between ${sizeClasses[size as keyof typeof sizeClasses] || "h-16"}`}>
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
               <img src={settings.logo_url} alt={settings.website_name || "Logo"} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Paintbrush size={18} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  {settings?.website_name ? settings.website_name.substring(0, 4) : "kang"}
                  <span className="text-indigo-600">
                    {settings?.website_name ? settings.website_name.substring(4) : "logo"}
                  </span>
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center gap-8">
            {headerLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    </nav>
  );
}
