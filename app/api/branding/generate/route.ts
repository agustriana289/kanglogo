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
  const seen = new Set<string>();

  const cleanInputText = inputText.trim();

  // Jika ada inputText, hasil harus selalu mengandung inputText
  if (cleanInputText && cleanInputText.length > 0) {
    if (wordLength === 2) {
      // Kombinasi: InputText + Keyword
      keywords.forEach((keyword) => {
        const name = [cleanInputText, keyword].join(separator);
        if (!seen.has(name)) {
          const fullName = prefixText ? `${prefixText}${name}` : name;
          results.push({ name, full_name: fullName });
          seen.add(name);
        }
      });
      // Juga: Keyword + InputText (untuk variasi)
      keywords.forEach((keyword) => {
        const name = [keyword, cleanInputText].join(separator);
        if (!seen.has(name)) {
          const fullName = prefixText ? `${prefixText}${name}` : name;
          results.push({ name, full_name: fullName });
          seen.add(name);
        }
      });
    } else if (wordLength === 3) {
      // Kombinasi: InputText + Keyword1 + Keyword2
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          if (i !== j) {
            const name = [cleanInputText, keywords[i], keywords[j]].join(separator);
            if (!seen.has(name)) {
              const fullName = prefixText ? `${prefixText}${name}` : name;
              results.push({ name, full_name: fullName });
              seen.add(name);
            }
          }
        }
      }
    }
  } else {
    // Jika TIDAK ada inputText, gunakan kombinasi dari keywords biasa
    const shuffledKeywords = keywords.sort(() => Math.random() - 0.5);

    const generateCombinations = (arr: string[], length: number): string[][] => {
      const result: string[][] = [];

      if (length === 2) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            if (i !== j) {
              result.push([arr[i], arr[j]]);
            }
          }
        }
      } else if (length === 3) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            for (let k = 0; k < arr.length; k++) {
              if (i !== j && j !== k && i !== k) {
                result.push([arr[i], arr[j], arr[k]]);
              }
            }
          }
        }
      }

      return result;
    };

    const combinations = generateCombinations(shuffledKeywords, wordLength);
    const limitedCombinations = combinations.slice(0, 20);

    limitedCombinations.forEach((combo) => {
      const name = combo.join(separator);
      if (!seen.has(name)) {
        const fullName = prefixText ? `${prefixText}${name}` : name;
        results.push({ name, full_name: fullName });
        seen.add(name);
      }
    });
  }

  return results.slice(0, 20);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      industryId,
      inputText,
      prefix,
      wordLength,
      separator,
    }: GeneratorOptions & { separator?: string } = body;

    if (!industryId || !wordLength) {
      return NextResponse.json(
        { error: "Industry ID and word length are required" },
        { status: 400 }
      );
    }

    // Default separator berdasarkan word length
    // 2 kata: menyambung (default), 3 kata: spasi (default)
    const finalSeparator =
      separator !== undefined ? separator : wordLength === 3 ? " " : "";

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
