import type { CatalogMeal, Diet, MealType } from "./types";
import { CATALOG_00 } from "./catalog-00";
import { CATALOG_01 } from "./catalog-01";
import { CATALOG_02 } from "./catalog-02";
import { CATALOG_03 } from "./catalog-03";
import { CATALOG_04 } from "./catalog-04";
import { CATALOG_05 } from "./catalog-05";
import { CATALOG_06 } from "./catalog-06";
import { CATALOG_07 } from "./catalog-07";

export type { CatalogMeal } from "./types";

export const CATALOG: CatalogMeal[] = [
  ...CATALOG_00,
  ...CATALOG_01,
  ...CATALOG_02,
  ...CATALOG_03,
  ...CATALOG_04,
  ...CATALOG_05,
  ...CATALOG_06,
  ...CATALOG_07,
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
