"use client";

import { useEffect, useRef } from "react";

interface WidgetRendererProps {
  content: string;
  id: number;
}

/**
 * Komponen untuk render widget yang mungkin mengandung script eksternal
 * Ini memecah HTML dan script secara terpisah untuk memastikan script dieksekusi
 */
export default function WidgetRenderer({ content, id }: WidgetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Bersihkan container
      containerRef.current.innerHTML = "";

      // Parse content sebagai HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");

      // Cari semua script tags
      const scripts = doc.querySelectorAll("script");
      const htmlWithoutScripts = doc.body.innerHTML;

      // Insert HTML tanpa scripts terlebih dahulu
      containerRef.current.innerHTML = htmlWithoutScripts;

      // Kemudian execute setiap script
      scripts.forEach((script) => {
        const newScript = document.createElement("script");

        // Copy attributes
        if (script.src) {
          newScript.src = script.src;
          newScript.async = script.async || true;
        }

        // Copy script content jika ada
        if (script.textContent) {
          newScript.textContent = script.textContent;
        }

        // Copy other attributes
        script.getAttributeNames().forEach((attr) => {
          if (attr !== "src" && attr !== "textContent") {
            newScript.setAttribute(attr, script.getAttribute(attr) || "");
          }
        });

        containerRef.current?.appendChild(newScript);
      });
    } catch (error) {
      console.error(`Error rendering widget ${id}:`, error);
      // Fallback: try rendering dengan dangerouslySetInnerHTML style
      if (containerRef.current) {
        containerRef.current.innerHTML = content;
      }
    }
  }, [content, id]);

  return (
    <div
      ref={containerRef}
      className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
      data-widget-id={id}
    />
  );
}
