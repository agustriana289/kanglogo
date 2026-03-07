"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Trash2, Pencil, Loader2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { title: "", content: "", type: "info", is_active: true };

export default function AnnouncementsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      if (editingId) {
        const { error } = await supabase
          .from("site_announcements")
          .update({ ...form })
          .eq("id", editingId);
        if (error) throw error;
        showToast("Announcement updated", "success");
      } else {
        const { error } = await supabase
          .from("site_announcements")
          .insert({ ...form, created_by: user.id });
        if (error) throw error;

        supabase.channel("global_notifications").send({
          type: "broadcast",
          event: "new_notification",
          payload: {
            role: "user",
            type: form.type === "warning" ? "error" : "info",
            title: "New Announcement",
            message: form.title,
            link: "/dashboard",
          },
        });

        showToast("Announcement published", "success");
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAnnouncements();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      content: ann.content || "",
      type: ann.type || "info",
      is_active: ann.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const { error } = await supabase.from("site_announcements").delete().eq("id", id);
      if (error) throw error;
      showToast("Announcement deleted", "success");
      fetchAnnouncements();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      showToast(message, "error");
    }
  };

  const TYPE_STYLES: Record<string, string> = {
    info: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
  };

  const inputClass =
    "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage global broadcast messages for all clients.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Megaphone className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No announcements yet</p>
            <p className="text-xs mt-1">Create your first announcement to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Title & Content</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    {ann.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                        <X className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="font-bold text-slate-900 text-sm">{ann.title}</p>
                    {ann.content && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ann.content}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${TYPE_STYLES[ann.type] ?? TYPE_STYLES.info}`}>
                      {ann.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {format(new Date(ann.created_at), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(ann)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Main headline..."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="info">Information (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Alert (Amber)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Status</label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 h-[46px]">
                    <span className="text-sm font-bold text-slate-700">
                      {form.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_active: !form.is_active })}
                      className={`w-10 h-5 rounded-full relative transition-all ${form.is_active ? "bg-indigo-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_active ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Content / Message</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Provide more details here..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  className="flex-2 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Saving..." : editingId ? "Update Announcement" : "Publish Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
