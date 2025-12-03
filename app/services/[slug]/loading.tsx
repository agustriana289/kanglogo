// app/services/[slug]/loading.tsx
import LogoLoading from "@/components/LogoLoading";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center">
        <LogoLoading size="xl" />
        <p className="mt-8 text-xl text-slate-600 dark:text-slate-400">
          Sedang memuat...
        </p>
      </div>
    </div>
  );
}
