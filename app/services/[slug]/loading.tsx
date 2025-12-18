// app/services/[slug]/loading.tsx
import LogoPathAnimation from "@/components/LogoPathAnimation";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <LogoPathAnimation />
    </div>
  );
}
