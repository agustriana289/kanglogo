// lib/imgbb-project.ts
export async function uploadImageToImgBB(
  imageFile: File,
  apiKeyNumber: 1 | 2 = 2
): Promise<string> {
  const apiKey =
    apiKeyNumber === 1
      ? process.env.NEXT_PUBLIC_IMGBB_API_KEY
      : process.env.NEXT_PUBLIC_IMGBB_API_KEY2;

  if (!apiKey) {
    throw new Error(
      `API key ImgBB ${apiKeyNumber} tidak ditemukan. Pastikan NEXT_PUBLIC_IMGBB_API_KEY${
        apiKeyNumber === 1 ? "" : "2"
      } sudah diatur di file .env`
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
