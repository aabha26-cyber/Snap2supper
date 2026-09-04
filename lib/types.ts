export const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "lunchbox",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const DIETS = ["vegetarian", "eggless_veg", "vegan", "nonveg"] as const;
export type Diet = (typeof DIETS)[number];

export const CUISINES = [
  "Italian",
  "Indian",
  "Mexican",
  "Chinese",
  "Thai",
  "Japanese",
  "Mediterranean",
  "Korean",
  "Middle Eastern",
  "American",
  "Surprise me",
] as const;
export type Cuisine = (typeof CUISINES)[number];

export const SPECIFIC_CUISINES = CUISINES.filter((c) => c !== "Surprise me");

export const PLAN_DURATIONS = [7, 14, 28] as const;
export type PlanDuration = (typeof PLAN_DURATIONS)[number];

export const GROCERY_SECTIONS = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Protein",
  "Grains & Pantry",
  "Spices & Condiments",
  "Frozen & Other",
] as const;
export type GrocerySection = (typeof GROCERY_SECTIONS)[number];

export type MealSuggestion = {
  id: string;
  name: string;
  description: string;
  timeMin: number;
  cuisine: string;
  usesFromInventory: string[];
  staplesToAsk: string[];
};

export type Recipe = {
  id: string;
  name: string;
  mealType: MealType;
  cuisine: string;
  serves: number;
  timeMin: number;
  ingredients: string[];
  steps: string[];
  notes: string;
};

export type SavedRecipe = Recipe & { savedAt: string };

export type DayPlan = {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
};

export type WeekPlan = {
  weekIndex: number;
  label: string;
  days: DayPlan[];
};

export type MealPlan = {
  duration: PlanDuration;
  diet: Diet;
  cuisines: string[];
  packableLunches: boolean;
  weeks: WeekPlan[];
  generatedAt: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: string;
  section: GrocerySection;
  checked: boolean;
  custom: boolean;
};

export type GroceryList = {
  items: GroceryItem[];
  duration: PlanDuration;
};

export type PantryAnswer = {
  staple: string;
  have: boolean | null;
};

export type PhotoAsset = {
  id: string;
  dataUrl: string;
};
