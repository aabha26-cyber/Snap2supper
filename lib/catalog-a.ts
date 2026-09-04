import type { CatalogMeal, Diet } from "./types";

const V = ["vegetarian", "eggless_veg"] as Diet[];
const VE = ["vegetarian", "eggless_veg", "vegan"] as Diet[];
const NV = ["nonveg"] as Diet[];
const VG = ["vegetarian"] as Diet[];
const VN = ["vegetarian", "nonveg"] as Diet[];

export const CATALOG_A: CatalogMeal[] = [
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
    ingredients: [
      "1 cup rolled oats",
      "1 cup milk or water",
      "1/2 cup yogurt",
      "1/2 lemon, juiced",
      "fruit you have, sliced",
    ],
    steps: [
      "Simmer oats in milk until creamy, about 5 minutes.",
      "Stir in yogurt off the heat so it stays silky.",
      "Finish with lemon and fruit.",
    ],
    notes: "Skip honey for a fully unsweetened bowl. Maple works if you keep it.",
    packable: false,
  },
  {
    id: "masala-oats",
    name: "Masala vegetable oats",
    description: "Savory Indian breakfast oats with onion, tomato, and a pinch of turmeric.",
    cuisine: "Indian",
    mealTypes: ["breakfast", "snack"],
    diets: VE,
    timeMin: 15,
    uses: ["oats", "onion", "tomato", "carrot", "peas", "spinach"],
    staples: ["rolled oats", "turmeric", "cumin"],
    ingredients: [
      "1 cup rolled oats",
      "1/2 onion, chopped",
      "1 tomato, chopped",
      "handful mixed veg",
      "1/2 tsp cumin and turmeric",
    ],
    steps: [
      "Sauté onion in a little oil until soft.",
      "Add tomato, spices, and veg; cook 2 minutes.",
      "Stir in oats and 2 cups water; simmer until thick.",
    ],
    notes: "Eggless and filling. Leftovers reheat with a splash of water.",
    packable: false,
  }
];
