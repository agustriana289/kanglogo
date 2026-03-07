"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Save, AlertCircle, ArrowLeft, Loader2, Link as LinkIcon, Building, MapPin, Building2, User, Mail } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function EditProfileClient({ profile }: { profile: any }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // States khusus input
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [company, setCompany] = useState(profile.company || "");
  const [location, setLocation] = useState(profile.location || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Kirim piringan data pembaruan ke Supabase
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        company: company,
        location: location,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Supabase update error:", error);
      setErrorMsg(`Failed to save profile changes: ${error.message} (${error.code})`);
      setLoading(false);
      return;
    }

    // Refresh halaman dan pantulan Next.js
    router.refresh();
    router.push(`/dashboard/user/${profile.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Link 
          href={`/dashboard/user/${profile.id}`}
          className="w-10 h-10 bg-white rounded-xl shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Profile</h1>
          <p className="text-sm font-medium text-slate-500">Update your personal and business details here.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden relative">
        {/* Dekorasi kecil estetis */}
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="shrink-0 p-1.5 bg-slate-50 ring-1 ring-slate-100 rounded-2xl shadow-sm">
             <Avatar 
                url={avatarUrl}
                name={fullName || profile.email || "U"}
                imageClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover"
                fallbackClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl font-bold"
              />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Profile Picture Reference</h3>
            <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
              For now, please provide a valid public image URL to update your avatar. Make sure it starts with "http://" or "https://". Upload feature is currently disabled.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Avatar URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="url" 
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Company / Organization */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Company / Organization</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Kanglogo Studio"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jakarta, Indonesia"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            
            {/* Account Email (Disabled) */}
            <div className="sm:col-span-2 space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 Account Email 
                 <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">LOCKED</span>
               </label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400/50" />
                  </div>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/50 border border-slate-200 text-sm font-medium text-slate-500 rounded-xl cursor-not-allowed shadow-none focus:outline-none"
                  />
               </div>
               <p className="text-xs font-medium text-slate-400/80 mt-1.5">Email addresses are tied to Google Authentication and cannot be changed here.</p>
            </div>
          </div>

          <div className="pt-8 flex sm:justify-start">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-full shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
