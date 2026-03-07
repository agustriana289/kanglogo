// app/api/branding/keywords/[id]/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// DELETE - Hapus keyword
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("brand_keywords")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Keyword deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
