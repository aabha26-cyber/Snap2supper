import { NextResponse } from "next/server";
import { groceryFromPlan } from "@/lib/mock";
import type { MealPlan } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      plan?: MealPlan;
      inventory?: string[];
    };
    if (!body.plan?.weeks?.length) {
      return NextResponse.json({ error: "Generate a plan first." }, { status: 400 });
    }
    const list = groceryFromPlan(body.plan, body.inventory ?? []);
    return NextResponse.json({ list });
  } catch {
    return NextResponse.json({ error: "Could not build the grocery list." }, { status: 400 });
  }
}
