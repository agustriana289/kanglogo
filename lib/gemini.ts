import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateBrandNamesWithAI(
    userInput: string,
    industryName: string,
    keywords: string[],
    wordLength: 2 | 3,
    separator: string = ""
): Promise<string[]> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                topK: 40,
            }
        });

        const separatorDesc = separator === " "
            ? "dengan spasi"
            : separator === "-"
                ? "dengan dash (-)"
                : "tanpa pemisah (menyambung)";

        const prompt = `Kamu adalah branding expert profesional yang telah membuat ratusan nama brand sukses. Tugasmu adalah menciptakan nama brand yang KREATIF, UNIK, dan MUDAH DIINGAT.

KONTEKS:
- Kata kunci user: "${userInput}"
- Industri: ${industryName}
- Keywords relevan: ${keywords.slice(0, 10).join(", ")}
- Jumlah kata: ${wordLength} kata
- Format: ${separatorDesc}

PRINSIP NAMA BRAND YANG BAGUS:
1. MUDAH DIUCAPKAN - Hindari kombinasi huruf yang sulit (contoh: "Gojek" mudah, "Xtrqwz" sulit)
2. BERMAKNA - Ada cerita atau makna di balik nama (contoh: "Tokopedia" = Toko + Encyclopedia)
3. UNIK - Berbeda dari kompetitor, memorable
4. RELEVAN - Cocok dengan industri ${industryName}
5. MODERN - Terdengar fresh dan contemporary

INSPIRASI DARI BRAND TERKENAL:
- Gojek (Go + Ojek) - Simple, jelas, mudah diingat
- Tokopedia (Toko + Encyclopedia) - Menggambarkan marketplace lengkap
- Bukalapak (Buka + Lapak) - Friendly, Indonesia banget
- Shopee (Shop + Free/Easy) - Catchy, modern
- Grab (Grab = Ambil) - Satu kata, powerful
- Traveloka (Travel + Oka) - Elegan, profesional

TEKNIK KREATIF YANG BISA DIGUNAKAN:
1. Portmanteau: Gabung 2 kata jadi 1 (contoh: "Insta" + "Gram" = Instagram)
2. Suffix kreatif: Tambah -ia, -ly, -fy, -hub, -go (contoh: Spotify, Shopify)
3. Kata bermakna: Gunakan kata yang punya arti bagus (contoh: "Pijar" = cahaya)
4. Alliteration: Kata yang bunyinya mirip (contoh: Coca-Cola, PayPal)
5. Metaphor: Gunakan simbol/metafora (contoh: Amazon = besar seperti sungai Amazon)

ATURAN WAJIB:
✓ HARUS mengandung kata "${userInput}" (bisa di awal, tengah, atau akhir)
✓ HARUS cocok untuk bisnis ${industryName}
✓ HARUS mudah diucapkan dan diingat
✓ HARUS terdengar natural, BUKAN hasil bot
✓ Hindari kombinasi aneh seperti "Bakso Kopi" atau "Modern Selera Pedas"

CONTOH NAMA YANG BAGUS untuk "${userInput}":
- ${userInput}Hub (modern, tech-savvy)
- ${userInput}Go (action-oriented, energik)
- ${userInput}ria (elegan, feminine)
- ${userInput}Verse (modern, universe-like)
- ${userInput} & Co (profesional, established)
- The ${userInput} (premium, eksklusif)

Generate 100 nama brand yang KREATIF dan NATURAL. Buat yang benar-benar bisa dipakai untuk bisnis nyata!
Format: satu nama per baris, tanpa numbering.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const names = text
            .split("\n")
            .map(name => name.trim())
            .filter(name => name.length > 0 && name.toLowerCase().includes(userInput.toLowerCase()))
            .slice(0, 100);

        return names;
    } catch (error) {
        console.error("Error generating names with AI:", error);
        return [];
    }
}
