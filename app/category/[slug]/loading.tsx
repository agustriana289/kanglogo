import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center">
                <LogoPathAnimation />
                <p className="mt-8 text-xl text-slate-600">Memuat kategori...</p>
            </div>
        </div>
    );
}
