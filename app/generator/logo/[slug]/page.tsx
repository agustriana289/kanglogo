"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogoAsset, LogoFont } from "@/types/logo-generator";
import LogoPathAnimation from "@/components/LogoPathAnimation";
import Image from "next/image";
import WidgetArea from "@/components/WidgetArea";
import {
  SwatchIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  PaintBrushIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function LogoGeneratorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [asset, setAsset] = useState<LogoAsset | null>(null);
  const [loading, setLoading] = useState(true);

  // Font State
  const [availableFonts, setAvailableFonts] = useState<LogoFont[]>([]);

  // Customization State
  const [companyName, setCompanyName] = useState("KANGLOGO");
  const [companyColor, setCompanyColor] = useState("#000000");

  // Main Font State
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [selectedFont, setSelectedFont] = useState<LogoFont | null>(null);
  const [baseFontSize, setBaseFontSize] = useState(100);

  // Slogan State
  const [showSlogan, setShowSlogan] = useState(false);
  const [sloganText, setSloganText] = useState("Slogan Goes Here");
  const [sloganColor, setSloganColor] = useState("#555555");

  // Slogan Font & Size State (NEW)
  const [sloganFontFamily, setSloganFontFamily] = useState(
    "'Inter', sans-serif"
  );
  const [selectedSloganFont, setSelectedSloganFont] = useState<LogoFont | null>(
    null
  );
  const [sloganBaseFontSize, setSloganBaseFontSize] = useState(100);

  // Logo Icon Color State
  const [logoColorMode, setLogoColorMode] = useState<"original" | "solid">(
    "original"
  );
  const [logoSolidColor, setLogoSolidColor] = useState("#000000");

  const [layout, setLayout] = useState<"left" | "right">("left");

  // Dynamic Sizing State
  const [viewBox, setViewBox] = useState("0 0 1080 1080");
  const [layoutMetrics, setLayoutMetrics] = useState({
    iconX: 0,
    textX: 0,
    mainTextY: 0,
    sloganY: 0,
    mainFontSize: 0,
    sloganFontSize: 0,
    totalWidth: 0,
    totalHeight: 0,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchAssetAndFonts();
  }, [slug]);

  const fetchAssetAndFonts = async () => {
    try {
      // 1. Fetch Asset
      const { data: assetData, error: assetError } = await supabase
        .from("logo_assets")
        .select("*")
        .eq("slug", slug)
        .single();

      if (assetError) throw assetError;
      setAsset(assetData);

      // 2. Fetch Fonts
      const { data: fontData, error: fontError } = await supabase
        .from("logo_fonts")
        .select("*")
        .order("font_name");

      if (fontError) {
        console.error("Error fetching fonts", fontError);
      } else if (fontData && fontData.length > 0) {
        setAvailableFonts(fontData || []);
        const firstFont = fontData[0];

        // Initialize both Main and Slogan fonts to the first available font
        const familyStr = `'${firstFont.font_name}', sans-serif`;

        setFontFamily(familyStr);
        setSelectedFont(firstFont);

        setSloganFontFamily(familyStr);
        setSelectedSloganFont(firstFont);
      } else {
        // Fallback
        const fallback = {
          id: 0,
          font_name: "Inter",
          google_font_family: "Inter:wght@400;700",
          created_at: "",
        };
        setAvailableFonts([fallback]);

        setFontFamily("'Inter', sans-serif");
        setSelectedFont(fallback);

        setSloganFontFamily("'Inter', sans-serif");
        setSelectedSloganFont(fallback);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Unified Font Change Handler
  const handleFontChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    type: "main" | "slogan"
  ) => {
    const fontName = e.target.value;
    const fontObj = availableFonts.find((f) => f.font_name === fontName);
    if (fontObj) {
      if (type === "main") {
        setFontFamily(`'${fontName}', sans-serif`);
        setSelectedFont(fontObj);
      } else {
        setSloganFontFamily(`'${fontName}', sans-serif`);
        setSelectedSloganFont(fontObj);
      }
    }
  };

  // Recalculate Layout
  useEffect(() => {
    if (!asset) return;
    calculateLayout();
  }, [
    asset,
    companyName,
    sloganText,
    showSlogan,
    layout,
    baseFontSize,
    fontFamily, // Main Text Dependencies
    sloganBaseFontSize,
    sloganFontFamily, // Slogan Dependencies
  ]);

  const calculateLayout = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ICON_SIZE = 400;
    const GAP = 50;

    // --- Main Text Calculation ---
    const mainDefaultScale = showSlogan ? 0.7 : 0.8;
    const mainSizeMultiplier = baseFontSize / 100;
    const mainFontSize = ICON_SIZE * mainDefaultScale * mainSizeMultiplier;

    ctx.font = `bold ${mainFontSize}px ${fontFamily
      .split(",")[0]
      .replace(/'/g, "")}`;
    const mainTextMetrics = ctx.measureText(companyName);
    const mainTextWidth = mainTextMetrics.width;
    const mainTextHeight = mainFontSize;

    // --- Slogan Calculation ---
    let sloganWidth = 0;
    let sloganHeight = 0;
    // Independent Slogan Size
    // Base is 25% of Icon Size, then multiplied by sloganBaseFontSize slider
    const sloganSizeMultiplier = sloganBaseFontSize / 100;
    const sloganFontSize = ICON_SIZE * 0.25 * sloganSizeMultiplier;

    if (showSlogan) {
      ctx.font = `normal ${sloganFontSize}px ${sloganFontFamily
        .split(",")[0]
        .replace(/'/g, "")}`;
      const sloganMetrics = ctx.measureText(sloganText);
      sloganWidth = sloganMetrics.width;
      sloganHeight = sloganFontSize;
    }

    const maxTextWidth = Math.max(mainTextWidth, sloganWidth);
    const totalTextHeight =
      mainTextHeight + (showSlogan ? sloganHeight + 20 : 0);

    const totalWidth = ICON_SIZE + GAP + maxTextWidth;
    const totalHeight = Math.max(ICON_SIZE, totalTextHeight);

    let iconX = 0;
    let textX = 0;

    if (layout === "left") {
      iconX = 0;
      textX = ICON_SIZE + GAP;
    } else {
      textX = 0;
      iconX = maxTextWidth + GAP;
    }

    // Vertical Center Align
    const textBlockStartY = (totalHeight - totalTextHeight) / 2;
    const mainTextY = textBlockStartY + mainFontSize * 0.8;
    const sloganY = mainTextY + 20 + sloganFontSize;

    setLayoutMetrics({
      iconX,
      textX,
      mainTextY,
      sloganY,
      mainFontSize,
      sloganFontSize,
      totalWidth,
      totalHeight,
    });

    const padding = 50;
    setViewBox(
      `${-padding} ${-padding} ${totalWidth + padding * 2} ${
        totalHeight + padding * 2
      }`
    );
  };

  const downloadImage = (format: "png" | "webp") => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = layoutMetrics.totalWidth + 100;
      canvas.height = layoutMetrics.totalHeight + 100;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgUrl = canvas.toDataURL(`image/${format}`);
      const link = document.createElement("a");
      link.href = imgUrl;
      link.download = `${companyName.toLowerCase()}-logo.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const resetLogoColor = () => {
    setLogoColorMode("original");
    setLogoSolidColor("#000000");
  };

  if (loading || !asset) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <LogoPathAnimation />
      </div>
    );
  }

  // Construct Google Fonts URLs
  // We need to load potentially two different font families

  const mainFontStr = selectedFont
    ? selectedFont.google_font_family
    : "Inter:wght@400;700";
  const sloganFontStr = selectedSloganFont
    ? selectedSloganFont.google_font_family
    : "Inter:wght@400;700";

  // Construct the @import string.
  // If they are the same, just load once. If different, load both.
  let googleFontsImport = `https://fonts.googleapis.com/css2?family=${mainFontStr}&display=swap`;

  if (showSlogan && selectedFont?.id !== selectedSloganFont?.id) {
    // Simple approach: two imports or one combined.
    // CSS allows multiple @import.
    // For Google Fonts API, we *could* combine them in one URL (e.g. family=A&family=B) but
    // the provided `google_font_family` string might already contain weights which makes parsing hard.
    // Simplest valid CSS is just two @imports.
  }

  // Let's just create an array of URLs to import
  const importUrls = [
    `https://fonts.googleapis.com/css2?family=${mainFontStr}&display=swap`,
  ];
  if (showSlogan && mainFontStr !== sloganFontStr) {
    importUrls.push(
      `https://fonts.googleapis.com/css2?family=${sloganFontStr}&display=swap`
    );
  }

  return (
    <section className="py-16 bg-slate-100 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Logo Generator</h1>
          <p className="text-slate-500">
            Sesuaikan logo{" "}
            <span className="font-semibold text-primary">
              {asset.nama_aset}
            </span>{" "}
            dengan preferensi Anda.
          </p>
        </div>

        <WidgetArea position="generator_top" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preview Canvas
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadImage("png")}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition shadow-sm flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="w-3 h-3" />
                    PNG
                  </button>
                  <button
                    onClick={() => downloadImage("webp")}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium transition shadow-sm flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="w-3 h-3" />
                    WebP
                  </button>
                </div>
              </div>

              <div className="p-8 lg:p-12 flex items-center justify-center bg-[url('https://transparenttextures.com/patterns/cubes.png')] bg-slate-50 min-h-[500px]">
                <svg
                  ref={svgRef}
                  viewBox={viewBox}
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[600px] drop-shadow-sm select-none transition-all duration-300 ease-out"
                >
                  <defs>
                    <style>
                      {`
                                    ${importUrls
                                      .map((url) => `@import url('${url}');`)
                                      .join("\n")}
                                    
                                    .main-text { font-family: ${fontFamily}; font-weight: bold; }
                                    .slogan-text { font-family: ${sloganFontFamily}; font-weight: normal; }
                                    
                                    ${
                                      logoColorMode === "solid"
                                        ? `
                                        .icon-wrapper path,
                                        .icon-wrapper circle,
                                        .icon-wrapper rect,
                                        .icon-wrapper polygon,
                                        .icon-wrapper ellipse {
                                            fill: ${logoSolidColor} !important;
                                        }
                                    `
                                        : ""
                                    }
                                `}
                    </style>
                  </defs>

                  <g
                    transform={`translate(${layoutMetrics.iconX}, 0)`}
                    className="icon-wrapper"
                  >
                    <svg
                      width="400"
                      height="400"
                      viewBox="0 0 1080 1080"
                      dangerouslySetInnerHTML={{
                        __html: asset.svg_content.replace(
                          /<svg[^>]*>|<\/svg>/g,
                          ""
                        ),
                      }}
                    />
                  </g>

                  <g
                    transform={`translate(${layoutMetrics.textX}, 0)`}
                    textAnchor={layout === "right" ? "end" : "start"}
                  >
                    <text
                      x={layout === "right" ? layoutMetrics.iconX - 50 : 0}
                      y={layoutMetrics.mainTextY}
                      fontSize={layoutMetrics.mainFontSize}
                      fill={companyColor}
                      className="main-text"
                    >
                      {companyName}
                    </text>

                    {showSlogan && (
                      <text
                        x={layout === "right" ? layoutMetrics.iconX - 50 : 0}
                        y={layoutMetrics.sloganY}
                        fontSize={layoutMetrics.sloganFontSize}
                        fill={sloganColor}
                        className="slogan-text"
                      >
                        {sloganText}
                      </text>
                    )}
                  </g>
                </svg>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <WidgetArea position="generator_middle" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-8 sticky top-6">
            {/* Text Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-slate-100">
                <DocumentTextIcon className="w-4 h-4 text-primary" /> Konten
                Text
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border-slate-300 focus:ring-primary focus:border-primary text-sm shadow-sm"
                    placeholder="Ketik nama..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSlogan}
                      onChange={(e) => setShowSlogan(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Tambah Slogan
                    </span>
                  </label>
                </div>

                {showSlogan && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Isi Slogan
                    </label>
                    <input
                      type="text"
                      value={sloganText}
                      onChange={(e) => setSloganText(e.target.value)}
                      className="w-full rounded-lg border-slate-300 focus:ring-primary focus:border-primary text-sm shadow-sm"
                      placeholder="Ketik slogan..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Typography Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-slate-100">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-primary" />{" "}
                Tipografi
              </h3>
              <div className="space-y-4">
                {/* MAIN TEXT FONT */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Font Utama
                  </label>
                  <select
                    value={selectedFont?.font_name || ""}
                    onChange={(e) => handleFontChange(e, "main")}
                    className="w-full rounded-lg border-slate-300 focus:ring-primary focus:border-primary text-sm"
                  >
                    {availableFonts.length === 0 && (
                      <option>Loading fonts...</option>
                    )}
                    {availableFonts.map((font) => (
                      <option key={font.id} value={font.font_name}>
                        {font.font_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      Ukuran Text Utama
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {baseFontSize}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={baseFontSize}
                    onChange={(e) => setBaseFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* SLOGAN FONT (Only if slogan enabled) */}
                {showSlogan && (
                  <div className="animate-in fade-in space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Font Slogan
                      </label>
                      <select
                        value={selectedSloganFont?.font_name || ""}
                        onChange={(e) => handleFontChange(e, "slogan")}
                        className="w-full rounded-lg border-slate-300 focus:ring-primary focus:border-primary text-sm"
                      >
                        {availableFonts.length === 0 && (
                          <option>Loading fonts...</option>
                        )}
                        {availableFonts.map((font) => (
                          <option key={font.id} value={font.font_name}>
                            {font.font_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-600">
                          Ukuran Slogan
                        </label>
                        <span className="text-xs text-slate-400 font-mono">
                          {sloganBaseFontSize}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={sloganBaseFontSize}
                        onChange={(e) =>
                          setSloganBaseFontSize(Number(e.target.value))
                        }
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Style Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-slate-100">
                <SwatchIcon className="w-4 h-4 text-primary" /> Warna
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                  <label className="text-sm font-medium text-slate-700">
                    Warna Utama
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono uppercase bg-slate-50 px-1.5 py-0.5 rounded">
                      {companyColor}
                    </span>
                    <input
                      type="color"
                      value={companyColor}
                      onChange={(e) => setCompanyColor(e.target.value)}
                      className="h-8 w-8 rounded-full cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                    />
                  </div>
                </div>

                {showSlogan && (
                  <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-200 transition animate-in fade-in">
                    <label className="text-sm font-medium text-slate-700">
                      Warna Slogan
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono uppercase bg-slate-50 px-1.5 py-0.5 rounded">
                        {sloganColor}
                      </span>
                      <input
                        type="color"
                        value={sloganColor}
                        onChange={(e) => setSloganColor(e.target.value)}
                        className="h-8 w-8 rounded-full cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Warna Logo Icon
                    </label>
                    {logoColorMode === "solid" && (
                      <button
                        onClick={resetLogoColor}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        <ArrowPathIcon className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <button
                      onClick={() => setLogoColorMode("original")}
                      className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                        logoColorMode === "original"
                          ? "bg-white shadow text-primary ring-1 ring-primary/20"
                          : "text-slate-500 hover:bg-white/50"
                      }`}
                    >
                      Warna Asli
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLogoColorMode("solid")}
                        className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all text-center ${
                          logoColorMode === "solid"
                            ? "bg-white shadow text-primary ring-1 ring-primary/20"
                            : "text-slate-500 hover:bg-white/50"
                        }`}
                      >
                        Solid Color
                      </button>
                      {logoColorMode === "solid" && (
                        <input
                          type="color"
                          value={logoSolidColor}
                          onChange={(e) => setLogoSolidColor(e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer border-0 p-0 shadow-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2 border-slate-100">
                <ArrowsRightLeftIcon className="w-4 h-4 text-primary" /> Tata
                Letak
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLayout("left")}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    layout === "left"
                      ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm"
                      : "border-slate-100 hover:border-slate-200 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1 font-mono text-[10px] border border-current p-1.5 rounded bg-white">
                    <div className="w-3 h-3 bg-current rounded-full opacity-50"></div>
                    <div className="h-1 w-6 bg-current rounded-full opacity-30"></div>
                  </div>
                  <span className="text-xs font-semibold">Icon Kiri</span>
                </button>
                <button
                  onClick={() => setLayout("right")}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    layout === "right"
                      ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm"
                      : "border-slate-100 hover:border-slate-200 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1 font-mono text-[10px] border border-current p-1.5 rounded bg-white">
                    <div className="h-1 w-6 bg-current rounded-full opacity-30"></div>
                    <div className="w-3 h-3 bg-current rounded-full opacity-50"></div>
                  </div>
                  <span className="text-xs font-semibold">Icon Kanan</span>
                </button>
              </div>
            </div>

            <WidgetArea position="generator_sidebar" />
          </div>
        </div>
      </div>
    </section>
  );
}
