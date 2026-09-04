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
  {"id":"oat-yogurt"},
  {"id":"masala-oats"},
  {"id":"avocado-toast"},
  {"id":"besan-chilla"},
  {"id":"shakshuka-tofu"},
  {"id":"miso-soup"},
  {"id":"veg-fried-rice"},
  {"id":"chana-masala"},
  {"id":"dal-tadka"},
  {"id":"palak-paneer"},
  {"id":"aloo-paratha-style"},
  {"id":"pasta-pomodoro"},
  {"id":"minestrone"},
  {"id":"caprese-box"},
  {"id":"bean-tacos"},
  {"id":"quesadilla"},
  {"id":"veg-chili"},
  {"id":"grilled-cheese"},
  {"id":"veg-stirfry"},
  {"id":"mapo-tofu-veg"},
  {"id":"pad-thai-tofu"},
  {"id":"thai-curry"},
  {"id":"onigiri-box"},
  {"id":"veg-katsu-bowl"},
  {"id":"greek-bowl"},
  {"id":"shakshuka-no"},
  {"id":"hummus-box"},
  {"id":"falafel-wrap"},
  {"id":"bibimbap"},
  {"id":"kimbap-veg"},
  {"id":"kimchi-fried-rice"},
  {"id":"mejadra"},
  {"id":"mac-cheese"},
  {"id":"pancake-banana"},
  {"id":"idli-upma-style"},
  {"id":"spring-rolls-fresh"},
  {"id":"pho-ish"},
  {"id":"ratatouille"},
  {"id":"breakfast-burrito"},
  {"id":"chicken-rice"},
  {"id":"egg-bhurji"},
  {"id":"omelette"},
  {"id":"tuna-pasta"},
  {"id":"pb-banana"},
  {"id":"corn-chaat"},
  {"id":"soup-tomato"},
  {"id":"couscous-salad"},
  {"id":"japchae-veg"},
  {"id":"okonomiyaki-eggless"},
  {"id":"veg-biryani"},
  {"id":"rajma"},
  {"id":"veg-korma"},
  {"id":"mushroom-masala"},
  {"id":"baingan"},
  {"id":"sambar-veg"},
  {"id":"poha"},
  {"id":"pav-style-mash"},
  {"id":"aglio-spinaci"},
  {"id":"white-bean-stew"},
  {"id":"elote-bowl"},
  {"id":"enchilada-skillet"},
  {"id":"black-bean-soup"},
  {"id":"ginger-tofu-noodles"},
  {"id":"hot-sour-soup"},
  {"id":"basil-tofu"},
  {"id":"tom-yum-veg"},
  {"id":"teriyaki-veg"},
  {"id":"udon-peanut"},
  {"id":"spanakorizo"},
  {"id":"gigantes"},
  {"id":"mujaddara-bowl"},
  {"id":"fattoush-box"},
  {"id":"doenjang-stew"},
  {"id":"scallion-pancake"},
  {"id":"sloppy-lentil"},
  {"id":"loaded-potato"},
  {"id":"chicken-wrap"},
  {"id":"tuna-box"}
] as CatalogMeal[];

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
