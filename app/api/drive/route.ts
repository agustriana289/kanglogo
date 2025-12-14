import { NextRequest, NextResponse } from "next/server";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webContentLink?: string;
  webViewLink?: string;
}

interface DriveApiResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

// Extract folder ID from various Google Drive URL formats
function extractFolderId(url: string): string | null {
  // Format: https://drive.google.com/drive/folders/FOLDER_ID
  // Format: https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // Format: https://drive.google.com/open?id=FOLDER_ID
  // Format: FOLDER_ID (direct ID)

  if (!url) return null;

  // If it's already just an ID (no slashes or dots)
  if (/^[a-zA-Z0-9_-]+$/.test(url) && url.length > 20) {
    return url;
  }

  // Match folder URL patterns
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // Match open?id= pattern
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

// Get file category based on MIME type
function getFileCategory(mimeType: string): string {
  if (mimeType === "application/vnd.google-apps.folder") return "Folder";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType === "application/pdf") return "Document";
  if (mimeType.includes("document") || mimeType.includes("word")) return "Document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "Presentation";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("compressed")) return "Archive";
  return "File";
}

// Format file size
function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "-";
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderUrl = searchParams.get("folderUrl");
  const folderId = searchParams.get("folderId");

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Drive API key not configured" },
      { status: 500 }
    );
  }

  // Get folder ID from URL or direct ID
  const targetFolderId = folderId || (folderUrl ? extractFolderId(folderUrl) : null);

  if (!targetFolderId) {
    return NextResponse.json(
      { error: "Invalid or missing folder URL/ID" },
      { status: 400 }
    );
  }

  try {
    // Fetch folder metadata to get its name
    const folderMetaUrl = `https://www.googleapis.com/drive/v3/files/${targetFolderId}?fields=id,name&key=${apiKey}`;
    const folderMetaResponse = await fetch(folderMetaUrl);
    let folderName = "Files";

    if (folderMetaResponse.ok) {
      const folderMeta = await folderMetaResponse.json();
      folderName = folderMeta.name || "Files";
    }

    // Fetch folder contents from Google Drive API
    const fields = "files(id,name,mimeType,size,modifiedTime,webContentLink,webViewLink)";
    const query = `'${targetFolderId}' in parents and trashed = false`;
    const orderBy = "folder,name";

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&key=${apiKey}&pageSize=100`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const error = await response.json();
      console.error("Google Drive API error:", error);
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch from Google Drive" },
        { status: response.status }
      );
    }

    const data: DriveApiResponse = await response.json();

    // Transform the response
    const files = data.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      category: getFileCategory(file.mimeType),
      size: formatFileSize(file.size),
      sizeBytes: file.size ? parseInt(file.size) : 0,
      modifiedTime: file.modifiedTime,
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      downloadLink: file.webContentLink || null,
      viewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    }));

    // Sort: folders first, then files by name
    files.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      folderId: targetFolderId,
      folderName,
      files,
      totalFiles: files.filter(f => !f.isFolder).length,
      totalFolders: files.filter(f => f.isFolder).length,
    });

  } catch (error) {
    console.error("Error fetching Drive contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder contents" },
      { status: 500 }
    );
  }
}
