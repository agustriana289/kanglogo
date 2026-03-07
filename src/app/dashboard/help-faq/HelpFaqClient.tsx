"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Layers, MessagesSquare } from "lucide-react";

export default function HelpFaqClient({ faqs }: { faqs: any[] }) {
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Grouping logic
  const landingFaqs = faqs.filter(f => f.target === "landing");
  const serviceGroups = new Map<string, any[]>();
  const shopGroups = new Map<string, any[]>();

  faqs.forEach(f => {
    if (f.target === "service") {
      const title = f.store_services?.title || "Other Service";
      if (!serviceGroups.has(title)) serviceGroups.set(title, []);
      serviceGroups.get(title)?.push(f);
    }
    if (f.target === "shop") {
      const cat = f.shop_category || "Other Products";
      if (!shopGroups.has(cat)) shopGroups.set(cat, []);
      shopGroups.get(cat)?.push(f);
    }
  });

  // Decide what to show
  let currentTitle = "General Information";
  let filteredFaqs: any[] = [];

  if (activeTab === "landing") {
    filteredFaqs = landingFaqs;
  } else if (activeTab.startsWith("service_")) {
    const sname = activeTab.replace("service_", "");
    currentTitle = sname;
    filteredFaqs = serviceGroups.get(sname) || [];
  } else if (activeTab.startsWith("shop_")) {
    const sname = activeTab.replace("shop_", "");
    currentTitle = sname;
    filteredFaqs = shopGroups.get(sname) || [];
  }

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Help & FAQ</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Find answers to frequently asked questions below.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-12 gap-8">
        {/* Left Grid: Categories */}
        <div className="lg:col-span-1 xl:col-span-3 space-y-6">
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">General</h3>
            <button
              onClick={() => { setActiveTab("landing"); setExpandedId(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                activeTab === "landing" 
                  ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200" 
                  : "bg-transparent text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'landing' ? 'text-indigo-600' : 'text-slate-400'}`} />
              General Information
            </button>
          </div>

          {serviceGroups.size > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mt-4">Services</h3>
              {Array.from(serviceGroups.keys()).map((sName) => {
                const tabId = `service_${sName}`;
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    onClick={() => { setActiveTab(tabId); setExpandedId(null); }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200" 
                        : "bg-transparent text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Layers className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {sName}
                  </button>
                );
              })}
            </div>
          )}

          {shopGroups.size > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mt-4">Shop Products</h3>
              {Array.from(shopGroups.keys()).map((sCat) => {
                const tabId = `shop_${sCat}`;
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    onClick={() => { setActiveTab(tabId); setExpandedId(null); }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200" 
                        : "bg-transparent text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <MessagesSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {sCat}
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Grid: Content */}
        <div className="lg:col-span-3 xl:col-span-9">
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-6 sm:p-8 min-h-[400px]">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
               <div>
                 <h2 className="text-lg font-bold text-slate-900">{currentTitle}</h2>
                 <p className="text-xs font-medium text-slate-400 mt-1">Showing {filteredFaqs.length} questions</p>
               </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
                <HelpCircle className="w-10 h-10 mb-3 text-slate-200" />
                <p className="text-sm font-bold text-slate-600">No questions found</p>
                <p className="text-xs font-medium mt-1">Check back later or browse another category.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedId === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className={`rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-slate-50 ring-1 ring-slate-200 shadow-sm' : 'bg-white ring-1 ring-slate-100 hover:ring-indigo-200'}`}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                        <span className={`text-sm font-bold pr-4 transition-colors ${isExpanded ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {faq.question}
                        </span>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      
                      {/* Content Dropdown */}
                      <div 
                        className={`px-5 overflow-hidden transition-all duration-300 origin-top ${
                          isExpanded ? 'max-h-[500px] pb-5 opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95'
                        }`}
                      >
                         <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-200/60 pt-4">
                           {faq.answer}
                         </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
