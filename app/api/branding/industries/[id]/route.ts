// app/api/branding/industries/[id]/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// PUT - Update industri
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    const { data, error } = await supabase
      .from("brand_industries")
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating industry:", error);
    return NextResponse.json(
      { error: "Failed to update industry" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus industri
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Hapus semua keywords terkait industri terlebih dahulu
    await supabase
      .from("brand_keywords")
      .delete()
      .eq("industry_id", id);

    // Kemudian hapus industri
    const { error } = await supabase
      .from("brand_industries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Industry deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting industry:", error);
    return NextResponse.json(
      { error: "Failed to delete industry" },
      { status: 500 }
    );
  }
}
