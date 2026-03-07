"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { Save, Loader2, Globe, FileText, MonitorSmartphone, LayoutTemplate, PanelTop, PanelBottom, Settings, Search, Banknote, Upload, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, Rocket, Sparkles, CheckCircle2, Zap, Shield, RefreshCcw, Lightbulb, Edit3, DownloadCloud, Star, TrendingUp, Users, Briefcase, Award } from "lucide-react";

const AVAILABLE_ICONS = ["Rocket", "Sparkles", "CheckCircle2", "Zap", "Shield", "RefreshCcw", "Search", "Lightbulb", "Edit3", "DownloadCloud", "Star", "Globe", "TrendingUp", "Monitor", "Users", "Briefcase", "Award", "Image", "Smartphone", "Heart", "ThumbsUp", "Target", "Coffee", "Check", "Play", "Menu"];
const AVAILABLE_SOCIALS = ["Facebook", "Twitter", "Instagram", "Linkedin", "Youtube", "Github", "Dribbble", "Tiktok"];

type WebsiteSettings = {
  id: number;
  website_name: string;
  email: string;
  phone_number: string;
  description: string;
  is_maintenance: boolean;
  favicon_url: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
  color_theme1: string;
  color_theme2: string;
  header_links: { label: string; url: string }[];
  footer_services_links: { label: string; url: string }[];
  footer_company_links: { label: string; url: string }[];
  footer_legal_links: { label: string; url: string }[];
  footer_bottom_links: { label: string; url: string }[];
  
  hero_badge: string;
  hero_title: string;
  hero_description: string;
  features_list: { title: string; desc: string; icon: string }[];
  trusted_by_title: string;
  trusted_by_description: string;
  stats_title: string;
  stats_list: { value: string; suffix: string; label: string }[];
  portfolio_badge: string;
  portfolio_title: string;
  portfolio_description: string;
  pricing_badge: string;
  pricing_title: string;
  pricing_description: string;
  process_badge: string;
  process_title: string;
  process_description: string;
  process_list: { title: string; desc: string; icon: string }[];
  case_studies_title: string;
  case_studies_description: string;
  faq_badge: string;
  faq_title: string;
  faq_description: string;
  cta_title: string;
  cta_description: string;
  cta_button1_text: string;
  cta_button2_text: string;
  blog_badge: string;
  blog_title: string;
  blog_description: string;
  header_size: string;
  header_sticky: boolean;
  header_transparent: boolean;
  header_bg_color: string;
  header_bg_opacity: number;
  header_custom_html: string;
  footer_description: string;
  footer_social_links: { platform: string; url: string }[];
  footer_copyright: string;
  footer_custom_html: string;
  seo_keywords: string;
  seo_author: string;
  seo_meta_robots: string;
  seo_canonical_url: string;
  seo_og_title: string;
  seo_og_description: string;
  seo_og_image: string;
  seo_og_type: string;
  seo_twitter_card: string;
  seo_twitter_title: string;
  seo_twitter_description: string;
  seo_twitter_handle: string;
  payment_methods: { bank_name: string; account_name: string; account_number: string }[];
};

const TAB_MENUS = [
  { id: "website", label: "Website Setting", icon: Globe },
  { id: "navigation", label: "Navigation", icon: MonitorSmartphone },
  { id: "landing", label: "Landing Page", icon: LayoutTemplate },
  { id: "header", label: "Header", icon: PanelTop },
  { id: "footer", label: "Footer", icon: PanelBottom },
  { id: "seo", label: "SEO Engine", icon: Search },
  { id: "payment", label: "Payment Method", icon: Banknote },
];

export default function SettingsClient() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("website");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [settings, setSettings] = useState<WebsiteSettings>({
    id: 1,
    website_name: "Kanglogo",
    email: "",
    phone_number: "",
    description: "",
    is_maintenance: false,
    favicon_url: "",
    logo_url: "",
    color_primary: "#4f46e5",
    color_secondary: "#6366f1",
    color_theme1: "#ffffff",
    color_theme2: "#000000",
    header_links: [],
    footer_services_links: [],
    footer_company_links: [],
    footer_legal_links: [],
    footer_bottom_links: [],
    hero_badge: "Fast, Premium Logo Design",
    hero_title: "Design your brand's perfect identity",
    hero_description: "Professional logo design that speaks to your audience. We build visual identities that are memorable, scalable, and fast to deliver. Start your new chapter today.",
    features_list: [],
    trusted_by_title: "Trusted by 5,000+ ambitious brands",
    trusted_by_description: "From stealth startups to global enterprises, we deliver world-class visual identities that command attention.",
    stats_title: "Join the club",
    stats_list: [],
    portfolio_badge: "View Our Work",
    portfolio_title: "Recent Masterpieces",
    portfolio_description: "A glimpse into the visual identities we've crafted for brands around the globe. Click any image to view details.",
    pricing_badge: "Clear Pricing",
    pricing_title: "Simple, transparent pricing",
    pricing_description: "No hidden fees. No surprise charges. Choose the plan that best fits your brand's needs.",
    process_badge: "Our Process",
    process_title: "4 simple steps to launch",
    process_description: "We've eliminated the friction from traditional agency models. Here is how we deliver world-class identities so quickly.",
    process_list: [],
    case_studies_title: "More Case Studies",
    case_studies_description: "A curated collection of our finest brand identity projects.",
    faq_badge: "Got Questions?",
    faq_title: "Frequently asked questions",
    faq_description: "If you can't find what you're looking for, feel free to contact our support team.",
    cta_title: "Ready to elevate your brand?",
    cta_description: "Join thousands of successful businesses who trust us with their visual identity. Start your project today and get your initial concepts in as little as 24 hours.",
    cta_button1_text: "Let's get started",
    cta_button2_text: "Talk to our team",
    blog_badge: "Our Blog",
    blog_title: "Latest insights",
    blog_description: "Expert advice, design principles, and strategies to help your brand stand out in a crowded market.",
    header_size: "md",
    header_sticky: true,
    header_transparent: false,
    header_bg_color: "#ffffff",
    header_bg_opacity: 100,
    header_custom_html: "",
    footer_description: "Karna Logo Jangan Dibuat Biasa Saja",
    footer_social_links: [],
    footer_copyright: "© 2026 Kanglogo. All rights reserved.",
    footer_custom_html: "",
    seo_keywords: "",
    seo_author: "",
    seo_meta_robots: "index, follow",
    seo_canonical_url: "",
    seo_og_title: "",
    seo_og_description: "",
    seo_og_image: "",
    seo_og_type: "website",
    seo_twitter_card: "summary_large_image",
    seo_twitter_title: "",
    seo_twitter_description: "",
    seo_twitter_handle: "",
    payment_methods: [],
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (data && !error) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const finalValue = type === 'checkbox' ? e.target.checked : value;
    
    setSettings((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "favicon_url") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setSaving(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${field}-${Date.now()}.${fileExt}`;
    const filePath = `settings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) {
      showToast(`Error uploading: ${uploadError.message}`, "error");
      setSaving(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(filePath);

    setSettings((prev) => ({
      ...prev,
      [field]: publicUrlData.publicUrl,
    }));
    
    showToast("File uploaded successfully! Remember to Save Settings.", "success");
    setSaving(false);
  };

  // Dedicated Link Manager Helper Function for Navigation arrays
  const handleLinkChange = (field: keyof WebsiteSettings, index: number, key: "label" | "url", value: string) => {
    setSettings((prev) => {
      const arr = [...(prev[field] as { label: string; url: string }[])];
      arr[index][key] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addLink = (field: keyof WebsiteSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: [...(prev[field] as any), { label: "New Link", url: "#" }],
    }));
  };

  const removeLink = (field: keyof WebsiteSettings, index: number) => {
    setSettings((prev) => {
      const arr = [...(prev[field] as any)];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  const moveLink = (field: keyof WebsiteSettings, index: number, direction: 'up' | 'down') => {
    setSettings((prev) => {
      const arr = [...(prev[field] as any)];
      if (direction === 'up' && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      }
      return { ...prev, [field]: arr };
    });
  };

  const renderLinkManager = (title: string, desc: string, field: keyof WebsiteSettings) => {
    const links = settings[field] as { label: string; url: string }[];
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={() => addLink(field)} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Link
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-4">{desc}</p>
        
        <div className="space-y-3">
          {!links || links.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">No links configured.</div>
          ) : (
            links.map((link, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center self-start sm:self-center gap-1 shrink-0 p-1 opacity-50 group-hover:opacity-100">
                  <button type="button" onClick={() => moveLink(field, idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveLink(field, idx, 'down')} disabled={idx === links.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleLinkChange(field, idx, "label", e.target.value)}
                  placeholder="Label (e.g. About)"
                  className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleLinkChange(field, idx, "url", e.target.value)}
                  placeholder="URL (e.g. /about or https://...)"
                  className="w-full sm:flex-[1.5] bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <button type="button" onClick={() => removeLink(field, idx)} className="self-end sm:self-center p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Generic List Handlers for JSONB columns
  const handleListChange = (field: keyof WebsiteSettings, index: number, key: string, value: string) => {
    setSettings((prev) => {
      // @ts-expect-error dynamic typing
      const arr = [...(prev[field] as any[])];
      arr[index][key] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addListItem = (field: keyof WebsiteSettings, template: any) => {
    setSettings((prev) => ({
      ...prev,
      // @ts-expect-error dynamic typing
      [field]: [...(prev[field] as any[]), template],
    }));
  };

  const removeListItem = (field: keyof WebsiteSettings, index: number) => {
    setSettings((prev) => {
      // @ts-expect-error dynamic typing
      const arr = [...(prev[field] as any[])];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  const moveListItem = (field: keyof WebsiteSettings, index: number, direction: 'up' | 'down') => {
    setSettings((prev) => {
      // @ts-expect-error dynamic typing
      const arr = [...(prev[field] as any[])];
      if (direction === 'up' && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      }
      return { ...prev, [field]: arr };
    });
  };

  const renderFeaturesListManager = (title: string, desc: string, field: keyof WebsiteSettings) => {
    const items = settings[field] as { title: string; desc: string; icon: string }[];
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={() => addListItem(field, { title: "New Feature", desc: "Feature description...", icon: "Star" })} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-4">{desc}</p>
        
        <div className="space-y-3">
          {!items || items.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">No items configured.</div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center self-start sm:self-center gap-1 shrink-0 p-1 opacity-50 group-hover:opacity-100">
                  <button type="button" onClick={() => moveListItem(field, idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveListItem(field, idx, 'down')} disabled={idx === items.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleListChange(field, idx, "title", e.target.value)}
                  placeholder="Title"
                  className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <input
                  type="text"
                  value={item.desc}
                  onChange={(e) => handleListChange(field, idx, "desc", e.target.value)}
                  placeholder="Description..."
                  className="w-full sm:flex-[1.5] bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <div className="w-full sm:w-auto flex flex-col relative">
                   <select
                     value={item.icon}
                     onChange={(e) => handleListChange(field, idx, "icon", e.target.value)}
                     className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none cursor-pointer"
                   >
                     {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                   </select>
                </div>
                <button type="button" onClick={() => removeListItem(field, idx)} className="self-end sm:self-center p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderStatsListManager = (title: string, desc: string, field: keyof WebsiteSettings) => {
    const items = settings[field] as { value: string; suffix: string; label: string }[];
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={() => addListItem(field, { value: "0", suffix: "+", label: "New Stat" })} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Stat
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-4">{desc}</p>
        
        <div className="space-y-3">
          {!items || items.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">No items configured.</div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center self-start sm:self-center gap-1 shrink-0 p-1 opacity-50 group-hover:opacity-100">
                  <button type="button" onClick={() => moveListItem(field, idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveListItem(field, idx, 'down')} disabled={idx === items.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleListChange(field, idx, "value", e.target.value)}
                  placeholder="Value (e.g. 24)"
                  className="w-full sm:w-24 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <input
                  type="text"
                  value={item.suffix}
                  onChange={(e) => handleListChange(field, idx, "suffix", e.target.value)}
                  placeholder="Suffix (e.g. h)"
                  className="w-full sm:w-20 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => handleListChange(field, idx, "label", e.target.value)}
                  placeholder="Label (e.g. Average Delivery)"
                  className="w-full sm:flex-[2] bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <button type="button" onClick={() => removeListItem(field, idx)} className="self-end sm:self-center p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSocialListManager = (title: string, desc: string, field: keyof WebsiteSettings) => {
    // @ts-expect-error dynamic
    const items = settings[field] as { platform: string; url: string }[];
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={() => addListItem(field, { platform: "Instagram", url: "https://instagram.com/kanglogo" })} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Social Profile
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-4">{desc}</p>
        
        <div className="space-y-3">
          {!items || items.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">No profiles configured.</div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center self-start sm:self-center gap-1 shrink-0 p-1 opacity-50 group-hover:opacity-100">
                  <button type="button" onClick={() => moveListItem(field, idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveListItem(field, idx, 'down')} disabled={idx === items.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <select
                  value={item.platform}
                  onChange={(e) => handleListChange(field, idx, "platform", e.target.value)}
                  className="w-full sm:w-40 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 outline-none"
                >
                  {AVAILABLE_SOCIALS.map(soc => (
                    <option key={soc} value={soc}>{soc}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => handleListChange(field, idx, "url", e.target.value)}
                  placeholder="URL (e.g. https://instagram.com/username)"
                  className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <button type="button" onClick={() => removeListItem(field, idx)} className="self-end sm:self-center p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderPaymentListManager = (title: string, desc: string, field: keyof WebsiteSettings) => {
    // @ts-expect-error dynamic
    const items = settings[field] as { bank_name: string; account_name: string; account_number: string }[];
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={() => addListItem(field, { bank_name: "BANK BCA", account_name: "John Doe", account_number: "1234567890" })} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Payment Method
          </button>
        </div>
        <p className="text-xs font-medium text-slate-500 mb-4">{desc}</p>
        
        <div className="space-y-3">
          {!items || items.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">No payment methods configured.</div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center self-start sm:self-center gap-1 shrink-0 p-1 opacity-50 group-hover:opacity-100">
                  <button type="button" onClick={() => moveListItem(field, idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveListItem(field, idx, 'down')} disabled={idx === items.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <input
                  type="text"
                  value={item.bank_name}
                  onChange={(e) => handleListChange(field, idx, "bank_name", e.target.value)}
                  placeholder="Bank Name (e.g. BCA, PayPal)"
                  className="w-full sm:w-40 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 outline-none uppercase"
                />
                <input
                  type="text"
                  value={item.account_number}
                  onChange={(e) => handleListChange(field, idx, "account_number", e.target.value)}
                  placeholder="Account Number"
                  className="w-full sm:w-48 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 outline-none font-mono tracking-wider"
                />
                <input
                  type="text"
                  value={item.account_name}
                  onChange={(e) => handleListChange(field, idx, "account_name", e.target.value)}
                  placeholder="Account Holder Name"
                  className="w-full sm:flex-1 bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 transition-all outline-none"
                />
                <button type="button" onClick={() => removeListItem(field, idx)} className="self-end sm:self-center p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderTextInput = (label: string, field: keyof WebsiteSettings, placeholder: string, isTextArea = false) => (
    <div className="mb-4">
      <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">{label}</label>
      {isTextArea ? (
        <textarea
          name={field}
          value={settings[field] as string}
          onChange={handleChange}
          rows={3}
          placeholder={placeholder}
          className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          name={field}
          value={settings[field] as string}
          onChange={handleChange}
          placeholder={placeholder}
          className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none"
        />
      )}
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("System configurations have been successfully saved.", "success");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-wider uppercase">Loading Config...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden flex flex-col xl:flex-row">
      
      {/* Sidebar Tabs */}
      <div className="w-full xl:w-72 shrink-0 bg-slate-50/50 border-b xl:border-b-0 xl:border-r border-slate-100 p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Settings Menu</h3>
        <nav className="flex xl:flex-col gap-2 min-w-max xl:min-w-0 pb-2">
          {TAB_MENUS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50" 
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Form */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 relative">
        
        {/* Tab contents routing */}
        {activeTab === "website" && (
          <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Global Website Information</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Basic details that represent your portal across platforms.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="website_name" className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Website Name</label>
                  <input
                    type="text"
                    id="website_name"
                    name="website_name"
                    value={settings.website_name || ""}
                    onChange={handleChange}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Contact Phone</label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={settings.phone_number || ""}
                    onChange={handleChange}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Official Support Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={settings.email || ""}
                    onChange={handleChange}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">SEO Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={settings.description || ""}
                    onChange={handleChange}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Assets */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Brand Assets</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Visual identity and logos for your web appearance.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Main Logo</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group p-2">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="logo_upload" className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg inline-flex items-center transition-colors shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Upload Logo
                      </label>
                      <input
                        type="file"
                        id="logo_upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "logo_url")}
                        disabled={saving}
                      />
                      <p className="text-xs font-medium text-slate-500 mt-2">Recommended: 200x50px, PNG/SVG.<br/>Max size: 2MB.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Favicon (Browser Icon)</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group p-2">
                      {settings.favicon_url ? (
                        <img src={settings.favicon_url} alt="Favicon" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="favicon_upload" className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg inline-flex items-center transition-colors shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Upload Favicon
                      </label>
                      <input
                        type="file"
                        id="favicon_upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "favicon_url")}
                        disabled={saving}
                      />
                      <p className="text-xs font-medium text-slate-500 mt-2">Square ratio: 32x32px minimum.<br/>Max size: 1MB (.ICO/.PNG).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Color Tokens</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Dynamic theme overriding engine.
              </p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "color_primary", label: "Primary" },
                  { id: "color_secondary", label: "Secondary" },
                  { id: "color_theme1", label: "Theme 1" },
                  { id: "color_theme2", label: "Theme 2" },
                ].map((col) => (
                   <div key={col.id} className="relative group">
                     <label htmlFor={col.id} className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">{col.label}</label>
                     <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 p-1 pr-3">
                       <input
                         type="color"
                         id={col.id}
                         name={col.id}
                         // @ts-ignore
                         value={settings[col.id] || "#000000"}
                         onChange={handleChange}
                         className="h-9 w-10 border-0 rounded cursor-pointer bg-transparent p-0"
                       />
                        <span className="text-xs font-bold text-slate-500 ml-2 uppercase tracking-wide">
                          {/* @ts-ignore */}
                          {settings[col.id]}
                        </span>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Security controls */}
            <div>
              <h2 className="text-lg font-bold text-rose-600 tracking-tight mb-1">Danger Zone</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-rose-100 pb-4">
                Restricting application access globally.
              </p>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Enable Maintenance Mode</h4>
                  <p className="text-xs font-medium text-slate-500 mt-1">Locks out visitors except administrators.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_maintenance" checked={settings.is_maintenance || false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Deploying..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}

        {/* Tab content: Navigation */}
        {activeTab === "navigation" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             <div>
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Global Navigation Maps</h2>
               <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                 Manage menu endpoints injected across Header & Footer sections. Order affects visual placement.
               </p>

               <div className="space-y-6">
                 {renderLinkManager("Header Main Menu", "Primary navigation presented to all visitors beside your logo.", "header_links")}
                 {renderLinkManager("Footer (Services Column)", "Grid column typically mapping to your business offerings.", "footer_services_links")}
                 {renderLinkManager("Footer (Company Column)", "Grid column mapping internal corporate portals (About, Teams, Contact).", "footer_company_links")}
                 {renderLinkManager("Footer (Legal Column)", "Mandatory or bureaucratic portals related to policies.", "footer_legal_links")}
                 {renderLinkManager("Footer Bottom Layer", "Tiny horizontal links printed besides the Copyright notice.", "footer_bottom_links")}
               </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save Navigation"}
                </button>
              </div>
           </form>
        )}

        {/* Tab content: Landing Page */}
        {activeTab === "landing" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             
             {/* Hero Section */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">Hero Section</h2>
               {renderTextInput("Hero Badge / Subtitle", "hero_badge", "Fast, Premium Logo Design")}
               {renderTextInput("Hero Main Title", "hero_title", "Design your brand's perfect identity")}
               {renderTextInput("Hero Description", "hero_description", "Professional logo design...", true)}
               <div className="mt-6">
                 {renderFeaturesListManager("Core Features Config", "Shown below the hero buttons as 3 cards.", "features_list")}
               </div>
             </div>

             {/* Trusted By & Stats Section */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">Social Proof & Stats</h2>
               {renderTextInput("Trusted By Title", "trusted_by_title", "Trusted by 5,000+ ambitious brands")}
               {renderTextInput("Trusted By Description", "trusted_by_description", "From stealth startups to global enterprises...", true)}
               <div className="mt-6 border-t border-slate-100 pt-6">
                 {renderTextInput("Stats Banner Title", "stats_title", "Join the club")}
                 <div className="mt-4">
                   {renderStatsListManager("Numerical Statistics", "4 columns showing numbers with suffix.", "stats_list")}
                 </div>
               </div>
             </div>

             {/* Portfolio Section */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">Portfolio Gallery</h2>
               {renderTextInput("Portfolio Badge", "portfolio_badge", "View Our Work")}
               {renderTextInput("Portfolio Title", "portfolio_title", "Recent Masterpieces")}
               {renderTextInput("Portfolio Description", "portfolio_description", "A glimpse into the visual identities...", true)}
               <div className="mt-6 border-t border-slate-100 pt-6">
                 {renderTextInput("Case Studies Title", "case_studies_title", "More Case Studies")}
                 {renderTextInput("Case Studies Description", "case_studies_description", "A curated collection...", true)}
               </div>
             </div>

             {/* Pricing Section */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">Pricing</h2>
               {renderTextInput("Pricing Badge", "pricing_badge", "Clear Pricing")}
               {renderTextInput("Pricing Title", "pricing_title", "Simple, transparent pricing")}
               {renderTextInput("Pricing Description", "pricing_description", "No hidden fees...", true)}
             </div>

             {/* Process Steps Section */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">Workflow Process</h2>
               {renderTextInput("Process Badge", "process_badge", "Our Process")}
               {renderTextInput("Process Title", "process_title", "4 simple steps to launch")}
               {renderTextInput("Process Description", "process_description", "We've eliminated the friction...", true)}
               <div className="mt-4">
                 {renderFeaturesListManager("Process Steps", "Add workflows like Discovery, Ideation.", "process_list")}
               </div>
             </div>

             {/* FAQ & CTA Sections */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-2">FAQ & Footer Call-To-Action</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h3 className="text-md font-bold text-slate-700 mb-2">FAQ</h3>
                   {renderTextInput("FAQ Badge", "faq_badge", "Got Questions?")}
                   {renderTextInput("FAQ Title", "faq_title", "Frequently asked questions")}
                   {renderTextInput("FAQ Description", "faq_description", "If you can't find...", true)}
                 </div>
                 <div>
                   <h3 className="text-md font-bold text-slate-700 mb-2">Bottom CTA</h3>
                   {renderTextInput("CTA Title", "cta_title", "Ready to elevate your brand?")}
                   {renderTextInput("CTA Description", "cta_description", "Join thousands...", true)}
                   {renderTextInput("Button 1 Text", "cta_button1_text", "Let's get started")}
                   {renderTextInput("Button 2 Text", "cta_button2_text", "Talk to our team")}
                 </div>
               </div>
               <div className="mt-6 border-t border-slate-100 pt-6">
                 <h3 className="text-md font-bold text-slate-700 mb-2">Blog Module</h3>
                 {renderTextInput("Blog Badge", "blog_badge", "Our Blog")}
                 {renderTextInput("Blog Title", "blog_title", "Latest insights")}
                 {renderTextInput("Blog Description", "blog_description", "Expert advice, design principles...", true)}
               </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save Landing Page"}
                </button>
              </div>
           </form>
        )}


        {/* Tab content: Header */}
        {activeTab === "header" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Header Appearance</h2>
               
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Navigation Size</label>
                  <select
                    value={settings.header_size}
                    onChange={(e) => setSettings({ ...settings, header_size: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-hidden transition-all shadow-sm"
                  >
                    <option value="sm">Small (Compact)</option>
                    <option value="md">Medium (Default)</option>
                    <option value="lg">Large (Spacious)</option>
                  </select>
               </div>

               <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="header_sticky"
                    checked={settings.header_sticky}
                    onChange={(e) => setSettings({ ...settings, header_sticky: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="header_sticky" className="text-sm font-semibold text-slate-700">Enable Sticky Header (Fixed on Scroll)</label>
               </div>

               <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="header_transparent"
                    checked={settings.header_transparent}
                    onChange={(e) => setSettings({ ...settings, header_transparent: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="header_transparent" className="text-sm font-semibold text-slate-700">Transparent Background</label>
               </div>

               {!settings.header_transparent && (
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.header_bg_color}
                          onChange={(e) => setSettings({ ...settings, header_bg_color: e.target.value })}
                          className="w-10 h-10 rounded border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={settings.header_bg_color}
                          onChange={(e) => setSettings({ ...settings, header_bg_color: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-hidden transition-all uppercase"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Background Opacity</label>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{settings.header_bg_opacity}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={settings.header_bg_opacity}
                        onChange={(e) => setSettings({ ...settings, header_bg_opacity: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 font-medium mt-1">
                        <span>Transparent (0%)</span>
                        <span>Solid (100%)</span>
                      </div>
                    </div>
                 </div>
               )}
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Custom Code Injection</h2>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  Inject raw HTML, external Scripts, or CSS directly into the HTML <code>&lt;head&gt;</code> block. This is useful for Meta Tags, Analytics tracking snippets, or external APIs.
                </p>
                <div>
                  <textarea
                    value={settings.header_custom_html}
                    onChange={(e) => setSettings({ ...settings, header_custom_html: e.target.value })}
                    rows={8}
                    className="w-full bg-slate-900 border border-slate-800 text-green-400 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-4 outline-hidden transition-all shadow-inner"
                    placeholder="<!-- Analytics -->&#10;<script src='https://analytics.example.com/js'></script>&#10;&#10;<meta name='google-site-verification' content='...' />"
                  />
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save Header Settings"}
                </button>
              </div>
           </form>
        )}

        {/* Tab content: Footer */}
        {activeTab === "footer" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Footer Branding</h2>
                {renderTextInput("Description (Under Logo)", "footer_description", "Karna Logo Jangan Dibuat Biasa Saja", true)}
                {renderTextInput("Copyright Notice", "footer_copyright", "© 2026 Kanglogo. All rights reserved.")}
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Social Profiles</h2>
                {renderSocialListManager("Social Media Networks", "Manage external social media profiles that map to their respective icons.", "footer_social_links")}
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Footer Custom Code Injection</h2>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  Inject raw HTML or Javascript at the bottom of the document body. Useful for pixel trackers, chat widgets, or deferred scripts.
                </p>
                <div>
                  <textarea
                    value={settings.footer_custom_html}
                    onChange={(e) => setSettings({ ...settings, footer_custom_html: e.target.value })}
                    rows={8}
                    className="w-full bg-slate-900 border border-slate-800 text-green-400 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-4 outline-hidden transition-all shadow-inner"
                    placeholder="<!-- Chat Widget ID -->&#10;<script src='https://js.example.com/widget.js'></script>"
                  />
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save Footer Settings"}
                </button>
              </div>
           </form>
        )}

        {/* Tab content: SEO Engine */}
        {activeTab === "seo" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Basic Meta Settings</h2>
                {renderTextInput("Keywords (Comma Separated)", "seo_keywords", "logo maker, vector design, branding", true)}
                {renderTextInput("Author / Creator", "seo_author", "Kanglogo Agency")}
                
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Robots Directive</label>
                  <select
                    value={settings.seo_meta_robots}
                    onChange={(e) => setSettings({ ...settings, seo_meta_robots: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-hidden transition-all shadow-sm"
                  >
                    <option value="index, follow">Index, Follow (Recommended)</option>
                    <option value="noindex, follow">NoIndex, Follow</option>
                    <option value="index, nofollow">Index, NoFollow</option>
                    <option value="noindex, nofollow">NoIndex, NoFollow</option>
                  </select>
                </div>
                {renderTextInput("Canonical URL Override (Leave empty for dynamic)", "seo_canonical_url", "https://yourdomain.com")}
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Open Graph (Facebook, LinkedIn, Discord)</h2>
                {renderTextInput("OG Title (Overrides main title if set)", "seo_og_title", "")}
                {renderTextInput("OG Description", "seo_og_description", "", true)}
                {renderTextInput("OG Type", "seo_og_type", "website")}
                
                <div>
                  <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">OG / Social Image</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-32 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group p-2">
                      {settings.seo_og_image ? (
                        <img src={settings.seo_og_image} alt="OG" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="og_image_upload" className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg inline-flex items-center transition-colors shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Upload Social Cover
                      </label>
                      <input
                        type="file"
                        id="og_image_upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "seo_og_image" as any)}
                        disabled={saving}
                      />
                      <p className="mt-2 text-xs font-medium text-slate-400">Recommended size: 1200x630px.</p>
                      {settings.seo_og_image && (
                         <div className="mt-2">
                           <input type="text" readOnly value={settings.seo_og_image} className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded block w-full p-2 outline-hidden text-ellipsis overflow-hidden whitespace-nowrap" />
                         </div>
                      )}
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Twitter Cards</h2>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Card Format</label>
                  <select
                    value={settings.seo_twitter_card}
                    onChange={(e) => setSettings({ ...settings, seo_twitter_card: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-hidden transition-all shadow-sm"
                  >
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="summary">Summary (Small Image)</option>
                  </select>
                </div>
                {renderTextInput("Twitter Title", "seo_twitter_title", "")}
                {renderTextInput("Twitter Description", "seo_twitter_description", "", true)}
                {renderTextInput("Twitter Profile Handle (@)", "seo_twitter_handle", "@kanglogo")}
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save SEO Metadata"}
                </button>
              </div>
           </form>
        )}

        {/* Tab content: Payment Method */}
        {activeTab === "payment" && (
           <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Payment Solutions</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Register authorized bank accounts or digital wallets here. These options will be offered to clients upon checkout or invoice generation.
                  </p>
                </div>
                
                {renderPaymentListManager("Accounts & E-Wallets", "List your active payment receptors.", "payment_methods")}
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Deploying..." : "Save Payment Methods"}
                </button>
              </div>
           </form>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== "website" && activeTab !== "navigation" && activeTab !== "landing" && activeTab !== "header" && activeTab !== "footer" && activeTab !== "seo" && activeTab !== "payment" && (
           <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
             <Settings className="w-12 h-12 text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Configuration Under Construction</h3>
             <p className="text-sm font-medium text-slate-500 mt-2">The <span className="text-indigo-600 font-bold uppercase">{activeTab}</span> module is currently disabled pending updates.</p>
           </div>
        )}

      </div>
    </div>
  );
}
