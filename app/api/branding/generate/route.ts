// app/api/branding/generate/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import {
  GeneratorOptions,
  GeneratedResult,
} from "@/types/brand-name-generator";

function generateNames(
  keywords: string[],
  inputText: string,
  wordLength: 2 | 3,
  prefix: string = "",
  separator: string = ""
): GeneratedResult[] {
  if (keywords.length === 0) return [];

  const prefixText = prefix ? `${prefix} ` : "";
  const results: GeneratedResult[] = [];
  const seen = new Set<string>(); // Untuk hindari duplikat

  // Jika ada inputText, tambahkan ke keywords list
  let finalKeywords = [...keywords];
  const cleanInputText = inputText.trim();
  if (cleanInputText && cleanInputText.length > 0) {
    // Tambahkan input text sebagai keyword tambahan
    finalKeywords = [cleanInputText, ...finalKeywords];
  }

  // Shuffle keywords untuk randomness
  const shuffledKeywords = finalKeywords.sort(() => Math.random() - 0.5);

  // Generate kombinasi dengan perkalian kartesian
  const generateCombinations = (arr: string[], length: number): string[][] => {
    const result: string[][] = [];
    
    if (length === 2) {
      // Untuk 2 kata: kombinasi berbeda, hindari duplikat (A+A, B+B, dll)
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          // Skip kombinasi yang sama word-nya
          if (i !== j) {
            result.push([arr[i], arr[j]]);
          }
        }
      }
    } else if (length === 3) {
      // Untuk 3 kata: kombinasi berbeda
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          for (let k = 0; k < arr.length; k++) {
            // Skip jika semua sama atau ada duplikat bersebelahan
            if (i !== j && j !== k && i !== k) {
              result.push([arr[i], arr[j], arr[k]]);
            }
          }
        }
      }
    }

    return result;
  };

  // Generate kombinasi dari keywords
  const combinations = generateCombinations(shuffledKeywords, wordLength);

  // Batasi maksimal hasil ke 100 kombinasi untuk performa
  const limitedCombinations = combinations.slice(0, 100);

  limitedCombinations.forEach((combo) => {
    const name = combo.join(separator);
    // Hindari duplikat hasil akhir
    if (!seen.has(name)) {
      const fullName = prefixText ? `${prefixText}${name}` : name;
      results.push({
        name,
        full_name: fullName,
      });
      seen.add(name);
    }
  });

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { industryId, inputText, prefix, wordLength, separator }: GeneratorOptions & { separator?: string } =
      body;

    if (!industryId || !wordLength) {
      return NextResponse.json(
        { error: "Industry ID and word length are required" },
        { status: 400 }
      );
    }

    // Default separator berdasarkan word length
    // 2 kata: menyambung (default), 3 kata: spasi (default)
    const finalSeparator = separator !== undefined ? separator : (wordLength === 3 ? " " : "");

    // Ambil keywords untuk industri
    const { data: keywords, error: keywordsError } = await supabase
      .from("brand_keywords")
      .select("keyword")
      .eq("industry_id", industryId);

    if (keywordsError) throw keywordsError;

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "No keywords found for this industry" },
        { status: 400 }
      );
    }

    const keywordsList = keywords.map((k) => k.keyword);
    const results = generateNames(
      keywordsList,
      inputText,
      wordLength,
      prefix || "",
      finalSeparator
    );

    // Optional: Simpan hasil generated names ke database
    if (results.length > 0) {
      const namesToInsert = results.slice(0, 10).map((result) => ({
        industry_id: industryId,
        generated_name: result.full_name,
        input_text: inputText,
        prefix: prefix || null,
        word_length: wordLength,
        created_at: new Date().toISOString(),
      }));

      await supabase.from("brand_generated_names").insert(namesToInsert);
    }

    return NextResponse.json(
      {
        data: results,
        total: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating names:", error);
    return NextResponse.json(
      { error: "Failed to generate names" },
      { status: 500 }
    );
  }
}
