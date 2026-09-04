import { NextResponse } from "next/server";
import { visionConfigured } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({ vision: visionConfigured() });
}
