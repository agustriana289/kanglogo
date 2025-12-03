// lib/imgbb-testi.ts
export async function uploadImageToImgBBTestimonial(
  imageFile: File
): Promise<string> {
  // Gunakan API key kedua yang Anda sebutkan
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY3;

  if (!apiKey) {
    throw new Error(
      "API key ImgBB tidak ditemukan. Pastikan NEXT_PUBLIC_IMGBB_API_KEY2 sudah diatur di file .env"
    );
  }

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", imageFile);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Gagal mengunggah gambar: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(
        data.error?.message || "Gagal mengunggah gambar ke ImgBB"
      );
    }
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    throw error;
  }
}
