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
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const separatorDesc = separator === " "
            ? "dengan spasi"
            : separator === "-"
                ? "dengan dash (-)"
                : "tanpa pemisah (menyambung)";

        const prompt = `Kamu adalah ahli branding dan naming yang kreatif. Tugasmu adalah membuat nama brand yang unik, natural, dan bermakna.

KONTEKS:
- Input user: "${userInput}"
- Industri: ${industryName}
- Keywords industri: ${keywords.join(", ")}
- Jumlah kata: ${wordLength} kata
- Format: ${separatorDesc}

ATURAN PENTING:
1. SEMUA nama HARUS mengandung kata "${userInput}"
2. Kombinasi harus MASUK AKAL dan BERMAKNA - jangan gabungkan kata yang tidak ada hubungannya
3. Nama harus cocok untuk bisnis ${industryName}
4. Buat nama yang terdengar natural dan mudah diingat
5. Hindari kombinasi yang aneh seperti "Bakso Kopi" (tidak masuk akal)

CONTOH NAMA YANG BAGUS:
- ${userInput}ria (elegan, seperti nama brand)
- Sedap${userInput} (jelas untuk makanan enak)
- ${userInput}Food (langsung menunjukkan bisnis food)
- ${userInput} Manis Madu (kombinasi yang bermakna)
- Warung ${userInput} (sederhana tapi jelas)
- ${userInput} Kitchen (modern dan jelas)

CONTOH NAMA YANG BURUK (JANGAN BUAT SEPERTI INI):
- ${userInput} Bakso Kopi (bakso dan kopi tidak ada hubungannya)
- Modern ${userInput} Selera (kata-kata acak)
- ${userInput} Pedas Manis (kontradiktif)

Generate 100 nama brand yang unik, bermakna, dan masuk akal. Format output: satu nama per baris, tanpa numbering atau bullet points.`;

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
