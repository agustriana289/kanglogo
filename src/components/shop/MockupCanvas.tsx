"use client";

import { useEffect, useRef, useState } from "react";

type MockupType = "tshirt" | "totebag" | "mug";

interface MockupCanvasProps {
  logoUrl: string;
  type: MockupType;
  label: string;
}

const TEMPLATES: Record<MockupType, { bg: string; area: { x: number; y: number; w: number; h: number } }> = {
  tshirt: {
    bg: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=90",
    area: { x: 0.62, y: 0.27, w: 0.18, h: 0.18 },
  },
  totebag: {
    bg: "https://images.unsplash.com/photo-1614179818511-4f5f65e22f2a?auto=format&fit=crop&w=600&q=90",
    area: { x: 0.25, y: 0.32, w: 0.50, h: 0.44 },
  },
  mug: {
    bg: "https://images.unsplash.com/photo-1576020799627-aeac74d58064?auto=format&fit=crop&w=600&q=90",
    area: { x: 0.10, y: 0.30, w: 0.44, h: 0.38 },
  },
};

export default function MockupCanvas({ logoUrl, type, label }: MockupCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tmpl = TEMPLATES[type];
    const bgImg = new Image();
    const logoImg = new Image();
    bgImg.crossOrigin = "anonymous";
    logoImg.crossOrigin = "anonymous";

    bgImg.src = tmpl.bg;
    bgImg.onload = () => {
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;
      ctx.drawImage(bgImg, 0, 0);

      logoImg.src = logoUrl + (logoUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
      logoImg.onload = () => {
        const { x, y, w, h } = tmpl.area;
        const px = x * canvas.width;
        const py = y * canvas.height;
        const pw = w * canvas.width;
        const ph = h * canvas.height;

        const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
        let dw = pw;
        let dh = pw / logoAspect;
        if (dh > ph) { dh = ph; dw = ph * logoAspect; }

        const dx = px + (pw - dw) / 2;
        const dy = py + (ph - dh) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 8;
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.92;
        ctx.drawImage(logoImg, dx, dy, dw, dh);
        ctx.restore();
        setReady(true);
      };
      logoImg.onerror = () => setReady(true);
    };
  }, [logoUrl, type]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 aspect-square">
        {!ready && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 rounded-2xl" />
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ display: ready ? "block" : "none" }}
        />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}
