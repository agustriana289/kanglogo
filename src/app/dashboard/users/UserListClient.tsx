"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, Filter, ShieldCheck, User as UserIcon, ChevronLeft, ChevronRight, Loader2, Mail, ExternalLink } from "lucide-react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { getTimeAgo } from "@/utils/dateFormatter";

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  company: string | null;
  location: string | null;
  created_at: string;
};

export default function UserListClient() {
  const supabase = createClient();
  const PAGE_SIZE = 20;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "client">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from("users").select("*", { count: "exact" });

    // Apply Filters
    if (roleFilter === "admin") {
      query = query.eq("is_admin", true);
    } else if (roleFilter === "client") {
      query = query.eq("is_admin", false);
    }

    if (searchQuery.trim().length > 0) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    // Execute
    const { data, error, count } = await query;

    if (!error && data) {
      setUsers(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const maxPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="flex flex-col flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
      
      {/* Header / Tools Area */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        
        {/* Search */}
        <div className="relative w-full sm:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to page 1 on new search
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-sm font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shrink-0 flex items-center shadow-sm">
            <button 
              onClick={() => { setRoleFilter("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${roleFilter === "all" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              All
            </button>
            <button 
              onClick={() => { setRoleFilter("client"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors space-x-1.5 ${roleFilter === "client" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              Client
            </button>
            <button 
              onClick={() => { setRoleFilter("admin"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors space-x-1.5 flex items-center gap-1 ${roleFilter === "admin" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
             <div className="bg-white p-3 rounded-2xl shadow-lg ring-1 ring-slate-100 text-indigo-600 flex items-center gap-3 font-bold text-sm tracking-wide">
               <Loader2 className="w-5 h-5 animate-spin" /> Fetching Users...
             </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white sticky top-0 z-0">
            <tr>
              <th scope="col" className="p-4 pl-6 text-left text-xs font-bold uppercase tracking-wider text-slate-400">User Identity</th>
              <th scope="col" className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Position / Role</th>
              <th scope="col" className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Company & Loc</th>
              <th scope="col" className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Joined</th>
              <th scope="col" className="p-4 pr-6 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {users.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 text-sm italic font-medium">
                   No users found matching your criteria.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="p-4 pl-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 p-0.5 bg-slate-100 rounded-full border border-slate-200 group-hover:border-indigo-200 transition-colors">
                        <Avatar 
                          url={u.avatar_url}
                          name={u.full_name || u.email || "U"}
                          imageClassName="w-10 h-10 rounded-full object-cover"
                          fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 font-bold"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-tight">
                          {u.full_name || "Unset Name"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-slate-500">
                          <Mail className="w-3 h-3 opacity-60" /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                        <UserIcon className="w-3.5 h-3.5" /> Client
                      </span>
                    )}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-700">
                      {u.company || "-"}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5">
                      {u.location || "-"}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap text-sm font-medium text-slate-500">
                    <span title={new Date(u.created_at).toLocaleString()}>{getTimeAgo(u.created_at)}</span>
                  </td>
                  <td className="p-4 pr-6 whitespace-nowrap text-right">
                    <Link 
                      href={`/dashboard/user/${u.id}`}
                      className="inline-flex items-center justify-center bg-white text-indigo-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Showing <span className="text-slate-900">{(page - 1) * PAGE_SIZE + (users.length > 0 ? 1 : 0)}</span> to <span className="text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="text-slate-900">{totalCount}</span> Users
        </span>

        <div className="flex items-center gap-2">
          <button 
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded-lg">
            Page {page} of {maxPages}
          </div>

          <button 
            disabled={page >= maxPages}
            onClick={() => setPage(p => Math.min(maxPages, p + 1))}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
