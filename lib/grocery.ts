import { GROCERY_CAPS } from "./constants";
import { inventoryHas, normalizeName, slugId } from "./parse-json";
import type {
  GroceryItem,
  GroceryList,
  GrocerySection,
  MealPlan,
  PlanDuration,
} from "./types";

const ASSUMED = new Set([
  "salt",
  "pepper",
  "black pepper",
  "sugar",
  "oil",
  "cooking oil",
  "vegetable oil",
  "olive oil",
  "water",
  "ice",
]);

const SKIP = [
  "garnish",
  "optional",
  "to taste",
  "for serving",
  "fresh herbs if",
];

function classify(name: string): GrocerySection {
  const n = normalizeName(name);
  if (
    /(chicken|beef|pork|fish|shrimp|lamb|turkey|bacon|sausage|tofu|tempeh|paneer|egg|dal|lentil|chickpea|bean|protein)/.test(
      n,
    )
  ) {
    if (/(tofu|tempeh|paneer|dal|lentil|chickpea|bean)/.test(n)) {
      return "Meat & Protein";
    }
    if (/egg/.test(n)) return "Dairy & Eggs";
    return "Meat & Protein";
  }
  if (
    /(milk|yogurt|yoghurt|curd|cheese|butter|cream|ghee|paneer)/.test(n)
  ) {
    return "Dairy & Eggs";
  }
  if (
    /(frozen|ice cream)/.test(n)
  ) {
    return "Frozen & Other";
  }
  if (
    /(spice|cumin|coriander|turmeric|paprika|chili|chilli|garam|masala|soy sauce|vinegar|ketchup|mustard|mayo|sauce|paste|sesame|tahini|miso|gochujang|oregano|basil dried|cinnamon|cardamom|clove)/.test(
      n,
    )
  ) {
    return "Spices & Condiments";
  }
  if (
    /(rice|pasta|flour|noodle|bread|tortilla|oat|quinoa|couscous|wrap|cereal|can|canned|oil|sugar|salt)/.test(
      n,
    )
  ) {
    return "Grains & Pantry";
  }
  if (
    /(tomato|onion|garlic|potato|carrot|spinach|lettuce|pepper|cucumber|lemon|lime|avocado|cabbage|broccoli|ginger|herb|cilantro|coriander leaves|mint|apple|banana|berry|fruit|salad|leaf|peas|corn|zucchini|eggplant|mushroom)/.test(
      n,
    )
  ) {
    return "Produce";
  }
  return "Frozen & Other";
}

function quantityFor(name: string, duration: PlanDuration): string {
  const n = normalizeName(name);
  const weeks = duration / 7;
  if (/rice/.test(n)) return weeks >= 4 ? "2 kg" : weeks >= 2 ? "1.5 kg" : "1 kg";
  if (/pasta|noodle/.test(n)) return weeks >= 2 ? "1 kg" : "500 g";
  if (/flour|oat/.test(n)) return weeks >= 2 ? "1 kg" : "500 g";
  if (/onion|potato|tomato/.test(n))
    return weeks >= 4 ? "2 kg" : weeks >= 2 ? "1.5 kg" : "1 kg";
  if (/milk/.test(n)) return weeks >= 2 ? "2 L" : "1 L";
  if (/yogurt|curd/.test(n)) return weeks >= 2 ? "1 kg" : "500 g";
  if (/cheese|paneer/.test(n)) return weeks >= 2 ? "400 g" : "200 g";
  if (/chicken|tofu/.test(n)) return weeks >= 2 ? "1 kg" : "500 g";
  if (/spice|cumin|masala|paprika/.test(n)) return "1 pack";
  if (/oil/.test(n)) return "1 bottle";
  if (/bread|tortilla/.test(n)) return weeks >= 2 ? "2 packs" : "1 pack";
  if (/egg/.test(n)) return weeks >= 2 ? "1 dozen" : "6";
  if (/lemon|lime/.test(n)) return weeks >= 2 ? "8" : "4";
  if (/garlic/.test(n)) return "1 bulb";
  if (/ginger/.test(n)) return "1 small piece";
  return weeks >= 2 ? "2 packs" : "1 pack";
}

function mealIngredientNames(plan: MealPlan): string[] {
  const names: string[] = [];
  for (const week of plan.weeks) {
    for (const day of week.days) {
      names.push(day.breakfast, day.lunch, day.dinner);
    }
  }
  return names;
}

/** Rough shopping needs inferred from meal titles + a small pantry kit. */
export function buildGroceryList(
  plan: MealPlan,
  inventory: string[],
  extraNeeds: string[] = [],
): GroceryList {
  const duration = plan.duration;
  const cap = GROCERY_CAPS[duration];
  const candidates = [
    ...inferNeedsFromPlan(plan),
    ...extraNeeds,
  ];

  const merged = new Map<string, string>();
  for (const raw of candidates) {
    const name = normalizeName(raw);
    if (!name) continue;
    if (ASSUMED.has(name)) continue;
    if (SKIP.some((s) => name.includes(s))) continue;
    if (inventoryHas(inventory, name)) continue;
    if (!merged.has(name)) merged.set(name, name);
  }

  const items: GroceryItem[] = [...merged.values()].map((name) => ({
    id: slugId("g"),
    name,
    quantity: quantityFor(name, duration),
    section: classify(name),
    checked: false,
    custom: false,
  }));

  items.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));

  const trimmed = prioritize(items, cap, plan);
  return { items: trimmed, duration };
}

function prioritize(items: GroceryItem[], cap: number, plan: MealPlan): GroceryItem[] {
  if (items.length <= cap) return items;
  const rank = (item: GroceryItem) => {
    const n = item.name;
    if (plan.diet === "eggless_veg" && /egg/.test(n) && !/eggplant/.test(n))
      return -100;
    if (item.section === "Meat & Protein") return 50;
    if (item.section === "Produce") return 40;
    if (item.section === "Dairy & Eggs") return 35;
    if (item.section === "Grains & Pantry") return 30;
    if (item.section === "Spices & Condiments") return 10;
    return 5;
  };
  return [...items].sort((a, b) => rank(b) - rank(a)).slice(0, cap);
}

function inferNeedsFromPlan(plan: MealPlan): string[] {
  const titles = mealIngredientNames(plan).join(" ").toLowerCase();
  const needs: string[] = [];
  const push = (item: string, when: boolean) => {
    if (when) needs.push(item);
  };

  push("rice", /rice|biryani|fried rice|poke|bowl|curry/.test(titles));
  push("pasta", /pasta|spaghetti|penne|aglio|lasagna/.test(titles));
  push("flour tortillas", /taco|burrito|quesadilla|fajita/.test(titles));
  push("bread", /sandwich|toast|grilled cheese|avocado toast/.test(titles));
  push("oats", /oat|porridge/.test(titles));
  push("chickpeas", /chana|hummus|falafel|chickpea/.test(titles));
  push("lentils", /dal|lentil|sambar/.test(titles));
  push("tofu", /tofu|mapo|bibimbap/.test(titles) && plan.diet !== "nonveg");
  push("paneer", /paneer/.test(titles));
  push("yogurt", /raita|tzatziki|yogurt|lassi|parfait/.test(titles));
  push("cheddar", /cheese|quesadilla|grilled cheese|mac /.test(titles));
  push("tomatoes", /tomato|salsa|shakshuka|marinara|pasta/.test(titles));
  push("onions", /onion|curry|stir|taco|soup/.test(titles));
  push("garlic", true);
  push("lemons", /lemon|greek|mediterranean|tea/.test(titles));
  push("spinach", /spinach|saag|green/.test(titles));
  push("potatoes", /potato|aloo|hash|roast/.test(titles));
  push("carrots", /carrot|bento|stew|soup/.test(titles));
  push("cucumbers", /cucumber|lunchbox|tzatziki|kimbap/.test(titles));
  push("bell peppers", /pepper|fajita|stir/.test(titles));
  push("frozen peas", /peas|fried rice|shepherd/.test(titles));
  push("soy sauce", /soy|stir|teriyaki|fried rice|ramen/.test(titles));
  push("cumin", /cumin|taco|chili|curry|mexican|indian/.test(titles));
  push("garam masala", /masala|curry|tikka|biryani|indian/.test(titles));
  push("tortillas", /quesadilla|taco/.test(titles));
  push("noodles", /noodle|ramen|pad thai|lo mein/.test(titles));
  push("coconut milk", /thai|curry|laksa|coconut/.test(titles));
  push("tahini", /hummus|falafel|middle eastern/.test(titles));
  push("gochujang", /korean|bibimbap|kimchi/.test(titles));
  push("miso", /miso|japanese/.test(titles));
  push("rolled oats", /granola|breakfast/.test(titles) && plan.duration >= 7);

  if (plan.diet === "nonveg") {
    push("chicken thighs", /chicken|dinner/.test(titles));
  } else if (plan.diet === "vegan") {
    push("extra-firm tofu", true);
    push("oat milk", /breakfast|oat|cereal/.test(titles));
  } else {
    push("milk", /breakfast|oat|cereal|mac /.test(titles));
  }

  if (plan.packableLunches) {
    push("whole wheat wraps", true);
    push("apples", true);
  }

  return needs;
}

export function groceryToChecklist(list: GroceryList): string {
  const groups = new Map<string, GroceryItem[]>();
  for (const item of list.items) {
    const arr = groups.get(item.section) ?? [];
    arr.push(item);
    groups.set(item.section, arr);
  }
  const lines = [`Snap2Supper list · ${list.items.length} items`, ""];
  for (const [section, items] of groups) {
    if (!items.length) continue;
    lines.push(section);
    for (const item of items) {
      const mark = item.checked ? "x" : " ";
      lines.push(`[${mark}] ${item.name} — ${item.quantity}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
