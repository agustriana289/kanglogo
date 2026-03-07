"use client";

import { useRouter } from "next/navigation";

export default function YearFilter({ availableYears, displayYear }: { availableYears: number[], displayYear: number }) {
  const router = useRouter();
  
  return (
    <select 
      value={displayYear} 
      onChange={(e) => {
        router.push(`/dashboard?year=${e.target.value}`);
      }} 
      className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none cursor-pointer shadow-sm"
    >
      {availableYears.map(year => (
        <option key={year} value={year}>{year} REPORT</option>
      ))}
    </select>
  );
}
