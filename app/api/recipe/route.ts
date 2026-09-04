import { NextResponse } from "next/server";
import { buildRecipe } from "@/lib/mock";
import { completeJson, keyFromRequest } from "@/lib/llm";
import { RECIPE_SYSTEM } from "@/lib/prompts";
import { slugId } from "@/lib/parse-json";
import type { Diet, MealType, PantryAnswer, Recipe } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mealId?: string;
      mealName?: string;
      mealType?: MealType;
      diet?: Diet;
      cuisine?: string;
      inventory?: string[];
      pantry?: PantryAnswer[];
      variant?: number;
    };

    const pantry = body.pantry ?? [];
    if (pantry.length && pantry.some((p) => p.have !== true && p.have !== false)) {
      return NextResponse.json(
        { error: "Answer every pantry question with yes or no." },
        { status: 400 },
      );
    }
    if (!body.mealName) {
      return NextResponse.json({ error: "Pick a meal first." }, { status: 400 });
    }

    const key = keyFromRequest();
    if (key) {
      try {
        const result = await completeJson<Omit<Recipe, "id" | "mealType" | "cuisine">>({
          key,
          system: RECIPE_SYSTEM,
          temperature: (body.variant ?? 0) > 0 ? 0.8 : 0.4,
          user: JSON.stringify({
            ...body,
            instruction:
              (body.variant ?? 0) > 0
                ? "Write a different recipe for this dish than a generic first draft: change the method, spice mix, or structure."
                : undefined,
          }),
        });
        const recipe: Recipe = {
          id: slugId("r"),
          name: result.name || body.mealName,
          mealType: body.mealType ?? "dinner",
          cuisine: body.cuisine ?? "Surprise me",
          serves: Math.min(8, result.serves || 2),
          timeMin: result.timeMin || 30,
          ingredients: (result.ingredients ?? []).slice(0, 8),
          steps: (result.steps ?? []).slice(0, 8),
          notes: result.notes || "",
        };
        return NextResponse.json({ recipe, source: "llm" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Recipe failed.";
        if (message !== "NO_KEY") {
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }
    }

    return NextResponse.json({
      recipe: buildRecipe({
        mealId: body.mealId,
        mealName: body.mealName,
        mealType: body.mealType ?? "dinner",
        diet: body.diet ?? "eggless_veg",
        cuisine: body.cuisine ?? "Surprise me",
        inventory: body.inventory ?? [],
        pantry,
        variant: body.variant,
      }),
      source: "demo",
    });
  } catch {
    return NextResponse.json({ error: "Could not write that recipe." }, { status: 400 });
  }
}
