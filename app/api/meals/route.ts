import { NextResponse } from "next/server";
import { suggestMeals } from "@/lib/mock";
import { completeJson, keyFromRequest } from "@/lib/llm";
import { MEALS_SYSTEM } from "@/lib/prompts";
import type { Cuisine, Diet, MealSuggestion, MealType } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      inventory?: string[];
      mealType?: MealType;
      diet?: Diet;
      cuisine?: Cuisine;
      excludeIds?: string[];
      excludeNames?: string[];
      round?: number;
    };
    const inventory = body.inventory ?? [];
    const mealType = body.mealType ?? "dinner";
    const diet = body.diet ?? "eggless_veg";
    const cuisine = body.cuisine ?? "Surprise me";
    const excludeIds = body.excludeIds ?? [];
    const excludeNames = body.excludeNames ?? [];
    const round = body.round ?? 0;

    if (!inventory.length) {
      return NextResponse.json(
        { error: "Add at least one kitchen item before asking what's for supper." },
        { status: 400 },
      );
    }

    const key = keyFromRequest();
    if (key) {
      try {
        const result = await completeJson<{ meals?: MealSuggestion[] }>({
          key,
          system: MEALS_SYSTEM,
          temperature: round > 0 ? 0.95 : 0.5,
          user: JSON.stringify({
            inventory,
            mealType,
            diet,
            cuisine,
            excludeIds,
            excludeNames,
            round,
            instruction:
              round > 0
                ? "Return 6 NEW dishes. Do not repeat any excluded names or ids. Vary proteins, sauces, and cooking methods."
                : undefined,
          }),
        });
        const meals = (result.meals ?? [])
          .filter((m) => !excludeNames.includes(m.name))
          .slice(0, 6);
        if (meals.length) {
          return NextResponse.json({ meals, source: "llm" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Meal ideas failed.";
        if (message !== "NO_KEY") {
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }
    }

    return NextResponse.json({
      meals: suggestMeals({
        inventory,
        mealType,
        diet,
        cuisine,
        excludeIds,
        round,
      }),
      source: "demo",
    });
  } catch {
    return NextResponse.json({ error: "Could not generate meals." }, { status: 400 });
  }
}
