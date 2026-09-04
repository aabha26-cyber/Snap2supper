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
