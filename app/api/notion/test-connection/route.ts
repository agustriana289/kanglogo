import { NextRequest, NextResponse } from "next/server";
import { testNotionConnection } from "@/lib/notion";

export async function GET(request: NextRequest) {
    try {
        const result = await testNotionConnection();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error in test-connection API:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
