"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InventoryChips } from "@/components/inventory-chips";
import { PhotoUploader } from "@/components/photo-uploader";
import { ProgressSteps } from "@/components/progress-steps";
import { ErrorRetry, LoadingNote } from "@/components/status";
import { ApiError, postJson } from "@/lib/api";
import {
  CUISINE_EMOJI,
  DIET_HINTS,
  DIET_LABELS,
  MEAL_TYPE_HINTS,
  MEAL_TYPE_LABELS,
} from "@/lib/constants";
import { dedupeNames, normalizeName } from "@/lib/parse-json";
import type {
  Cuisine,
  Diet,
  MealSuggestion,
  MealType,
  PantryAnswer,
  PhotoAsset,
  Recipe,
  SavedRecipe,
} from "@/lib/types";
import { CUISINES, DIETS, MEAL_TYPES } from "@/lib/types";

type CookStep = 0 | 1 | 2 | 3;

export function CookFlow({
  inventory,
  onInventory,
  saved,
  onSave,
}: {
  inventory: string[];
  onInventory: (items: string[]) => void;
  saved: SavedRecipe[];
  onSave: (recipe: SavedRecipe) => void;
}) {
  const [step, setStep] = useState<CookStep>(0);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [addValue, setAddValue] = useState("");

  const [mealType, setMealType] = useState<MealType>("dinner");
  const [diet, setDiet] = useState<Diet>("eggless_veg");
  const [cuisine, setCuisine] = useState<Cuisine>("Surprise me");
  const [meals, setMeals] = useState<MealSuggestion[] | null>(null);
  const [mealsError, setMealsError] = useState<string | null>(null);
  const [mealsLoading, setMealsLoading] = useState(false);

  const [picked, setPicked] = useState<MealSuggestion | null>(null);
  const [pantry, setPantry] = useState<PantryAnswer[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [ideaRound, setIdeaRound] = useState(0);
  const [seenMealIds, setSeenMealIds] = useState<string[]>([]);
  const [visionReady, setVisionReady] = useState<boolean | null>(null);

  const pantryReady = pantry.length === 0 || pantry.every((p) => p.have === true || p.have === false);
  const alreadySaved = recipe
    ? saved.some((s) => s.name === recipe.name && s.cuisine === recipe.cuisine)
    : false;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: { vision?: boolean }) => {
        if (!cancelled) setVisionReady(Boolean(data.vision));
      })
      .catch(() => {
        if (!cancelled) setVisionReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function scan() {
    if (!photos.length) {
      setScanError("Add a photo, or skip ahead and type items by hand.");
      return;
    }
    setScanning(true);
    setScanError(null);
    try {
      const merged: string[] = [];
      const chunk = 3;
      for (let i = 0; i < photos.length; i += chunk) {
        const slice = photos.slice(i, i + chunk).map((p) => p.dataUrl);
        const result = await postJson<{ items: string[]; notice?: string }>(
          "/api/scan",
          { images: slice },
        );
        merged.push(...result.items);
        if (result.notice) setScanNotice(result.notice);
      }
      onInventory(dedupeNames([...inventory, ...merged]));
      setStep(1);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.code === "NEEDS_KEY") setVisionReady(false);
      setScanError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  function addManual() {
    const n = normalizeName(addValue);
    if (!n) return;
    onInventory(dedupeNames([...inventory, n]));
    setAddValue("");
  }

  async function generateMeals() {
    if (!inventory.length) return;
    setMealsLoading(true);
    setMealsError(null);
    setPicked(null);
    setPantry([]);
    setRecipe(null);
    const refreshing = Boolean(meals?.length);
    const nextRound = refreshing ? ideaRound + 1 : 0;
    const excludeIds = refreshing ? seenMealIds : [];
    const excludeNames = refreshing ? (meals ?? []).map((m) => m.name) : [];
    try {
      const result = await postJson<{ meals: MealSuggestion[] }>("/api/meals", {
          inventory,
          mealType,
          diet,
          cuisine,
          excludeIds,
          excludeNames,
          round: nextRound,
        });
      setMeals(result.meals);
      setIdeaRound(nextRound);
      setSeenMealIds((prev) => {
        const ids = result.meals.map((m) => m.id);
        return refreshing ? [...prev, ...ids] : ids;
      });
      setStep(2);
    } catch (err) {
      setMealsError(err instanceof Error ? err.message : "Could not suggest meals.");
    } finally {
      setMealsLoading(false);
    }
  }

  function pickMeal(meal: MealSuggestion) {
    setPicked(meal);
    setRecipe(null);
    setPantry(meal.staplesToAsk.map((staple) => ({ staple, have: null })));
  }

  function answerPantry(staple: string, have: boolean) {
    setPantry((prev) =>
      prev.map((p) => (p.staple === staple ? { ...p, have } : p)),
    );
  }

  async function generateRecipe() {
    if (!picked || !pantryReady) return;
    setRecipeLoading(true);
    setRecipeError(null);
    try {
      const result = await postJson<{ recipe: Recipe }>("/api/recipe", {
          mealId: picked.id,
          mealName: picked.name,
          mealType,
          diet,
          cuisine: picked.cuisine,
          inventory,
          pantry,
          variant: ideaRound,
        });
      setRecipe(result.recipe);
      setStep(3);
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "Recipe failed.");
    } finally {
      setRecipeLoading(false);
    }
  }

  const dietCaption = useMemo(() => DIET_HINTS[diet], [diet]);

  return (
    <div className="flex flex-col gap-5">
      <ProgressSteps step={step} />

      {step === 0 ? (
        <section className="flex flex-col gap-4">
          <PhotoUploader photos={photos} onChange={setPhotos} />
          {visionReady === false ? (
            <p className="rounded-2xl bg-lemon/40 px-3 py-2 text-sm">
              Photos are saved on this device, but this preview can&apos;t identify
              fridge contents yet. Use <span className="font-medium">Sample kitchen</span> or
              type what you have — cooking and planning still work.
            </p>
          ) : null}
          {scanNotice ? (
            <p className="rounded-2xl bg-lemon/40 px-3 py-2 text-sm">{scanNotice}</p>
          ) : null}
          {scanError ? <ErrorRetry message={scanError} onRetry={() => void scan()} /> : null}
          {scanning ? <LoadingNote>Looking through every photo…</LoadingNote> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-full"
              disabled={scanning || !photos.length}
              onClick={() => void scan()}
            >
              Identify what I own
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setStep(1)}
            >
              Type items instead
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                onInventory(
                  dedupeNames([
                    ...inventory,
                    "tomatoes",
                    "onion",
                    "garlic",
                    "spinach",
                    "yogurt",
                    "chickpeas",
                    "cooked rice",
                    "lemon",
                    "potatoes",
                    "bread",
                    "cheddar",
                    "carrots",
                    "cucumber",
                  ]),
                );
                setScanNotice(
                  "Loaded a sample eggless-veg kitchen so you can try the flow without photos. Edit freely.",
                );
                setStep(1);
              }}
            >
              Sample kitchen
            </Button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-2xl">Is this your kitchen?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Remove anything I invented. Add pasta, spices, freezer bags — the
              camera can&apos;t see inside cupboards.
            </p>
          </div>
          {scanNotice ? (
            <p className="rounded-2xl bg-lemon/40 px-3 py-2 text-sm">{scanNotice}</p>
          ) : null}
          <InventoryChips
            items={inventory}
            onRemove={(item) => onInventory(inventory.filter((i) => i !== item))}
          />
          <div className="flex gap-2">
            <Input
              value={addValue}
              placeholder="Add a missed item"
              className="h-10 rounded-full bg-card px-4"
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManual();
                }
              }}
            />
            <Button type="button" className="rounded-full" onClick={addManual}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setStep(0)}
            >
              Back to photos
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!inventory.length}
              onClick={() => setStep(2)}
            >
              What can I cook?
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-2xl">What&apos;s the craving?</h2>
            <p className="mt-1 text-sm text-muted-foreground">{MEAL_TYPE_HINTS[mealType]}</p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Meal
            </legend>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    mealType === type
                      ? "bg-leaf text-primary-foreground"
                      : "bg-card ring-1 ring-border"
                  }`}
                  onClick={() => {
                    setMealType(type);
                    setMeals(null);
                    setPicked(null);
                    setPantry([]);
                    setRecipe(null);
                    setIdeaRound(0);
                    setSeenMealIds([]);
                  }}
                >
                  {type === "snack" ? "⚡ " : type === "lunchbox" ? "🎒 " : ""}
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Diet
            </legend>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    diet === d
                      ? "bg-ink text-paper"
                      : "bg-card ring-1 ring-border"
                  }`}
                  onClick={() => {
                    setDiet(d);
                    setMeals(null);
                    setIdeaRound(0);
                    setSeenMealIds([]);
                  }}
                >
                  {DIET_LABELS[d]}
                  {d === "eggless_veg" ? " · default" : ""}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{dietCaption}</p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Cuisine
            </legend>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    cuisine === c
                      ? "bg-lemon text-ink"
                      : "bg-card ring-1 ring-border"
                  }`}
                  onClick={() => {
                    setCuisine(c);
                    setMeals(null);
                    setIdeaRound(0);
                    setSeenMealIds([]);
                  }}
                >
                  {CUISINE_EMOJI[c]} {c}
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            type="button"
            className="w-fit rounded-full"
            disabled={!inventory.length || mealsLoading}
            onClick={() => void generateMeals()}
          >
            {meals ? "Refresh ideas" : "Give me 6 ideas"}
          </Button>
          {!inventory.length ? (
            <p className="text-sm text-tomato">Add at least one item on Review first.</p>
          ) : null}
          {mealsLoading ? <LoadingNote>Tasting the kitchen in my head…</LoadingNote> : null}
          {mealsError ? (
            <ErrorRetry message={mealsError} onRetry={() => void generateMeals()} />
          ) : null}

          {meals?.length ? (
            <div className="grid gap-3">
              {meals.map((meal) => (
                <Card
                  key={meal.id}
                  className={`card-lift cursor-pointer rounded-3xl py-4 ${
                    picked?.id === meal.id ? "ring-2 ring-leaf" : ""
                  }`}
                  onClick={() => pickMeal(meal)}
                >
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-lg leading-tight">{meal.name}</h3>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {meal.timeMin} min
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meal.description}</p>
                    <p className="text-xs">
                      <span className="font-medium">From your kitchen: </span>
                      {meal.usesFromInventory.length
                        ? meal.usesFromInventory.join(", ")
                        : "stretching what you have"}
                    </p>
                    {meal.staplesToAsk.length ? (
                      <p className="text-xs text-muted-foreground">
                        I&apos;ll ask about: {meal.staplesToAsk.join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-leaf">Looks like you already have the staples.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {picked ? (
            <div className="rounded-3xl border border-border bg-card p-4">
              <h3 className="font-heading text-xl">Do you have these?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A camera can&apos;t see the pasta box or the garam masala. Answer every
                line — then I&apos;ll write the recipe around the truth.
              </p>
              {picked.staplesToAsk.length === 0 ? (
                <p className="mt-3 text-sm">No pantry quiz for this one. You&apos;re clear to cook.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {pantry.map((row) => (
                    <li
                      key={row.staple}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper px-3 py-2"
                    >
                      <span className="text-sm font-medium">{row.staple}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-sm ${
                            row.have === true ? "bg-leaf text-primary-foreground" : "ring-1 ring-border"
                          }`}
                          onClick={() => answerPantry(row.staple, true)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-sm ${
                            row.have === false ? "bg-tomato text-paper" : "ring-1 ring-border"
                          }`}
                          onClick={() => answerPantry(row.staple, false)}
                        >
                          No
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {recipeError ? (
                <div className="mt-3">
                  <ErrorRetry message={recipeError} onRetry={() => void generateRecipe()} />
                </div>
              ) : null}
              {recipeLoading ? (
                <div className="mt-3">
                  <LoadingNote>Writing a recipe that matches what you actually have…</LoadingNote>
                </div>
              ) : null}
              <Button
                type="button"
                className="mt-4 rounded-full"
                disabled={!pantryReady || recipeLoading}
                onClick={() => void generateRecipe()}
              >
                Write the recipe
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 3 && recipe ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {MEAL_TYPE_LABELS[recipe.mealType]} · {recipe.cuisine}
              </p>
              <h2 className="font-heading text-3xl leading-tight">{recipe.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Serves {recipe.serves} · {recipe.timeMin} min
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              aria-label="Start over"
              onClick={() => {
                setStep(0);
                setMeals(null);
                setPicked(null);
                setRecipe(null);
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>

          <div>
            <h3 className="font-heading text-lg">Ingredients</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {recipe.ingredients.map((line) => (
                <li key={line} className="rounded-2xl bg-card px-3 py-2 text-sm ring-1 ring-border">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg">Steps</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {recipe.steps.map((line, i) => (
                <li key={line} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lemon text-xs font-medium">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
          {recipe.notes ? (
            <div className="rounded-3xl bg-secondary px-4 py-3 text-sm">
              <p className="font-medium">Notes</p>
              <p className="mt-1 text-muted-foreground">{recipe.notes}</p>
            </div>
          ) : null}

          <Button
            type="button"
            className="w-fit rounded-full bg-tomato text-paper hover:bg-tomato/90"
            disabled={alreadySaved}
            onClick={() =>
              onSave({
                ...recipe,
                savedAt: new Date().toISOString(),
              })
            }
          >
            <Heart className="size-4 fill-current" />
            {alreadySaved ? "Saved" : "Save this recipe"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-fit rounded-full"
            onClick={() => {
              setStep(2);
              setRecipe(null);
            }}
          >
            Pick a different meal
          </Button>
        </section>
      ) : null}
    </div>
  );
}
