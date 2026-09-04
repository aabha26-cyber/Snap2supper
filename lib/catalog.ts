import type { CatalogMeal, Diet, MealType } from "./types";
import { CATALOG_A } from "./catalog-a";
import { CATALOG_B } from "./catalog-b";

export type { CatalogMeal } from "./types";

export const CATALOG: CatalogMeal[] = [...CATALOG_A, ...CATALOG_B];

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
      // Omnivore: meat is allowed, vegetarian dishes still count.
      return true;
  }
}

export function mealFitsType(meal: CatalogMeal, mealType: MealType): boolean {
  return meal.mealTypes.includes(mealType);
}
