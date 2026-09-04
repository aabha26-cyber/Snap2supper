import { NextResponse } from "next/server";
import { completeJson, keyFromRequest } from "@/lib/llm";
import { SCAN_SYSTEM } from "@/lib/prompts";
import { dedupeNames } from "@/lib/parse-json";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { images?: string[] };
    const images = body.images ?? [];
    if (!images.length) {
      return NextResponse.json(
        { error: "Add at least one photo — fridge, freezer, pantry, or counter." },
        { status: 400 },
      );
    }

    const key = keyFromRequest();
    if (!key) {
      return NextResponse.json(
        {
          code: "NEEDS_KEY",
          error:
            "Photo scan isn't connected on this app yet. Use Sample kitchen or type what you have — meal ideas still work.",
        },
        { status: 401 },
      );
    }

    try {
      const result = await completeJson<{ items?: string[] }>({
        key,
        system: SCAN_SYSTEM,
        user: `Identify every edible item in these ${images.length} photo(s). Only name foods you can actually see.`,
        images,
        temperature: 0.2,
      });
      const items = dedupeNames(result.items ?? []);
      if (!items.length) {
        return NextResponse.json({
          items: [],
          source: "vision",
          notice:
            "I didn't spot food in that shot. Try a closer photo with the door open, or add items by hand.",
        });
      }
      return NextResponse.json({ items, source: "vision" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed.";
      if (message === "NO_KEY") {
        return NextResponse.json(
          {
            code: "NEEDS_KEY",
            error:
              "Photo scan isn't connected on this app yet. Use Sample kitchen or type what you have — meal ideas still work.",
          },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch {
    return NextResponse.json(
      { error: "Could not read those photos. Try again?" },
      { status: 400 },
    );
  }
}
