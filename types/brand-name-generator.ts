// types/brand-name-generator.ts

export interface BrandIndustry {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandKeyword {
  id: string;
  industry_id: string;
  keyword: string;
  created_at?: string;
}

export interface GeneratedName {
  id: string;
  industry_id: string;
  generated_name: string;
  input_text?: string;
  prefix?: string;
  word_length?: number;
  created_at?: string;
}

export interface GeneratorOptions {
  industryId: string;
  inputText: string;
  prefix?: "PT" | "CV" | "TOKO" | "STUDIO" | "AGENCY" | "";
  wordLength: 2 | 3;
}

export interface GeneratedResult {
  name: string;
  full_name: string;
}
