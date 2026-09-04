"use client";

import { useMemo, useState } from "react";
import { ClipboardCopy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ErrorRetry, LoadingNote } from "@/components/status";
import { postJson } from "@/lib/api";
import {
  CUISINE_EMOJI,
  DIET_LABELS,
  DURATION_LABELS,
  GROCERY_CAPS,
  MEAL_TYPE_LABELS,
} from "@/lib/constants";
import { groceryToChecklist } from "@/lib/grocery";
import { cuisineMixCaption, emptyPlan } from "@/lib/mock";
import { slugId } from "@/lib/parse-json";
import type {
  Diet,
  GroceryItem,
  GroceryList,
  GrocerySection,
  MealPlan,
  PlanDuration,
  WeekPlan,
} from "@/lib/types";
import { CUISINES, DIETS, GROCERY_SECTIONS } from "@/lib/types";

export function PlanFlow({
  inventory,
  plan,
  grocery,
  onPlan,
  onGrocery,
}: {
  inventory: string[];
  plan: MealPlan | null;
  grocery: GroceryList | null;
  onPlan: (plan: MealPlan | null) => void;
  onGrocery: (list: GroceryList | null) => void;
}) {
  const [duration, setDuration] = useState<PlanDuration>(7);
  const [diet, setDiet] = useState<Diet>("eggless_veg");
  const [cuisines, setCuisines] = useState<string[]>(["Surprise me"]);
  const [packable, setPackable] = useState(true);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSection, setAddSection] = useState<GrocerySection>("Produce");
  const [copied, setCopied] = useState(false);

  const caption = useMemo(() => cuisineMixCaption(cuisines), [cuisines]);
  const cap = GROCERY_CAPS[grocery?.duration ?? duration];

  function toggleCuisine(c: string) {
    if (c === "Surprise me") {
      setCuisines(["Surprise me"]);
      return;
    }
    const withoutSurprise = cuisines.filter((x) => x !== "Surprise me");
    if (withoutSurprise.includes(c)) {
      const next = withoutSurprise.filter((x) => x !== c);
      setCuisines(next.length ? next : ["Surprise me"]);
    } else {
      setCuisines([...withoutSurprise, c]);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    const weeksTotal = duration / 7;
    const next = emptyPlan(duration, diet, cuisines, packable);
    const previousDinners: string[] = [];
    try {
      for (let w = 1; w <= weeksTotal; w++) {
        setProgress(`Planning week ${w} of ${weeksTotal}…`);
        try {
          const result = await postJson<{ week: WeekPlan }>("/api/plan-week", {
              weekIndex: w,
              weeksTotal,
              diet,
              cuisines,
              packableLunches: packable,
              inventory,
              previousDinners,
            });
          next.weeks.push(result.week);
          for (const day of result.week.days) previousDinners.push(day.dinner);
          onPlan({ ...next, weeks: [...next.weeks] });
        } catch (err) {
          setError(
            err instanceof Error
              ? `${err.message} Week ${w} failed — earlier weeks are kept.`
              : `Week ${w} failed. Earlier weeks are kept.`,
          );
          break;
        }
      }
      if (next.weeks.length) {
        const list = await postJson<{ list: GroceryList }>("/api/grocery", {
          plan: next,
          inventory,
        });
        onGrocery(list.list);
        onPlan(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish the plan.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function copyList() {
    if (!grocery) return;
    const text = groceryToChecklist(grocery);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard is blocked in this browser. Select the list and copy manually.");
    }
  }

  function updateItems(items: GroceryItem[]) {
    if (!grocery) return;
    onGrocery({ ...grocery, items });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-2xl">Plan ahead</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For the parent who cannot decide at 6pm. One week, two, or a month —
          then one short list, not a thousand-dollar cart.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How long
        </legend>
        <div className="flex flex-wrap gap-2">
          {([7, 14, 28] as PlanDuration[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${
                duration === d ? "bg-leaf text-primary-foreground" : "bg-card ring-1 ring-border"
              }`}
              onClick={() => setDuration(d)}
            >
              {DURATION_LABELS[d]}
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
                diet === d ? "bg-ink text-paper" : "bg-card ring-1 ring-border"
              }`}
              onClick={() => setDiet(d)}
            >
              {DIET_LABELS[d]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Cuisines
        </legend>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => {
            const on = cuisines.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm ${
                  on ? "bg-lemon text-ink" : "bg-card ring-1 ring-border"
                }`}
                onClick={() => toggleCuisine(c)}
              >
                {CUISINE_EMOJI[c]} {c}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </fieldset>

      <label className="flex items-start gap-3 rounded-3xl bg-card px-4 py-3 ring-1 ring-border">
        <Checkbox
          checked={packable}
          onCheckedChange={(v) => setPackable(v === true)}
          aria-label="Make lunches packable"
        />
        <span>
          <span className="block text-sm font-medium">Make lunches packable</span>
          <span className="text-xs text-muted-foreground">
            School and work lunchboxes: room-temp for hours, kid-friendly, not messy or smelly.
          </span>
        </span>
      </label>

      {!inventory.length ? (
        <p className="text-sm text-muted-foreground">
          Tip: scan your kitchen in Cook first. I can still plan without it, but the
          grocery list will be longer.
        </p>
      ) : null}

      <Button
        type="button"
        className="w-fit rounded-full"
        disabled={loading}
        onClick={() => void generate()}
      >
        Write the plan
      </Button>
      {loading && progress ? <LoadingNote>{progress}</LoadingNote> : null}
      {error ? <ErrorRetry message={error} onRetry={() => void generate()} /> : null}

      {plan?.weeks.map((week) => (
        <Card key={week.weekIndex} className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{week.label}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Day</th>
                  <th className="pb-2 font-medium">{MEAL_TYPE_LABELS.breakfast}</th>
                  <th className="pb-2 font-medium">{MEAL_TYPE_LABELS.lunch}</th>
                  <th className="pb-2 font-medium">{MEAL_TYPE_LABELS.dinner}</th>
                </tr>
              </thead>
              <tbody>
                {week.days.map((day) => (
                  <tr key={day.day} className="border-t border-border/70 align-top">
                    <td className="py-2 pr-2 font-medium">{day.day}</td>
                    <td className="py-2 pr-2">{day.breakfast}</td>
                    <td className="py-2 pr-2">{day.lunch}</td>
                    <td className="py-2">{day.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {grocery ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-heading text-xl">Grocery list</h3>
              <p className="text-sm text-muted-foreground">
                {grocery.items.length} items · cap {cap} · essentials only, salt/pepper/oil assumed at home
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void copyList()}
            >
              <ClipboardCopy className="size-4" />
              {copied ? "Copied" : "Copy for mom"}
            </Button>
          </div>

          {GROCERY_SECTIONS.map((section) => {
            const items = grocery.items.filter((i) => i.section === section);
            if (!items.length) return null;
            return (
              <div key={section}>
                <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {section}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 ring-1 ring-border"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(v) =>
                          updateItems(
                            grocery.items.map((g) =>
                              g.id === item.id ? { ...g, checked: v === true } : g,
                            ),
                          )
                        }
                        aria-label={`Bought ${item.name}`}
                      />
                      <span
                        className={`flex-1 text-sm ${item.checked ? "text-muted-foreground line-through" : ""}`}
                      >
                        {item.name}{" "}
                        <span className="text-muted-foreground">— {item.quantity}</span>
                      </span>
                      <button
                        type="button"
                        className="rounded-full p-1 text-muted-foreground hover:text-tomato"
                        aria-label={`Remove ${item.name}`}
                        onClick={() =>
                          updateItems(grocery.items.filter((g) => g.id !== item.id))
                        }
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3 sm:flex-row">
            <Input
              value={addName}
              placeholder="Add your own"
              className="h-10 rounded-full bg-card px-4"
              onChange={(e) => setAddName(e.target.value)}
            />
            <select
              className="h-10 rounded-full border border-input bg-card px-3 text-sm"
              value={addSection}
              onChange={(e) => setAddSection(e.target.value as GrocerySection)}
              aria-label="Grocery section"
            >
              {GROCERY_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                const name = addName.trim().toLowerCase();
                if (!name || !grocery) return;
                if (grocery.items.some((i) => i.name === name)) {
                  setAddName("");
                  return;
                }
                updateItems([
                  ...grocery.items,
                  {
                    id: slugId("g"),
                    name,
                    quantity: "as needed",
                    section: addSection,
                    checked: false,
                    custom: true,
                  },
                ]);
                setAddName("");
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </section>
      ) : null}

    </div>
  );
}
