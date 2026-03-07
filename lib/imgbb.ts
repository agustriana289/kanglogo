// lib/imgbb.ts
export async function uploadToImgBB(imageFile: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("API Key ImgBB tidak ditemukan");
  }

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("key", apiKey);
  formData.append("expiration", "31536000"); // 1 tahun

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Gagal mengunggah gambar: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.url;
  } catch (error) {
    console.error("Error uploading to ImgBB:", error);
    throw error;
  }
}
