"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Save, Globe, Clock, Star, Box, Check, X, Layers, MessageSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface ServicePackage {
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface FormField {
  label: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface KeyFeature {
  title: string;
  description: string;
  icon: string;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  thumbnail_url: string;
  packages: ServicePackage[];
  form_fields: FormField[];
  key_features: KeyFeature[];
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
}

const emptyForm: Omit<Service, "id"> = { 
  title: "", 
  slug: "", 
  description: "", 
  category: "Design", 
  icon: "Briefcase", 
  thumbnail_url: "", 
  packages: [{ name: "Standard", price: 0, description: "Standard Package", features: [] }], 
  form_fields: [{ label: "Project Details", type: "textarea", required: true }], 
  key_features: [],
  is_published: false, 
  is_featured: false, 
  sort_order: 0 
};

export default function ServicesClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Service, "id">>(emptyForm);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("store_services").select("*").order("sort_order", { ascending: true });
    if (error) {
      showToast("Failed to fetch services", "error");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openNew = () => {
    setEditingService(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setForm({ 
      title: svc.title, 
      slug: svc.slug, 
      description: svc.description, 
      category: svc.category, 
      icon: svc.icon, 
      thumbnail_url: svc.thumbnail_url || "", 
      packages: svc.packages || [], 
      form_fields: svc.form_fields || [], 
      key_features: svc.key_features || [],
      is_published: svc.is_published,  
      is_featured: svc.is_featured, 
      sort_order: svc.sort_order 
    });
    setView("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) return showToast("Title and Slug are required", "error");
    setSaving(true);
    if (editingService) {
      const { error } = await supabase.from("store_services").update({ ...form }).eq("id", editingService.id);
      if (error) showToast("Failed to update service", "error");
      else { showToast("Service updated", "success"); setView("list"); fetchServices(); }
    } else {
      const { error } = await supabase.from("store_services").insert(form);
      if (error) showToast("Failed to create service", "error");
      else { showToast("Service created", "success"); setView("list"); fetchServices(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from("store_services").delete().eq("id", id);
    if (error) showToast("Failed to delete service", "error");
    else { showToast("Service deleted", "success"); fetchServices(); }
  };

  const togglePublished = async (svc: Service) => {
    const { error } = await supabase.from("store_services").update({ is_published: !svc.is_published }).eq("id", svc.id);
    if (error) showToast("Failed to update status", "error");
    else fetchServices();
  };

  // Form helpers
  const updatePackage = (index: number, field: keyof ServicePackage, value: string | number) => {
    const pkgs = [...form.packages];
    pkgs[index] = { ...pkgs[index], [field]: value };
    setForm({ ...form, packages: pkgs });
  };
  const addPackage = () => setForm({ ...form, packages: [...form.packages, { name: "New Plan", price: 0, description: "", features: [] }] });
  const removePackage = (index: number) => setForm({ ...form, packages: form.packages.filter((_, i) => i !== index) });
  
  const addFeature = (pkgIndex: number) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features.push("");
    setForm({ ...form, packages: pkgs });
  };
  const updateFeature = (pkgIndex: number, featIndex: number, val: string) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features[featIndex] = val;
    setForm({ ...form, packages: pkgs });
  };
  const removeFeature = (pkgIndex: number, featIndex: number) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features.splice(featIndex, 1);
    setForm({ ...form, packages: pkgs });
  };

  const addField = () => setForm({ ...form, form_fields: [...form.form_fields, { label: "New Question", type: "text", required: false }] });
  const removeField = (index: number) => setForm({ ...form, form_fields: form.form_fields.filter((_, i) => i !== index) });
  const updateField = (index: number, field: keyof FormField, value: string | boolean | string[]) => {
    const fields = [...form.form_fields];
    fields[index] = { ...fields[index], [field]: value };
    setForm({ ...form, form_fields: fields });
  };

  const addKeyFeature = () => setForm({ ...form, key_features: [...(form.key_features || []), { title: "New Highlight", description: "Details about this feature", icon: "CheckCircle2" }] });
  const removeKeyFeature = (index: number) => setForm({ ...form, key_features: (form.key_features || []).filter((_, i) => i !== index) });
  const updateKeyFeature = (index: number, field: keyof KeyFeature, value: string) => {
    const kfs = [...(form.key_features || [])];
    kfs[index] = { ...kfs[index], [field]: value };
    setForm({ ...form, key_features: kfs });
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  if (view === "form") {
    return (
      <div className="pt-6 px-4 pb-16 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingService ? "Update Service" : "Save Service"}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Title</label>
                    <input required value={form.title} onChange={e => {
                        const title = e.target.value;
                        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        setForm(p => ({ ...p, title, slug }));
                    }} placeholder="e.g. Website Development" className={`${inputClass} font-semibold`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Slug</label>
                    <input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className={`${inputClass} font-mono text-slate-500`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your service offering..." className={`${inputClass} resize-none`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Image URL</label>
                    <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." className={inputClass} />
                    {form.thumbnail_url && <img src={form.thumbnail_url} alt="Preview" className="h-20 max-w-full rounded-xl object-cover mt-2 border border-slate-200 shadow-sm" />}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category & Order</label>
                    <div className="flex gap-2">
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={`${inputClass} flex-1`}>
                        <option>Design</option>
                        <option>Development</option>
                        <option>Marketing</option>
                        <option>Consulting</option>
                        <option>Other</option>
                      </select>
                      <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} placeholder="Order" className={`${inputClass} w-24`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Packages */}
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" /> Pricing Packages</h3>
                  <button type="button" onClick={addPackage} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"><Plus className="w-3 h-3"/> Add Plan</button>
                </div>
                
                <div className="space-y-6">
                  {form.packages.map((pkg, pIdx) => (
                    <div key={pIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                      <button type="button" onClick={() => removePackage(pIdx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                      <div className="grid grid-cols-2 gap-4 mb-4 pr-10">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan Name</label>
                          <input value={pkg.name} onChange={e => updatePackage(pIdx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Price (IDR)</label>
                          <input type="number" value={pkg.price} onChange={e => updatePackage(pIdx, 'price', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-indigo-600" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</label>
                        <input value={pkg.description} onChange={e => updatePackage(pIdx, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Features Checklist</label>
                           <button type="button" onClick={() => addFeature(pIdx)} className="text-[10px] text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">Add Feature</button>
                        </div>
                        <div className="space-y-2">
                           {pkg.features.map((feat, fIdx) => (
                             <div key={fIdx} className="flex items-center gap-2">
                               <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                               <input value={feat} onChange={e => updateFeature(pIdx, fIdx, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700" placeholder="e.g. Free 1 year domain" />
                               <button type="button" onClick={() => removeFeature(pIdx, fIdx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                             </div>
                           ))}
                           {pkg.features.length === 0 && <div className="text-xs text-slate-400 italic">No features added.</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.packages.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">No pricing packages. Click &apos;Add Plan&apos; to create one.</div>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Publishing Status */}
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Status</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">{form.is_published ? <Globe className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-400" />} {form.is_published ? "Published" : "Draft"}</p>
                        <p className="text-xs text-slate-400">Visibility on site</p>
                      </div>
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))} className={`w-11 h-6 rounded-full relative transition-all ${form.is_published ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_published ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2"><Star className={`w-4 h-4 ${form.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} /> Featured</p>
                        <p className="text-xs text-slate-400">Show on landing page</p>
                      </div>
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_featured: !p.is_featured }))} className={`w-11 h-6 rounded-full relative transition-all ${form.is_featured ? "bg-yellow-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_featured ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                 </div>
              </div>

              {/* Requirement Form Builder */}
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-500" /> Client Requirements</h3>
                  <button type="button" onClick={addField} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Add</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {form.form_fields.map((f, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                        <button type="button" onClick={() => removeField(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Question</label>
                              <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" />
                           </div>
                           <div className="flex gap-2">
                              <div className="flex-1">
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Type</label>
                                 <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs">
                                    <option value="text">Text Base</option>
                                    <option value="textarea">Paragraph</option>
                                    <option value="select">Dropdown</option>
                                    <option value="file">File Upload</option>
                                 </select>
                              </div>
                              <div className="w-16 flex flex-col items-center">
                                 <label className="text-[9px] font-bold uppercase text-slate-500 pb-1">Req.</label>
                                 <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                              </div>
                           </div>
                           {f.type === "select" && (
                              <div>
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Options (Comma separated)</label>
                                 <input value={f.options?.join(",") || ""} onChange={e => updateField(i, 'options', e.target.value.split(",").map(s => s.trim()))} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="Opt 1, Opt 2" />
                              </div>
                           )}
                        </div>
                     </div>
                   ))}
                   {form.form_fields.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No order form fields defined.</div>}
                </div>
              </div>

              {/* Service Highlights / Key Features */}
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 text-indigo-500 fill-indigo-500" /> Service Highlights</h3>
                  <button type="button" onClick={addKeyFeature} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Add</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {(form.key_features || []).map((kf, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative mt-3">
                        <button type="button" onClick={() => removeKeyFeature(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-2">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Highlight Title</label>
                                <input value={kf.title} onChange={e => updateKeyFeature(i, 'title', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" placeholder="e.g. Quality Assured" />
                             </div>
                             <div>
                                <label className="text-[9px] font-bold uppercase text-slate-500">Icon Name</label>
                                <input value={kf.icon} onChange={e => updateKeyFeature(i, 'icon', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="CheckCircle2" />
                             </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Description</label>
                              <textarea rows={2} value={kf.description} onChange={e => updateKeyFeature(i, 'description', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs resize-none" placeholder="Short detail..." />
                           </div>
                        </div>
                     </div>
                   ))}
                   {(!form.key_features || form.key_features.length === 0) && <div className="text-xs text-slate-400 text-center py-4">No highlights added. These will appear below the description.</div>}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Services Directory</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage professional service offerings and packages.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> New Service
        </button>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Box className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">No services defined</p>
            <p className="text-xs mt-1">Add your first service offering</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Service Details</th>
                  <th className="px-6 py-4">Packages</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map(svc => (
                  <tr key={svc.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                             {svc.thumbnail_url ? <img src={svc.thumbnail_url} className="w-full h-full object-cover" alt={svc.title}/> : <Box className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900">{svc.title}</p>
                             <div className="flex gap-2 items-center mt-1">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{svc.category}</span>
                               {svc.is_featured && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 rounded uppercase font-bold tracking-widest flex items-center"><Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500" /> Featured</span>}
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex -space-x-1.5">
                         {svc.packages?.map((p, i) => (
                           <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-indigo-600 shadow-sm" title={p.name}>
                             {p.name.charAt(0).toUpperCase()}
                           </div>
                         ))}
                       </div>
                       <p className="text-xs text-slate-400 mt-1.5">{svc.packages?.length || 0} Pricing plans</p>
                    </td>
                    <td className="px-6 py-4">
                       <button onClick={() => togglePublished(svc)} className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                         {svc.is_published 
                           ? <><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> <span className="text-emerald-700">Published</span></>
                           : <><div className="w-2 h-2 rounded-full bg-slate-300"></div> <span className="text-slate-500">Draft</span></>}
                       </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(svc)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(svc.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
