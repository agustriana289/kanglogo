"use client";

import React, { useState } from "react";
import { Ticket, Copy, Zap, CheckCircle2, ShoppingBag, Layers, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function VouchersClient({ discounts }: { discounts: any[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Discounts</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Discover working promo codes and automatic service deals.</p>
      </div>

      {discounts.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No active discounts</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">There are currently no active vouchers or promos available. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {discounts.map((d) => {
            const isVoucher = !!d.code;
            const targetName = d.product_id ? d.store_products?.title : d.service_id ? d.store_services?.title : "All Items";
            const isService = !!d.service_id;
            
            return (
              <div 
                key={d.id} 
                className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md ${isVoucher ? 'border-indigo-100' : 'border-orange-100'}`}
              >
                {/* Decorative Background */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${isVoucher ? 'bg-indigo-500' : 'bg-orange-500'}`} />

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`p-3 rounded-xl shrink-0 ${isVoucher ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-500'}`}>
                    {isVoucher ? <Ticket className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight text-slate-900 block">
                      {d.type === 'percentage' ? `${d.value}%` : `Rp${(d.value/1000).toFixed(0)}k`} OFF
                    </span>
                    {d.min_purchase > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Min. Rp{new Intl.NumberFormat('id-ID').format(d.min_purchase)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6 relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{d.name}</h3>
                  <p className="text-sm font-medium text-slate-500 line-clamp-2">{d.description || "Enjoy this special discount on your next order."}</p>
                </div>

                <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 relative z-10">
                  {isVoucher ? <ShoppingBag className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  <span className="truncate max-w-[180px]">For: {targetName}</span>
                </div>

                <div className="pt-5 border-t border-slate-100 border-dashed relative z-10 flex gap-3">
                  {isVoucher ? (
                    <button
                      onClick={() => handleCopy(d.code)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                        copied === d.code 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                      }`}
                    >
                      {copied === d.code ? (
                        <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy "{d.code}"</>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={isService ? "/services" : "/shop"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm shadow-orange-200 transition-all"
                    >
                      Use Automatic Discount
                    </Link>
                  )}
                </div>

                {/* Expiry indicator */}
                {d.end_date && (
                   <div className="absolute top-0 right-0 left-0 h-1 bg-slate-100">
                      <div className={`h-full ${isVoucher ? 'bg-indigo-500' : 'bg-orange-500'} w-full`}></div>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
