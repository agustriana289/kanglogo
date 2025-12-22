// app/api/branding/generate/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import {
  GeneratorOptions,
  GeneratedResult,
} from "@/types/brand-name-generator";

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function hasConsecutiveConsonants(str: string, count: number = 3): boolean {
  const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
  let consecutive = 0;
  for (const char of str) {
    if (consonants.includes(char)) {
      consecutive++;
      if (consecutive >= count) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

function scoreNameQuality(name: string): number {
  let score = 100;

  const length = name.length;
  if (length < 4) score -= 30;
  else if (length > 15) score -= 20;
  else if (length >= 6 && length <= 12) score += 10;

  if (hasConsecutiveConsonants(name, 3)) score -= 25;

  const vowels = 'aeiouAEIOU';
  const vowelCount = Array.from(name).filter(c => vowels.includes(c)).length;
  const vowelRatio = vowelCount / length;
  if (vowelRatio >= 0.3 && vowelRatio <= 0.5) score += 10;

  return Math.max(0, score);
}

function generateNames(
  keywords: string[],
  inputText: string,
  wordLength: 2 | 3,
  prefix: string = "",
  separator: string = ""
): GeneratedResult[] {
  if (keywords.length === 0) return [];

  const prefixText = prefix ? `${prefix} ` : "";
  const results: Map<string, { name: string; full_name: string; score: number }> = new Map();

  const cleanInputText = inputText.trim();

  const addResult = (name: string) => {
    const normalized = name.toLowerCase();
    if (!results.has(normalized) && name.length >= 4 && name.length <= 20) {
      const score = scoreNameQuality(name);
      if (score > 30) {
        const capitalizedName = separator === " " || separator === "-"
          ? name.split(separator).map(capitalizeFirst).join(separator)
          : capitalizeFirst(name);
        const fullName = prefixText ? `${prefixText}${capitalizedName}` : capitalizedName;
        results.set(normalized, { name: capitalizedName, full_name: fullName, score });
      }
    }
  };

  if (wordLength === 2) {
    if (cleanInputText && cleanInputText.length > 0) {
      for (let j = 0; j < keywords.length; j++) {
        const userWord = cleanInputText.toLowerCase();
        const keywordWord = keywords[j].toLowerCase();

        if (separator) {
          addResult([userWord, keywordWord].join(separator));
          addResult([keywordWord, userWord].join(separator));
        } else {
          addResult(userWord + keywordWord);
          addResult(keywordWord + userWord);

          if (userWord.length >= 3 && keywordWord.length >= 3) {
            addResult(userWord.slice(0, -1) + keywordWord.slice(1));
            addResult(userWord.slice(0, -2) + keywordWord.slice(2));
            addResult(keywordWord.slice(0, -1) + userWord.slice(1));
            addResult(keywordWord.slice(0, -2) + userWord.slice(2));
          }

          if (userWord.length >= 4 && keywordWord.length >= 4) {
            const midUser = Math.floor(userWord.length / 2);
            const midKeyword = Math.floor(keywordWord.length / 2);
            addResult(userWord.slice(0, midUser) + keywordWord.slice(midKeyword));
            addResult(userWord.slice(0, midUser + 1) + keywordWord.slice(midKeyword));
            addResult(keywordWord.slice(0, midKeyword) + userWord.slice(midUser));
          }

          if (userWord.length >= 3) {
            addResult(userWord.slice(0, 3) + keywordWord);
            addResult(userWord.slice(0, 2) + keywordWord);
          }
          if (keywordWord.length >= 3) {
            addResult(userWord + keywordWord.slice(-3));
            addResult(userWord + keywordWord.slice(-2));
            addResult(keywordWord.slice(0, 3) + userWord);
            addResult(keywordWord.slice(0, 2) + userWord);
          }

          for (let k = 1; k < Math.min(userWord.length, 3); k++) {
            const overlap = userWord.slice(-k);
            if (keywordWord.startsWith(overlap)) {
              addResult(userWord + keywordWord.slice(k));
            }
          }
          for (let k = 1; k < Math.min(keywordWord.length, 3); k++) {
            const overlap = keywordWord.slice(-k);
            if (userWord.startsWith(overlap)) {
              addResult(keywordWord + userWord.slice(k));
            }
          }
        }
      }
    } else {
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          if (i !== j) {
            const word1 = keywords[i].toLowerCase();
            const word2 = keywords[j].toLowerCase();

            if (separator) {
              addResult([word1, word2].join(separator));
            } else {
              addResult(word1 + word2);

              if (word1.length >= 3 && word2.length >= 3) {
                addResult(word1.slice(0, -1) + word2.slice(1));
                addResult(word1.slice(0, -2) + word2.slice(2));
              }

              if (word1.length >= 4 && word2.length >= 4) {
                const mid1 = Math.floor(word1.length / 2);
                const mid2 = Math.floor(word2.length / 2);
                addResult(word1.slice(0, mid1) + word2.slice(mid2));
                addResult(word1.slice(0, mid1 + 1) + word2.slice(mid2));
              }

              if (word1.length >= 3) {
                addResult(word1.slice(0, 3) + word2);
                addResult(word1.slice(0, 2) + word2);
              }
              if (word2.length >= 3) {
                addResult(word1 + word2.slice(-3));
                addResult(word1 + word2.slice(-2));
              }

              for (let k = 1; k < Math.min(word1.length, 3); k++) {
                const overlap = word1.slice(-k);
                if (word2.startsWith(overlap)) {
                  addResult(word1 + word2.slice(k));
                }
              }
            }
          }
        }
      }
    }
  } else if (wordLength === 3) {
    if (cleanInputText && cleanInputText.length > 0) {
      for (let j = 0; j < keywords.length; j++) {
        for (let k = 0; k < keywords.length; k++) {
          if (j !== k) {
            const userWord = cleanInputText.toLowerCase();
            const keyword1 = keywords[j].toLowerCase();
            const keyword2 = keywords[k].toLowerCase();

            if (separator) {
              addResult([userWord, keyword1, keyword2].join(separator));
              addResult([keyword1, userWord, keyword2].join(separator));
              addResult([keyword1, keyword2, userWord].join(separator));
            } else {
              addResult(userWord + keyword1 + keyword2);
              addResult(keyword1 + userWord + keyword2);
              addResult(keyword1 + keyword2 + userWord);

              if (userWord.length >= 2 && keyword1.length >= 2 && keyword2.length >= 2) {
                addResult(userWord.slice(0, 2) + keyword1.slice(0, 2) + keyword2);
                addResult(userWord + keyword1.slice(0, 2) + keyword2.slice(0, 2));
                addResult(userWord.slice(0, 2) + keyword1 + keyword2.slice(0, 2));
              }

              if (userWord.length >= 3 && keyword1.length >= 3 && keyword2.length >= 3) {
                const midUser = Math.floor(userWord.length / 2);
                const mid1 = Math.floor(keyword1.length / 2);
                const mid2 = Math.floor(keyword2.length / 2);
                addResult(userWord.slice(0, midUser) + keyword1.slice(0, mid1) + keyword2.slice(mid2));
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i < keywords.length; i++) {
        for (let j = 0; j < keywords.length; j++) {
          for (let k = 0; k < keywords.length; k++) {
            if (i !== j && j !== k && i !== k) {
              const word1 = keywords[i].toLowerCase();
              const word2 = keywords[j].toLowerCase();
              const word3 = keywords[k].toLowerCase();

              if (separator) {
                addResult([word1, word2, word3].join(separator));
              } else {
                addResult(word1 + word2 + word3);

                if (word1.length >= 2 && word2.length >= 2 && word3.length >= 2) {
                  addResult(word1.slice(0, 2) + word2.slice(0, 2) + word3);
                  addResult(word1 + word2.slice(0, 2) + word3.slice(0, 2));
                  addResult(word1.slice(0, 2) + word2 + word3.slice(0, 2));
                }

                if (word1.length >= 3 && word2.length >= 3 && word3.length >= 3) {
                  const mid1 = Math.floor(word1.length / 2);
                  const mid2 = Math.floor(word2.length / 2);
                  const mid3 = Math.floor(word3.length / 2);
                  addResult(word1.slice(0, mid1) + word2.slice(0, mid2) + word3.slice(mid3));
                }
              }
            }
          }
        }
      }
    }
  }

  const sortedResults = Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .map(({ name, full_name }) => ({ name, full_name }));

  for (let i = sortedResults.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sortedResults[i], sortedResults[j]] = [sortedResults[j], sortedResults[i]];
  }

  return sortedResults;
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
