// app/api/branding/industries/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { BrandIndustry } from "@/types/brand-name-generator";

// GET - Ambil semua industri
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("brand_industries")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching industries:", error);
    return NextResponse.json(
      { error: "Failed to fetch industries" },
      { status: 500 }
    );
  }
}

// POST - Tambah industri baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Industry name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("brand_industries")
      .insert([
        {
          name,
          description: description || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating industry:", error);
    return NextResponse.json(
      { error: "Failed to create industry" },
      { status: 500 }
    );
  }
}
