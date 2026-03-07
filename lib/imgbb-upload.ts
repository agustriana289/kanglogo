// lib/imgbb-upload.ts
// Upload file ke ImgBB (gratis, tanpa setup)

export async function uploadToImgBB(file: File): Promise<{ url: string; error: any }> {
    try {
        // API key ImgBB (dapatkan dari https://api.imgbb.com/)
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'c8ec1ecdba5c04f65538b28824e06cb6';

        // Convert file to base64
        const base64 = await fileToBase64(file);

        // Create form data
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', base64.split(',')[1]); // Remove data:image/... prefix
        formData.append('name', file.name);

        // Upload to ImgBB
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.message || 'Upload failed');
        }

        return {
            url: data.data.url, // Direct image URL
            error: null
        };
    } catch (error: any) {
        return {
            url: '',
            error: error.message || 'Upload failed'
        };
    }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
