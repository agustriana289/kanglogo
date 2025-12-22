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
  prefix: string = ""
): GeneratedResult[] {
  if (keywords.length === 0) return [];

  const prefixText = prefix ? `${prefix} ` : "";
  const results: GeneratedResult[] = [];

  // Fungsi untuk generate kombinasi dari array
  const generateCombinations = (arr: string[], length: number): string[][] => {
    const result: string[][] = [];
    const n = arr.length;
    const indices = Array(length).fill(0);

    while (true) {
      // Tambahkan kombinasi saat ini
      const combination = indices.map((i) => arr[i]);
      result.push(combination);

      // Generate kombinasi berikutnya
      let i = length - 1;
      while (i >= 0 && indices[i] === n - 1) {
        indices[i] = 0;
        i--;
      }

      if (i < 0) break;
      indices[i]++;
    }

    return result;
  };

  // Generate kombinasi dari keywords
  const combinations = generateCombinations(keywords, wordLength);

  // Batasi maksimal hasil ke 100 kombinasi untuk performa
  const limitedCombinations = combinations.slice(0, 100);

  limitedCombinations.forEach((combo) => {
    const name = combo.join("");
    const fullName = prefixText ? `${prefixText}${name}` : name;
    results.push({
      name,
      full_name: fullName,
    });
  });

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { industryId, inputText, prefix, wordLength }: GeneratorOptions =
      body;

    if (!industryId || !wordLength) {
      return NextResponse.json(
        { error: "Industry ID and word length are required" },
        { status: 400 }
      );
    }

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
      prefix || ""
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
