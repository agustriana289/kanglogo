// app/api/branding/keywords/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET - Ambil keywords untuk industri tertentu
export async function GET(req: NextRequest) {
  try {
    const industryId = req.nextUrl.searchParams.get("industryId");

    if (!industryId) {
      return NextResponse.json(
        { error: "Industry ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("brand_keywords")
      .select("*")
      .eq("industry_id", industryId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// POST - Tambah keyword baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { industry_id, keyword } = body;

    if (!industry_id || !keyword) {
      return NextResponse.json(
        { error: "Industry ID and keyword are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("brand_keywords")
      .insert([
        {
          industry_id,
          keyword: keyword.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating keyword:", error);
    return NextResponse.json(
      { error: "Failed to create keyword" },
      { status: 500 }
    );
  }
}
