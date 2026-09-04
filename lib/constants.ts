import type { Cuisine, Diet, MealType, PlanDuration } from "./types";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Quick snack",
  lunchbox: "Lunchbox",
};

export const MEAL_TYPE_HINTS: Record<MealType, string> = {
  breakfast: "Something you can actually eat before the day starts.",
  lunch: "A proper midday plate from what you already have.",
  dinner: "Tonight, solved — weeknight-friendly.",
  snack: "Under 10 minutes, almost no cleanup.",
  lunchbox:
    "Packs well, fine at room temperature for hours, kid-friendly, not messy or smelly.",
};

export const DIET_LABELS: Record<Diet, string> = {
  vegetarian: "Vegetarian",
  eggless_veg: "Eggless veg",
  vegan: "Vegan",
  nonveg: "Non-veg",
};

export const DIET_HINTS: Record<Diet, string> = {
  vegetarian: "No meat or fish. Eggs and dairy are okay.",
  eggless_veg:
    "No meat, fish, or eggs in any form — including mayo, egg pasta, binders, and washes. Dairy is fine. Egg-free swaps are named.",
  vegan: "No animal products.",
  nonveg: "Meat and fish welcome.",
};

export const DURATION_LABELS: Record<PlanDuration, string> = {
  7: "This week",
  14: "Two weeks",
  28: "Full month",
};

export const GROCERY_CAPS: Record<PlanDuration, number> = {
  7: 18,
  14: 24,
  28: 30,
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ASSUMED_STAPLES = [
  "salt",
  "pepper",
  "black pepper",
  "sugar",
  "cooking oil",
  "oil",
  "vegetable oil",
  "olive oil",
  "water",
];

export const CUISINE_EMOJI: Record<Cuisine, string> = {
  Italian: "🍝",
  Indian: "🍛",
  Mexican: "🌮",
  Chinese: "🥟",
  Thai: "🍜",
  Japanese: "🍱",
  Mediterranean: "🫒",
  Korean: "🥬",
  "Middle Eastern": "🧆",
  American: "🍔",
  "Surprise me": "✨",
};

export const STORAGE_KEYS = {
  inventory: "snap2supper:inventory",
  saved: "snap2supper:saved",
  plan: "snap2supper:plan",
  grocery: "snap2supper:grocery",
} as const;
