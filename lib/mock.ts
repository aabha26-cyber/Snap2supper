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

export function buildRecipe(input: {
  mealId?: string;
  mealName: string;
  mealType: MealType;
  diet: Diet;
  cuisine: string;
  inventory: string[];
  pantry: PantryAnswer[];
  variant?: number;
}): Recipe {
  const inventory = dedupeNames(input.inventory);
  const baseId = input.mealId?.split("-v")[0];
  const catalog =
    CATALOG.find((m) => m.id === baseId) ||
    CATALOG.find((m) => m.id === input.mealId) ||
    CATALOG.find((m) => normalizeName(m.name) === normalizeName(input.mealName));

  const missing = input.pantry.filter((p) => p.have === false).map((p) => p.staple);
  const haveStaples = input.pantry.filter((p) => p.have === true).map((p) => p.staple);

  if (!catalog) {
    return fallbackRecipe(input, inventory, missing, haveStaples);
  }

  const ingredients = catalog.ingredients
    .filter((line) => {
      const lower = line.toLowerCase();
      return !missing.some((m) => lower.includes(normalizeName(m).split(" (")[0]!));
    })
    .slice(0, 8);

  const swaps: string[] = [];
  for (const miss of missing) {
    const swap = findSwap(miss, inventory, input.diet);
    if (swap) {
      ingredients.push(swap.line);
      swaps.push(swap.note);
    }
  }

  const notesParts = [catalog.notes];
  if (swaps.length) notesParts.push(swaps.join(" "));
  if (missing.length && !swaps.length) {
    notesParts.push(
      `I don't have a good workaround for ${missing.join(", ")}. The dish will be simpler — consider picking another meal if it feels essential.`,
    );
  }
  if (input.mealType === "lunchbox") {
    notesParts.push(
      catalog.packable
        ? "Packing tip: cool completely, pack wet and dry parts apart, and skip anything that smells strong by noon."
        : "Packing tip: this is better in a thermos than a dry box.",
    );
  }
  if (input.diet === "eggless_veg") {
    notesParts.push(
      "Eggless: no mayo, no egg pasta, no egg wash, no egg binder. Substitutions are named above.",
    );
  }
  if ((input.variant ?? 0) > 0) {
    notesParts.push("A fresh pass on this idea — different order, same kitchen.");
  }

  const steps = catalog.steps.slice(0, 8);
  if ((input.variant ?? 0) > 0) {
    steps.reverse();
  }
  if (missing.length) {
    steps.push("Taste at the end and adjust salt — substitutions change seasoning.");
  }

  return {
    id: slugId("r"),
    name: input.mealName || catalog.name,
    mealType: input.mealType,
    cuisine: catalog.cuisine,
    serves: 2,
    timeMin: catalog.timeMin,
    ingredients: ingredients.slice(0, 8),
    steps: steps.slice(0, 8),
    notes: notesParts.filter(Boolean).join(" "),
  };
}

function findSwap(staple: string, inventory: string[], diet: Diet) {
  const s = normalizeName(staple);
  if (/pasta|noodle/.test(s)) {
    if (inventoryHas(inventory, "rice"))
      return { line: "cooked rice (instead of pasta)", note: "No pasta? Serve the same sauce over rice." };
    if (inventoryHas(inventory, "bread"))
      return { line: "bread for scooping (instead of pasta)", note: "No pasta — eat it like a stew with bread." };
  }
  if (/rice/.test(s) && inventoryHas(inventory, "bread")) {
    return { line: "bread on the side (instead of rice)", note: "Missing rice: scoop with bread." };
  }
  if (/tortilla|wrap/.test(s) && inventoryHas(inventory, "bread")) {
    return { line: "bread or leftover roti (instead of tortillas)", note: "Tortillas swapped for bread you already have." };
  }
  if (/garam masala|cumin|spice/.test(s)) {
    return {
      line: "black pepper and a pinch of whatever dried herb you have",
      note: `Without ${staple}, keep the dish simple and peppery rather than fake-spicy.`,
    };
  }
  if (/tahini/.test(s) && inventoryHas(inventory, "yogurt") && diet !== "vegan") {
    return { line: "yogurt (instead of tahini)", note: "Tahini swapped for yogurt." };
  }
  if (/coconut milk/.test(s) && inventoryHas(inventory, "milk") && diet !== "vegan") {
    return { line: "milk + a spoon of nut butter if you have it (instead of coconut milk)", note: "Coconut milk missing — sauce will be lighter." };
  }
  if (/miso/.test(s) && inventoryHas(inventory, "soy")) {
    return { line: "extra soy sauce (instead of miso)", note: "No miso: salt with soy and keep it brothy." };
  }
  if (/gochujang/.test(s)) {
    return { line: "chili flakes + soy + a pinch of sugar", note: "No gochujang — a pantry chili-soy stand-in." };
  }
  if (/flour/.test(s) && inventoryHas(inventory, "oats")) {
    return { line: "blitzed oats (instead of flour)", note: "Oats can stand in for flour in pancakes and binders." };
  }
  if (/chickpea flour|besan/.test(s) && inventoryHas(inventory, "chickpeas")) {
    return { line: "mashed chickpeas (thicker, pan-fried)", note: "No besan: mash chickpeas into patties instead of pancakes." };
  }
  return null;
}

function fallbackRecipe(
  input: {
    mealName: string;
    mealType: MealType;
    diet: Diet;
    cuisine: string;
  },
  inventory: string[],
  missing: string[],
  haveStaples: string[],
): Recipe {
  const top = inventory.slice(0, 6);
  const ingredients = [
    ...top.map((i) => i),
    ...haveStaples.slice(0, 2),
  ].slice(0, 8);
  return {
    id: slugId("r"),
    name: input.mealName,
    mealType: input.mealType,
    cuisine: input.cuisine,
    serves: 2,
    timeMin: input.mealType === "snack" ? 10 : 30,
    ingredients: ingredients.length ? ingredients : ["salt", "whatever veg you kept"],
    steps: [
      "Chop everything you confirmed you have.",
      "Cook aromatics first (onion, garlic, ginger).",
      "Add the main items and a splash of water.",
      "Taste for salt and lemon.",
    ],
    notes:
      missing.length
        ? `Adapted without ${missing.join(", ")}. ${input.diet === "eggless_veg" ? "Kept fully eggless." : ""}`
        : "Cooked from your scanned kitchen.",
  };
}

export function planWeek(input: {
  weekIndex: number;
  weeksTotal: number;
  diet: Diet;
  cuisines: string[];
  packableLunches: boolean;
  inventory: string[];
  previousDinners: string[];
}): WeekPlan {
  const inventory = dedupeNames(input.inventory);
  const mix = rotateCuisines(input.cuisines);
  const usedDinners = new Set(input.previousDinners.map(normalizeName));
  const usedLunches = new Set<string>();

  const breakfastPool = rankPool(
    CATALOG.filter(
      (m) => mealFitsDiet(m, input.diet) && m.mealTypes.includes("breakfast"),
    ),
    inventory,
  );

  const lunchPool = buildLunchPool(input.diet, input.packableLunches, inventory);
  const dinnerPool = rankPool(
    CATALOG.filter(
      (m) =>
        mealFitsDiet(m, input.diet) &&
        m.mealTypes.includes("dinner") &&
        m.timeMin <= 40,
    ),
    inventory,
  );

  const breakfasts = breakfastRotation(breakfastPool);

  const days = WEEKDAYS.map((day, i) => {
    const cuisine = mix[(i + input.weekIndex) % mix.length]!;
    const breakfast = breakfasts[i % breakfasts.length]!;
    const lunch = pickDistinct(
      lunchPool,
      usedLunches,
      normalizeName(breakfast.name),
      i + input.weekIndex * 5,
    );
    usedLunches.add(normalizeName(lunch.name));
    const dinner = pickDinner(dinnerPool, cuisine, usedDinners, i + input.weekIndex);
    usedDinners.add(normalizeName(dinner.name));
    return {
      day,
      breakfast: breakfast.name,
      lunch: lunch.name,
      dinner: dinner.name,
    };
  });

  return {
    weekIndex: input.weekIndex,
    label: `Week ${input.weekIndex}`,
    days,
  };
}

function rankPool(pool: CatalogMeal[], inventory: string[]): CatalogMeal[] {
  return [...pool].sort(
    (a, b) => scoreMeal(b, inventory) - scoreMeal(a, inventory) || a.id.localeCompare(b.id),
  );
}

function buildLunchPool(
  diet: Diet,
  packable: boolean,
  inventory: string[],
): CatalogMeal[] {
  const fits = CATALOG.filter((m) => mealFitsDiet(m, diet));
  const layers: CatalogMeal[][] = packable
    ? [
        fits.filter((m) => m.mealTypes.includes("lunchbox") && m.packable),
        fits.filter((m) => m.mealTypes.includes("lunch") && m.packable),
        fits.filter((m) => m.packable),
        fits.filter((m) => m.mealTypes.includes("lunch")),
      ]
    : [
        fits.filter((m) => m.mealTypes.includes("lunch")),
        fits.filter((m) => m.mealTypes.includes("lunchbox")),
      ];
  const seen = new Set<string>();
  const out: CatalogMeal[] = [];
  for (const layer of layers) {
    for (const meal of rankPool(layer, inventory)) {
      if (seen.has(meal.id)) continue;
      seen.add(meal.id);
      out.push(meal);
    }
  }
  return out.length ? out : rankPool(fits, inventory);
}

function breakfastRotation(pool: CatalogMeal[]): CatalogMeal[] {
  const fallback = CATALOG.filter((m) => m.mealTypes.includes("breakfast"));
  const source = pool.length ? pool : fallback;
  const unique = source.slice(0, Math.min(3, source.length));
  return unique.length ? unique : [CATALOG[0]!];
}

function pickDistinct(
  pool: CatalogMeal[],
  used: Set<string>,
  avoid: string,
  seed: number,
): CatalogMeal {
  const source = pool.length ? pool : CATALOG;
  const fresh = source.filter((m) => {
    const n = normalizeName(m.name);
    return n !== avoid && !used.has(n);
  });
  if (fresh.length) return fresh[seed % fresh.length]!;
  const notBreakfast = source.filter((m) => normalizeName(m.name) !== avoid);
  if (notBreakfast.length) return notBreakfast[seed % notBreakfast.length]!;
  return source[seed % source.length]!;
}

function pickDinner(
  pool: CatalogMeal[],
  cuisine: string,
  previous: Set<string>,
  seed: number,
): CatalogMeal {
  const sameCuisine = pool.filter((m) => m.cuisine === cuisine && !previous.has(normalizeName(m.name)));
  if (sameCuisine.length) return sameCuisine[seed % sameCuisine.length]!;
  const fresh = pool.filter((m) => !previous.has(normalizeName(m.name)));
  if (fresh.length) return fresh[seed % fresh.length]!;
  return pool[seed % Math.max(pool.length, 1)] ?? CATALOG[0]!;
}

function rotateCuisines(cuisines: string[]): string[] {
  const specific = cuisines.filter((c) => c && c !== "Surprise me");
  if (!specific.length) {
    return [
      "Indian",
      "Italian",
      "Mexican",
      "Chinese",
      "Mediterranean",
      "American",
      "Thai",
    ];
  }
  return specific;
}

export function emptyPlan(duration: PlanDuration, diet: Diet, cuisines: string[], packable: boolean): MealPlan {
  return {
    duration,
    diet,
    cuisines,
    packableLunches: packable,
    weeks: [],
    generatedAt: new Date().toISOString(),
  };
}

export function planLooksThin(days: DayPlan[]): boolean {
  if (days.length < 7) return true;
  const lunches = new Set(days.map((d) => normalizeName(d.lunch)));
  const dinners = new Set(days.map((d) => normalizeName(d.dinner)));
  const copiedBreakfast = days.filter(
    (d) => normalizeName(d.breakfast) === normalizeName(d.lunch),
  ).length;
  return lunches.size < 4 || dinners.size < 5 || copiedBreakfast >= 3;
}

export function groceryFromPlan(plan: MealPlan, inventory: string[]): GroceryList {
  return buildGroceryList(plan, inventory);
}

export function cuisineMixCaption(cuisines: string[]): string {
  const specific = cuisines.filter((c) => c !== "Surprise me");
  if (!specific.length) return "Surprise mix — a different kitchen every night, none of them hogging the week.";
  if (specific.length === 1) return `All ${specific[0]} this plan, with breakfasts repeating so shopping stays short.`;
  return `Rotating ${specific.join(", ")} so no cuisine dominates. Breakfasts may repeat; dinners should not.`;
}
