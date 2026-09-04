import { CATALOG, mealFitsDiet, mealFitsType, type CatalogMeal } from "./catalog";
import { WEEKDAYS } from "./constants";
import { buildGroceryList } from "./grocery";
import { dedupeNames, inventoryHas, normalizeName, slugId } from "./parse-json";
import type {
  Cuisine,
  DayPlan,
  Diet,
  GroceryList,
  MealPlan,
  MealSuggestion,
  MealType,
  PantryAnswer,
  PlanDuration,
  Recipe,
  WeekPlan,
} from "./types";

function scoreMeal(meal: CatalogMeal, inventory: string[]): number {
  let score = 0;
  for (const use of meal.uses) {
    if (inventoryHas(inventory, use)) score += 3;
  }
  score += Math.max(0, 4 - meal.staples.length);
  if (meal.timeMin <= 30) score += 1;
  return score;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = (seed + 1) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

const NAME_TWISTS = ["Weeknight", "One-pan", "Skillet", "Herby", "Spiced", "Lemon-bright", "Fridge-raid"];

function twistMeal(
  meal: CatalogMeal,
  inventory: string[],
  n: number,
): CatalogMeal {
  const star =
    inventory[n % Math.max(inventory.length, 1)] || "what's in the fridge";
  const prefix = NAME_TWISTS[n % NAME_TWISTS.length]!;
  return {
    ...meal,
    id: `${meal.id}-v${n}`,
    name: `${prefix} ${meal.name}`,
    description: `${meal.description} This pass leans on ${star}.`,
    uses: dedupeNames([...meal.uses, star]),
  };
}

export function suggestMeals(input: {
  inventory: string[];
  mealType: MealType;
  diet: Diet;
  cuisine: Cuisine;
  excludeIds?: string[];
  round?: number;
}): MealSuggestion[] {
  const inventory = dedupeNames(input.inventory);
  const round = input.round ?? 0;
  const excluded = new Set((input.excludeIds ?? []).map((id) => id.split("-v")[0]!));

  const pool = CATALOG.filter(
    (m) => mealFitsDiet(m, input.diet) && mealFitsType(m, input.mealType),
  );

  const ranked = seededShuffle(
    pool
      .map((meal) => ({ meal, score: scoreMeal(meal, inventory) }))
      .sort((a, b) => b.score - a.score || a.meal.id.localeCompare(b.meal.id)),
    round * 17 + inventory.join(",").length,
  );

  const cuisineWanted = input.cuisine;
  const pickFrom = (allowExcluded: boolean) => {
    const chosen: CatalogMeal[] = [];
    const consider = (meal: CatalogMeal, requireCuisine: boolean) => {
      if (chosen.length >= 6) return;
      if (chosen.some((c) => c.id.split("-v")[0] === meal.id.split("-v")[0])) return;
      if (!allowExcluded && excluded.has(meal.id.split("-v")[0]!)) return;
      if (requireCuisine && cuisineWanted !== "Surprise me" && meal.cuisine !== cuisineWanted) {
        return;
      }
      chosen.push(round > 0 ? twistMeal(meal, inventory, round * 6 + chosen.length) : meal);
    };
    for (const row of ranked) consider(row.meal, true);
    for (const row of ranked) consider(row.meal, false);
    for (const meal of CATALOG) {
      if (!mealFitsDiet(meal, input.diet)) continue;
      consider(meal, false);
    }
    return chosen;
  };

  let chosen = pickFrom(false);
  if (chosen.length < 6) chosen = pickFrom(true);

  return chosen.slice(0, 6).map((meal) => {
    const usesFromInventory = meal.uses.filter((u) => inventoryHas(inventory, u));
    const staplesToAsk = meal.staples
      .filter((s) => !inventoryHas(inventory, s))
      .slice(0, 6);
    return {
      id: meal.id,
      name: meal.name,
      description: meal.description,
      timeMin: meal.timeMin,
      cuisine: meal.cuisine,
      usesFromInventory,
      staplesToAsk,
    };
  });
}
