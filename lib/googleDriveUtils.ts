// lib/googleDriveUtils.ts

/**
 * Extract file ID from various Google Drive URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
    if (!url) return null;

    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];

    // Format 2: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];

    // Format 3: Just the file ID itself
    if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;

    return null;
}

/**
 * Convert Google Drive link to direct download URL
 */
export function getGoogleDriveDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Convert Google Drive link to preview/embed URL for SVG
 * Using lh3.googleusercontent format for better compatibility
 */
export function getGoogleDrivePreviewUrl(fileId: string): string {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Alternative preview URL (fallback)
 */
export function getGoogleDriveAlternativePreviewUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Get thumbnail URL (for images)
 */
export function getGoogleDriveThumbnailUrl(fileId: string, size: number = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

/**
 * Get iframe embed URL
 */
export function getGoogleDriveIframeUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
}
