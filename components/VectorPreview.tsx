// components/VectorPreview.tsx
"use client";

import { useState, useEffect } from "react";
import {
  getGoogleDrivePreviewUrl,
  getGoogleDriveAlternativePreviewUrl,
  getGoogleDriveThumbnailUrl,
} from "@/lib/googleDriveUtils";

interface VectorPreviewProps {
  fileId: string | null;
  name: string;
  className?: string;
}

type PreviewMethod = "api" | "direct" | "thumbnail" | "alternative";

export default function VectorPreview({
  fileId,
  name,
  className = "",
}: VectorPreviewProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentMethod, setCurrentMethod] = useState<PreviewMethod>("api");

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(false);
      setErrorMessage("");

      try {
        // Method 1: Try API route (server-side proxy with Google Drive API)
        if (currentMethod === "api") {
          try {
            const response = await fetch(
              `/api/vector-preview?fileId=${fileId}`
            );

            if (response.ok) {
              const content = await response.text();
              setSvgContent(content);
              setImageUrl(null);
              setLoading(false);
              return;
            } else {
              console.warn("API method failed, trying direct method");
              setCurrentMethod("direct");
              return;
            }
          } catch (apiErr) {
            console.warn("API method error:", apiErr);
            setCurrentMethod("direct");
            return;
          }
        }

        // Method 2: Try direct Google Drive preview URL
        if (currentMethod === "direct") {
          const directUrl = getGoogleDrivePreviewUrl(fileId);

          try {
            const img = new Image();
            img.onload = () => {
              setImageUrl(directUrl);
              setSvgContent(null);
              setLoading(false);
            };
            img.onerror = () => {
              console.warn("Direct method failed, trying thumbnail");
              setCurrentMethod("thumbnail");
            };
            img.src = directUrl;

            // Set timeout in case onload/onerror doesn't fire
            setTimeout(() => {
              if (loading && !imageUrl && !svgContent) {
                setCurrentMethod("thumbnail");
              }
            }, 3000);
            return;
          } catch (directErr) {
            console.warn("Direct method error:", directErr);
            setCurrentMethod("thumbnail");
            return;
          }
        }

        // Method 3: Try thumbnail URL
        if (currentMethod === "thumbnail") {
          const thumbnailUrl = getGoogleDriveThumbnailUrl(fileId, 800);

          try {
            const img = new Image();
            img.onload = () => {
              setImageUrl(thumbnailUrl);
              setSvgContent(null);
              setLoading(false);
            };
            img.onerror = () => {
              console.warn("Thumbnail method failed, trying alternative");
              setCurrentMethod("alternative");
            };
            img.src = thumbnailUrl;

            setTimeout(() => {
              if (loading && !imageUrl && !svgContent) {
                setCurrentMethod("alternative");
              }
            }, 3000);
            return;
          } catch (thumbErr) {
            console.warn("Thumbnail method error:", thumbErr);
            setCurrentMethod("alternative");
            return;
          }
        }

        // Method 4: Try alternative preview URL
        if (currentMethod === "alternative") {
          const altUrl = getGoogleDriveAlternativePreviewUrl(fileId);

          try {
            const img = new Image();
            img.onload = () => {
              setImageUrl(altUrl);
              setSvgContent(null);
              setLoading(false);
            };
            img.onerror = () => {
              setError(true);
              setErrorMessage(
                "Semua metode preview gagal. Pastikan file sudah di-set sebagai 'Anyone with the link can view'"
              );
              setLoading(false);
            };
            img.src = altUrl;

            setTimeout(() => {
              if (loading) {
                setError(true);
                setErrorMessage(
                  "Preview timeout. File mungkin tidak dapat diakses."
                );
                setLoading(false);
              }
            }, 5000);
            return;
          } catch (altErr) {
            console.error("All preview methods failed:", altErr);
            setError(true);
            setErrorMessage("Tidak dapat memuat preview");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Preview error:", err);
        setError(true);
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchPreview();
  }, [fileId, currentMethod]);

  if (!fileId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No Preview</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || (!svgContent && !imageUrl)) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xs font-medium">Preview failed</p>
          {errorMessage && (
            <p className="text-xs text-gray-400 mt-1 px-2">{errorMessage}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Download to view</p>
        </div>
      </div>
    );
  }

  const checkerPatternStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage:
      "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  };

  // Render inline SVG with background pattern
  if (svgContent) {
    return (
      <div
        className={`${className} bg-checker-pattern`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={checkerPatternStyle}
      />
    );
  }

  // Render image preview
  if (imageUrl) {
    return (
      <div
        className={`${className} bg-checker-pattern`}
        style={checkerPatternStyle}
      >
        <img
          src={imageUrl}
          alt={name}
          className="max-w-full max-h-full object-contain"
          onError={() => {
            setError(true);
            setErrorMessage("Gagal memuat gambar");
          }}
        />
      </div>
    );
  }

  return null;
}
