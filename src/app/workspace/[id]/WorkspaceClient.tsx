"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  CheckCircle2, 
  MoreVertical,
  User,
  Zap,
  Briefcase,
  Calendar,
  Search,
  ShieldCheck,
  Loader2,
  X,
  Star,
  PartyPopper,
  Image as ImageIcon,
  Upload,
  Download,
  FileCheck,
  CreditCard,
  AlertCircle,
  Package
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";

export default function WorkspaceClient({ order, user, isAdmin, clientName, adminName }: { 
  order: any; 
  user: any; 
  isAdmin: boolean;
  clientName: string;
  adminName: string;
}) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(20);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Testimonial States
  const [testimonial, setTestimonial] = useState<any>(null);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [testimonialComment, setTestimonialComment] = useState("");
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  // Portfolio States
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    category: "",
    images: [] as string[],
    tags: [] as string[],
    is_published: true,
  });
  const [portfolioTagInput, setPortfolioTagInput] = useState("");

  // Payment Proof
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>(order.payment_proof || "");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [savingProof, setSavingProof] = useState(false);

  // Delivery File (Shop)
  const [deliveryFileUrl, setDeliveryFileUrl] = useState<string>(order.delivery_file || "");
  const [uploadingDelivery, setUploadingDelivery] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const isShopOrder = !!order.product_id;
  const isServiceOrder = !!order.service_id;
  const [currentStatus, setCurrentStatus] = useState<string>(order.status || "pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleOpenPortfolioModal = () => {
    setPortfolioForm(prev => ({
      ...prev,
      title: getProjectName(),
      category: order.store_services?.category || order.store_products?.category || "Logo Design"
    }));
    setIsPortfolioModalOpen(true);
  };

  useEffect(() => {
    async function initWorkspace() {
      setIsInitializing(true);
      try {
        let { data: ws, error: fetchError } = await supabase
          .from("store_workspaces")
          .select("id, order_id, user_id, status")
          .eq("order_id", order.id)
          .maybeSingle();
        
        if (!ws && !fetchError) {
          const { data: newWs, error: insertError } = await supabase.from("store_workspaces").insert({
            order_id: order.id,
            user_id: order.user_id,
          }).select().single();
          
          if (insertError) throw insertError;
          ws = newWs;
        } else if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        
        setWorkspace(ws);

        // Memanggil data testimoni existing
        const { data: existingTestimonial } = await supabase
          .from("store_testimonials")
          .select("*")
          .eq("order_id", order.id)
          .maybeSingle();
        
        if (existingTestimonial) {
          setTestimonial(existingTestimonial);
        }

        if (ws) {
          const { data: msgs, error: msgsError } = await supabase
            .from("store_messages")
            .select("id, workspace_id, sender_id, content, created_at")
            .eq("workspace_id", ws.id)
            .order("created_at", { ascending: true });
          
          if (msgsError) console.error("Messages fetch error:", msgsError);

          if (msgs && msgs.length > 0) {
            const { data: profiles } = await supabase
              .from("users")
              .select("id, full_name, avatar_url, is_admin, email");
            
            const profileMap: Record<string, any> = {};
            (profiles || []).forEach(p => { profileMap[p.id] = p; });

            const enriched = msgs.map(m => ({
              ...m,
              sender: profileMap[m.sender_id] || null
            }));
            setMessages(enriched);
          } else {
            setMessages([]);
          }

          const channel = supabase
            .channel(`workspace_${ws.id}`)
            .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'store_messages',
              filter: `workspace_id=eq.${ws.id}` 
            }, async (payload) => {
              const { data: sender } = await supabase
                .from("users")
                .select("id, full_name, avatar_url, is_admin, email")
                .eq("id", payload.new.sender_id)
                .maybeSingle();
              
              const newMsg = { ...payload.new, sender: sender || null };
              setMessages(prev => [...prev, newMsg]);
            })
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (err: any) {
        showToast(err.message || "Failed to initialize workspace", "error");
      } finally {
        setIsInitializing(false);
      }
    }
    initWorkspace();
  }, [order.id, order.user_id, supabase, showToast]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isOldestFirst = sortOrder === "asc";
    
    if (isOldestFirst) {
      if (target.scrollTop < 50 && visibleCount < messages.length) {
        const prevHeight = target.scrollHeight;
        setVisibleCount(prev => Math.min(prev + 20, messages.length));
        setTimeout(() => {
          target.scrollTop = target.scrollHeight - prevHeight;
        }, 0);
      }
    } else {
      const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
      if (isAtBottom && visibleCount < messages.length) {
        setVisibleCount(prev => Math.min(prev + 20, messages.length));
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current && sortOrder === "asc" && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isInitializing, messages.length, sortOrder]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!workspace) {
      showToast("Workspace not initialized. Please wait or refresh.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("store_messages").insert({
        workspace_id: workspace.id,
        sender_id: user.id,
        content: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingTestimonial) return;

    setSubmittingTestimonial(true);
    try {
      const { data, error } = await supabase.from("store_testimonials").insert({
        order_id: order.id,
        user_id: user.id,
        client_name: clientName,
        rating_quality: ratingQuality,
        rating_communication: ratingCommunication,
        rating_speed: ratingSpeed,
        comment: testimonialComment.trim()
      }).select().single();

      if (error) throw error;
      setTestimonial(data);
      showToast("Thank you for your feedback!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to submit testimonial", "error");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolioForm.images.length === 0) return showToast("Upload at least one image", "error");
    setPortfolioSaving(true);
    
    // Fallback to order details if not filled
    const pTitle = portfolioForm.title || getProjectName() || "Project Workspace";
    const pCat = portfolioForm.category || order.store_services?.category || order.store_products?.category || "Uncategorized";

    const payload = { 
      ...portfolioForm, 
      title: pTitle,
      category: pCat,
      order_id: order.id 
    };
    
    const { error } = await supabase.from("store_portfolios").insert(payload);
    
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Project published to portfolio!", "success");
      setIsPortfolioModalOpen(false);
    }
    setPortfolioSaving(false);
  };

  const addPortfolioTag = () => {
    const t = portfolioTagInput.trim();
    if (t && !portfolioForm.tags.includes(t)) {
      setPortfolioForm(f => ({ ...f, tags: [...f.tags, t] }));
    }
    setPortfolioTagInput("");
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "proof" | "delivery"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === "proof" && !file.type.startsWith("image/")) {
      showToast("Please upload an image file for payment proof.", "error");
      return;
    }
    const setUploading = mode === "proof" ? setUploadingProof : setUploadingDelivery;
    const setUrl = mode === "proof" ? setPaymentProofUrl : setDeliveryFileUrl;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${mode}-${order.id}-${Date.now()}.${fileExt}`;
      const filePath = `${mode === "proof" ? "payment-proofs" : "deliveries"}/${fileName}`;
      const { error } = await supabase.storage.from("assets").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
      setUrl(publicUrl);
      showToast(mode === "proof" ? "Payment proof uploaded!" : "File uploaded!", "success");
    } catch (err: any) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProof = async () => {
    if (!paymentProofUrl) return;
    setSavingProof(true);
    const { error } = await supabase.from("store_orders").update({
      payment_proof: paymentProofUrl,
      status: "waiting_payment",
    }).eq("id", order.id);
    if (error) showToast(error.message, "error");
    else showToast("Payment proof sent! Waiting for admin confirmation.", "success");
    setSavingProof(false);
  };

  const handleConfirmPayment = async () => {
    const { error } = await supabase.from("store_orders").update({
      status: "processing",
      payment_status: "paid",
    }).eq("id", order.id);
    if (error) showToast(error.message, "error");
    else showToast("Payment confirmed. Project is now processing!", "success");
  };

  const handleSaveDelivery = async () => {
    if (!deliveryFileUrl) return;
    setSavingDelivery(true);
    const { error } = await supabase.from("store_orders").update({
      delivery_file: deliveryFileUrl,
    }).eq("id", order.id);
    if (error) showToast(error.message, "error");
    else showToast("Delivery file saved. Client can now download it.", "success");
    setSavingDelivery(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("store_orders").update({ status: newStatus }).eq("id", order.id);
    if (error) showToast(error.message, "error");
    else { setCurrentStatus(newStatus); showToast(`Status updated to ${newStatus}`, "success"); }
    setUpdatingStatus(false);
  };

  const counterpartName = isAdmin ? clientName : adminName;
  const counterpartRole = isAdmin ? "Klien" : "Administrator";
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  const isChatLocked = (isCompleted || isCancelled) && !isAdmin;

  const filteredMessages = useMemo(() => {
    let list = [...messages];
    if (searchQuery.trim()) {
      list = list.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
    if (!searchQuery.trim()) {
      if (sortOrder === "asc") {
        return list.slice(Math.max(0, list.length - visibleCount));
      } else {
        return list.slice(0, visibleCount);
      }
    }
    return list;
  }, [messages, searchQuery, sortOrder, visibleCount]);

  const getProjectName = () => {
    try {
      const fd = typeof order.form_data === 'string' ? JSON.parse(order.form_data) : (order.form_data || {});
      const baseTitle = order.store_services?.title || order.store_products?.title;
      const pkg = typeof order.selected_package === "string" ? JSON.parse(order.selected_package) : (order.selected_package || {});
      const pkgName = pkg?.name || "";
      const projectNote = fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
      
      if (baseTitle && projectNote) return `${baseTitle} — ${projectNote}`;
      if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
      if (baseTitle) return baseTitle;
      if (pkgName && projectNote) return `${pkgName} — ${projectNote}`;
      return pkgName || fd.customer_name || "Project";
    } catch (e) {
      return order.store_services?.title || order.store_products?.title || "Project";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* CHAT PANEL */}
        <div className="xl:col-span-2 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 xl:order-none order-last">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 relative">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center relative shadow-sm">
                    {isAdmin ? (
                      order.client?.avatar_url ? (
                        <img src={order.client.avatar_url} className="w-full h-full object-cover rounded-xl" alt="Avatar" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )
                    ) : (
                      order.admin?.avatar_url ? (
                        <img src={order.admin.avatar_url} className="w-full h-full object-cover rounded-xl" alt="Avatar" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )
                    )}
                   <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-slate-900">{counterpartName}</h4>
                   <p className="text-xs font-medium text-slate-500">
                      {counterpartRole ? `${counterpartRole} • ` : ""}Active now
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                {isSearchOpen ? (
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input 
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="bg-transparent border-none text-xs font-medium focus:ring-0 w-32 md:w-48 outline-none"
                    />
                    <button type="button" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-all">
                    <Search className="w-4 h-4" />
                  </button>
                )}
                
                <div className="relative">
                  <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-all flex items-center justify-center">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1.5 z-50">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort Messages</p>
                        
                        <button type="button"
                          onClick={() => { setSortOrder("asc"); setVisibleCount(20); setIsMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${sortOrder === 'asc' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Oldest First</span>
                          </div>
                          {sortOrder === 'asc' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <button type="button"
                          onClick={() => { setSortOrder("desc"); setVisibleCount(20); setIsMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${sortOrder === 'desc' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Newest First</span>
                          </div>
                          {sortOrder === 'desc' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5 space-y-3 scroll-smooth"
          >
            {isInitializing ? (
              <div className="h-full flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-indigo-600 animate-spin opacity-30" />
              </div>
            ) : (
              <>
                {sortOrder === "asc" && visibleCount < messages.length && !searchQuery && (
                  <div className="flex flex-col items-center justify-center py-6 opacity-40">
                    <Loader2 className="w-4 h-4 animate-spin mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Loading older messages...</p>
                  </div>
                )}
                
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto opacity-40 gap-3">
                     <p className="text-xs font-bold uppercase tracking-wider">
                       {searchQuery ? "No matching messages" : "Start the conversation below"}
                     </p>
                  </div>
                ) : (
                  filteredMessages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    const senderName = msg.sender?.full_name || (msg.sender_id === order.user_id ? clientName : adminName);
                    const senderRole = msg.sender?.is_admin ? "Administrator" : "Klien";
                    
                    return (
                      <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 self-end">
                          {isMe ? "Y" : (msg.sender?.is_admin ? "A" : "K")}
                        </div>
                        <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed rounded-2xl ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-slate-100 text-slate-700 rounded-bl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 px-1">
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {isMe ? 'You' : `${senderName} (${senderRole})`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {sortOrder === "desc" && visibleCount < messages.length && !searchQuery && (
                  <div className="flex justify-center pt-4">
                    <button type="button" onClick={() => setVisibleCount(prev => prev + 20)} className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all">
                       Load more messages
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
             {(() => {
               // Form testimoni: Hanya Tampil untuk Klien setelah Selesai
               if (isCompleted && !isAdmin) {
                  if (testimonial) {
                    return (
                      <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
                         <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <PartyPopper className="w-6 h-6 text-indigo-600" />
                         </div>
                         <h4 className="text-lg font-bold text-slate-900 mb-1">Terima Kasih Atas Kerjasamanya!</h4>
                         <p className="text-sm font-medium text-slate-500 mb-6">Testimoni Anda sangat berarti bagi perkembangan kami.</p>
                         
                         <div className="flex justify-center gap-6 mb-4">
                            {[
                              { label: "Kualitas", score: testimonial.rating_quality },
                              { label: "Respon", score: testimonial.rating_communication },
                              { label: "Kecepatan", score: testimonial.rating_speed }
                            ].map((r, i) => (
                              <div key={i} className="text-center">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{r.label}</p>
                                 <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, idx) => (
                                      <Star key={idx} className={`w-3 h-3 ${idx < r.score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                    ))}
                                 </div>
                              </div>
                            ))}
                         </div>
                         
                         {testimonial.comment && (
                           <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-xl text-sm font-medium italic text-slate-600">
                             &quot;{testimonial.comment}&quot;
                           </div>
                         )}
                      </div>
                    );
                  }

                  return (
                    <form onSubmit={submitTestimonial} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                      <div className="text-center">
                         <h4 className="text-lg font-bold text-slate-900">Beri Nilai Pekerjaan Kami</h4>
                         <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Project Selesai — Berikan Testimoni Anda</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {[
                           { label: "Kualitas Pekerjaan", state: ratingQuality, setter: setRatingQuality },
                           { label: "Respon Obrolan", state: ratingCommunication, setter: setRatingCommunication },
                           { label: "Kecepatan Pekerjaan", state: ratingSpeed, setter: setRatingSpeed }
                         ].map((item, i) => (
                           <div key={i} className="flex flex-col items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">{item.label}</span>
                              <div className="flex gap-1">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                   <button 
                                     key={star} 
                                     type="button"
                                     onClick={() => item.setter(star)}
                                     className="transition-transform active:scale-90 hover:scale-110"
                                   >
                                      <Star className={`w-5 h-5 ${star <= item.state ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                   </button>
                                 ))}
                              </div>
                           </div>
                         ))}
                      </div>

                      <div className="relative">
                         <textarea 
                            value={testimonialComment}
                            onChange={e => setTestimonialComment(e.target.value)}
                            placeholder="Tuliskan pengalaman atau masukan Anda di sini..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium min-h-[100px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none outline-none"
                         />
                         <button 
                          type="submit"
                          disabled={submittingTestimonial}
                          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                         >
                            {submittingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <PartyPopper className="w-4 h-4" />}
                            Kirim Testimoni & Selesaikan
                         </button>
                      </div>
                    </form>
                  );
               }

               return (
                 <form onSubmit={sendMessage} className="flex items-center gap-3">
                    <input 
                       disabled={isChatLocked || loading || isInitializing}
                       value={isChatLocked ? "" : newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       placeholder={isChatLocked ? "Workspace closed (Project Completed)" : "Type your message..."}
                       className={`flex-1 bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none ${isChatLocked ? 'cursor-not-allowed bg-slate-50 italic' : ''}`}
                    />
                    {!isChatLocked && (
                      <button 
                        type="button" 
                        onClick={() => showToast("File upload enabled soon", "info")} 
                        className={`p-2.5 text-slate-400 hover:text-slate-700 transition-all`}
                      >
                         <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                     type="submit" 
                     disabled={loading || !newMessage.trim() || isInitializing || isChatLocked}
                     className={`w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shrink-0 ${isChatLocked ? "hidden" : ""}`}
                    >
                       {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                    {isChatLocked && (
                      <div className="absolute inset-x-8 bottom-3 border border-slate-100 bg-white/80 backdrop-blur-sm rounded-xl py-3 flex items-center justify-center text-xs font-bold text-slate-500 uppercase tracking-wider gap-2">
                         <ShieldCheck className="w-4 h-4 text-slate-400" />
                         Workspace Locked • Project Completed
                      </div>
                    )}
                 </form>
               );
             })()}
             <p className="text-center text-[10px] font-bold text-slate-400 mt-3 pt-2">
                <ShieldCheck className="w-3 h-3 inline-block mr-1 translate-y-[-1px]" /> End-to-end encrypted
             </p>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="xl:col-span-1 flex flex-col gap-4 shrink-0 h-full overflow-y-auto pr-2">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-5">
           <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                 <Briefcase className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">#{order.order_number}</p>
                 <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{getProjectName()}</h4>
              </div>
           </div>

           <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Selected Package</span>
                 </div>
                 <span className="text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
                    {(() => {
                      try {
                        const sp = typeof order.selected_package === 'string' ? JSON.parse(order.selected_package) : order.selected_package;
                        const name = sp?.name || "Standard";
                        const price = order.total_amount ? `Rp ${Number(order.total_amount).toLocaleString('id-ID')}` : "";
                        return price ? `${name} / ${price}` : name;
                      } catch {
                         return order.total_amount ? `Standard / Rp ${Number(order.total_amount).toLocaleString('id-ID')}` : "Standard";
                      }
                    })()}
                 </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                 <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package Info</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      try {
                        const sp = typeof order.selected_package === 'string' ? JSON.parse(order.selected_package) : order.selected_package;
                        return sp?.features?.map((f: string, i: number) => (
                           <span key={i} className="text-[10px] font-bold bg-white px-2 py-1 rounded text-slate-600 border border-slate-200">
                              {f}
                           </span>
                        )) || <span className="text-xs text-slate-400 italic">Features included</span>;
                      } catch {
                         return null;
                      }
                    })()}
                 </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                 </div>
                 {isAdmin ? (
                   <div className="relative">
                     <select
                       value={currentStatus}
                       disabled={updatingStatus}
                       onChange={e => handleUpdateStatus(e.target.value)}
                       className="w-full appearance-none text-xs font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer disabled:opacity-60"
                     >
                       <option value="pending">Pending</option>
                       <option value="waiting_payment">Waiting Payment</option>
                       <option value="processing">Processing</option>
                       <option value="revision">Revision</option>
                       <option value="completed">Completed</option>
                       <option value="cancelled">Cancelled</option>
                     </select>
                     {updatingStatus && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-indigo-500" />}
                   </div>
                 ) : (
                   <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider inline-block ${
                      currentStatus === 'processing' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      currentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      currentStatus === 'revision' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      currentStatus === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                   }`}>
                     {currentStatus || "Pending"}
                   </span>
                 )}
              </div>

              {/* PAYMENT PROOF - USER VIEW */}
              {!isAdmin && (order.status === "pending" || order.status === "waiting_payment") && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Payment Proof</p>
                  {order.status === "waiting_payment" && paymentProofUrl ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-amber-700">Proof submitted. Waiting for admin confirmation.</p>
                      <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 underline mt-1 block">View uploaded proof</a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentProofUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32">
                          <img src={paymentProofUrl} alt="Payment proof" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPaymentProofUrl("")} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-lg text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={e => handleUploadFile(e, "proof")} disabled={uploadingProof} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-pointer">
                          {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span className="text-xs font-bold">{uploadingProof ? "Uploading..." : "Upload Transfer Proof"}</span>
                        </div>
                      </div>
                      {paymentProofUrl && (
                        <button type="button" onClick={handleSaveProof} disabled={savingProof} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                          {savingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Submit Payment Proof</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENT CONFIRMATION - ADMIN VIEW */}
              {isAdmin && order.status === "waiting_payment" && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Payment Confirmation</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    {order.payment_proof ? (
                      <>
                        <a href={order.payment_proof} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-amber-200 h-32">
                          <img src={order.payment_proof} alt="Payment proof" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </a>
                        <p className="text-[10px] font-bold text-amber-700 text-center">Client submitted payment proof. Click image to view full size.</p>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-amber-700 text-center">Waiting for client to upload payment proof.</p>
                    )}
                    <button type="button" onClick={handleConfirmPayment} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4" /> Confirm & Start Project
                    </button>
                  </div>
                </div>
              )}

              {/* DELIVERY FILE - ADMIN UPLOAD (Shop only, completed) */}
              {isAdmin && isShopOrder && isCompleted && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Delivery File</p>
                  <div className="space-y-3">
                    {deliveryFileUrl && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                        <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-emerald-700 truncate">File uploaded</p>
                          <a href={deliveryFileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 underline truncate block">View / Preview link</a>
                        </div>
                        <button type="button" onClick={() => setDeliveryFileUrl("")} className="p-1 text-emerald-400 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    <div className="relative">
                      <input type="file" onChange={e => handleUploadFile(e, "delivery")} disabled={uploadingDelivery} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-pointer">
                        {uploadingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-xs font-bold">{uploadingDelivery ? "Uploading..." : (deliveryFileUrl ? "Replace File" : "Upload Result File")}</span>
                      </div>
                    </div>
                    {deliveryFileUrl && (
                      <button type="button" onClick={handleSaveDelivery} disabled={savingDelivery} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        {savingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileCheck className="w-4 h-4" /> Save & Notify Client</>}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DELIVERY FILE - USER DOWNLOAD (Shop only, completed) */}
              {!isAdmin && isShopOrder && isCompleted && deliveryFileUrl && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Your File is Ready!</p>
                  <a
                    href={deliveryFileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Result File
                  </a>
                </div>
              )}

              {/* INTEGRASI ADMIN PORTOFOLIO */}
              {isAdmin && isCompleted && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <button type="button" onClick={handleOpenPortfolioModal} className="w-full relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-3 flex items-center gap-3 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 block text-left">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Publish Portfolio</h4>
                      <p className="text-[10px] font-medium text-indigo-100 mt-0.5">Showcase this project</p>
                    </div>
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>

    {/* PORTFOLIO MODAL */}
    {isPortfolioModalOpen && (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900">Publish to Portfolio</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Upload project "{getProjectName()}" to public showcase</p>
            </div>
            <button type="button" onClick={() => setIsPortfolioModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
          </div>
          
          <form onSubmit={handleSavePortfolio} className="p-6 space-y-5 overflow-y-auto flex-1">
            <ImageUploader
              label="Portfolio Image"
              folder="projects"
              value={portfolioForm.images[0] || ""}
              onChange={url => setPortfolioForm(f => ({ ...f, images: url ? [url] : [] }))}
            />

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Title <span className="text-red-500">*</span></label>
              <input type="text" value={portfolioForm.title} onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                placeholder={getProjectName()} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Category</label>
                <input type="text" value={portfolioForm.category} onChange={e => setPortfolioForm(f => ({ ...f, category: e.target.value }))}
                  placeholder={order.store_services?.category || "Logo Design"} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Visibility</label>
                <select value={portfolioForm.is_published ? "true" : "false"} onChange={e => setPortfolioForm(f => ({ ...f, is_published: e.target.value === "true" }))} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none appearance-none">
                  <option value="true">Published</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Description / Case Study</label>
              <textarea value={portfolioForm.description} onChange={e => setPortfolioForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell the story behind this awesome work..." rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none resize-none" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tags</label>
              <div className="flex gap-2">
                <input type="text" value={portfolioTagInput} onChange={e => setPortfolioTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPortfolioTag(); } }}
                  placeholder="modern, minimal, logomark" className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 px-4 py-2.5 transition-all outline-none" />
                <button type="button" onClick={addPortfolioTag} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-100 transition-colors shrink-0">Add Tag</button>
              </div>
              {portfolioForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {portfolioForm.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                      {t}
                      <button type="button" onClick={() => setPortfolioForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsPortfolioModalOpen(false)} className="flex-1 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">Cancel</button>
              <button type="submit" disabled={portfolioSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
                {portfolioSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
