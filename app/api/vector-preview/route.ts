// app/api/vector-preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveDownloadUrl } from "@/lib/googleDriveUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  try {
    // Dapatkan URL download langsung dari Google Drive
    const downloadUrl = getGoogleDriveDownloadUrl(fileId);

    // Fetch konten file dari Google Drive
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      console.error("Failed to fetch from Google Drive:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch file from Google Drive" },
        { status: response.status }
      );
    }

    // Dapatkan konten file sebagai teks (karena itu adalah SVG)
    const svgContent = await response.text();

    // Kembalikan konten SVG dengan header yang benar
    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        // Cache selama 1 jam untuk performa lebih baik
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in vector-preview API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
