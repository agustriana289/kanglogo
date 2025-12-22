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

  if (cleanInputText && cleanInputText.length > 0) {
    // Dengan input text - kombinasi input + keywords
    if (wordLength === 2) {
      keywords.forEach((keyword) => {
        // Posisi 1: InputText + Keyword
        const name1 = [cleanInputText, keyword].join(separator);
        if (!seen.has(name1)) {
          const fullName = prefixText ? `${prefixText}${name1}` : name1;
          results.push({ name: name1, full_name: fullName });
          seen.add(name1);
        }

        // Posisi 2: Keyword + InputText
        const name2 = [keyword, cleanInputText].join(separator);
        if (!seen.has(name2)) {
          const fullName = prefixText ? `${prefixText}${name2}` : name2;
          results.push({ name: name2, full_name: fullName });
          seen.add(name2);
        }
      });
    } else if (wordLength === 3) {
      // 3 kata dengan input text
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          if (i !== j) {
            // Posisi 1: InputText + K1 + K2
            const name1 = [cleanInputText, keywords[i], keywords[j]].join(separator);
            if (!seen.has(name1)) {
              const fullName = prefixText ? `${prefixText}${name1}` : name1;
              results.push({ name: name1, full_name: fullName });
              seen.add(name1);
            }

            // Posisi 2: K1 + InputText + K2
            const name2 = [keywords[i], cleanInputText, keywords[j]].join(separator);
            if (!seen.has(name2)) {
              const fullName = prefixText ? `${prefixText}${name2}` : name2;
              results.push({ name: name2, full_name: fullName });
              seen.add(name2);
            }

            // Posisi 3: K1 + K2 + InputText
            const name3 = [keywords[i], keywords[j], cleanInputText].join(separator);
            if (!seen.has(name3)) {
              const fullName = prefixText ? `${prefixText}${name3}` : name3;
              results.push({ name: name3, full_name: fullName });
              seen.add(name3);
            }
          }
        }
      }
    }
  } else {
    // Tanpa input text - kombinasi keywords saja
    if (wordLength === 2) {
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          if (i !== j) {
            const name = [keywords[i], keywords[j]].join(separator);
            if (!seen.has(name)) {
              const fullName = prefixText ? `${prefixText}${name}` : name;
              results.push({ name, full_name: fullName });
              seen.add(name);
            }
          }
        }
      }
    } else if (wordLength === 3) {
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          for (let k = 0; k < keywords.length; k++) {
            if (i !== j && j !== k && i !== k) {
              const name = [keywords[i], keywords[j], keywords[k]].join(separator);
              if (!seen.has(name)) {
                const fullName = prefixText ? `${prefixText}${name}` : name;
                results.push({ name, full_name: fullName });
                seen.add(name);
              }
            }
          }
        }
      }
    }
  }

  return results;
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
