import type { Cuisine, Diet, MealType } from "./types";

export type CatalogMeal = {
  id: string;
  name: string;
  description: string;
  cuisine: Exclude<Cuisine, "Surprise me">;
  mealTypes: MealType[];
  diets: Diet[];
  timeMin: number;
  uses: string[];
  staples: string[];
  ingredients: string[];
  steps: string[];
  notes: string;
  packable: boolean;
};

const V = ["vegetarian", "eggless_veg"] as Diet[];
const VE = ["vegetarian", "eggless_veg", "vegan"] as Diet[];
const NV = ["nonveg"] as Diet[];
const VG = ["vegetarian"] as Diet[]; // may include eggs
const VN = ["vegetarian", "nonveg"] as Diet[];

export const CATALOG: CatalogMeal[] = [
  {
    id: "oat-yogurt",
    name: "Lemon yogurt oats",
    description: "Warm oats with yogurt, a squeeze of lemon, and whatever fruit you have.",
    cuisine: "American",
    mealTypes: ["breakfast"],
    diets: V,
    timeMin: 10,
    uses: ["oats", "yogurt", "lemon", "milk", "banana", "honey"],
    staples: ["rolled oats", "honey"],
    ingredients: ["1 cup rolled oats", "1 cup milk or water", "1/2 cup yogurt", "1/2 lemon, juiced", "fruit you have, sliced"],
    steps: ["Simmer oats in milk until creamy, about 5 minutes.", "Stir in yogurt off the heat so it stays silky.", "Finish with lemon and fruit."],
    notes: "Skip honey for a fully unsweetened bowl. Maple works if you keep it.",
    packable: false
  }
];

export function mealFitsDiet(meal: CatalogMeal, diet: Diet): boolean {
  const tags = new Set(meal.diets);
  switch (diet) {
    case "vegan":
      return tags.has("vegan");
    case "eggless_veg":
      return tags.has("eggless_veg") || tags.has("vegan");
    case "vegetarian":
      return tags.has("vegetarian") || tags.has("eggless_veg") || tags.has("vegan");
    case "nonveg":
      return true;
  }
}

export function mealFitsType(meal: CatalogMeal, mealType: MealType): boolean {
  return meal.mealTypes.includes(mealType);
}
