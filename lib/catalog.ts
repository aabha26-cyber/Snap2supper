import type { Cuisine, Diet, MealType } from "./types";

export type CatalogMeal = {
  id: string;
  name: string;
  description: string;
  cuisine: Exclude\u003cCuisine, "Surprise me"\u003e;
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
const VG = ["vegetarian"] as Diet[];
const VN = ["vegetarian", "nonveg"] as Diet[];

export const CATALOG: CatalogMeal[] = [];

export function mealFitsDiet(meal: CatalogMeal, diet: Diet): boolean {
  const tags = new Set(meal.diets);
  switch (diet) {
    case "vegan": return tags.has("vegan");
    case "eggless_veg": return tags.has("eggless_veg") || tags.has("vegan");
    case "vegetarian": return tags.has("vegetarian") || tags.has("eggless_veg") || tags.has("vegan");
    case "nonveg": return true;
  }
}

export function mealFitsType(meal: CatalogMeal, mealType: MealType): boolean {
  return meal.mealTypes.includes(mealType);
}
