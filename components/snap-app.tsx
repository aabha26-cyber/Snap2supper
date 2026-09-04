"use client";

import { useEffect, useState } from "react";
import { BookHeart, CookingPot, CalendarDays } from "lucide-react";
import { CookFlow } from "@/components/cook-flow";
import { PlanFlow } from "@/components/plan-flow";
import { SavedView } from "@/components/saved-view";
import { STORAGE_KEYS } from "@/lib/constants";
import { readStore, writeStore } from "@/lib/storage";
import type { GroceryList, MealPlan, SavedRecipe } from "@/lib/types";

type Tab = "cook" | "plan" | "saved";

export function SnapApp() {
  const [tab, setTab] = useState<Tab>("cook");
  const [inventory, setInventory] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [grocery, setGrocery] = useState<GroceryList | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage after mount so SSR/first paint stay empty.
    /* eslint-disable react-hooks/set-state-in-effect */
    setInventory(readStore<string[]>(STORAGE_KEYS.inventory, []));
    setSaved(readStore<SavedRecipe[]>(STORAGE_KEYS.saved, []));
    setPlan(readStore<MealPlan | null>(STORAGE_KEYS.plan, null));
    setGrocery(readStore<GroceryList | null>(STORAGE_KEYS.grocery, null));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(STORAGE_KEYS.inventory, inventory);
  }, [inventory, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(STORAGE_KEYS.saved, saved);
  }, [saved, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(STORAGE_KEYS.plan, plan);
  }, [plan, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(STORAGE_KEYS.grocery, grocery);
  }, [grocery, hydrated]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[680px] flex-col px-4 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-[1.85rem] leading-none tracking-tight">
            Snap<span className="text-leaf">2</span>Supper
          </h1>
          <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
            Photograph what you own. Never wonder what&apos;s for dinner again.
          </p>
        </div>
        <span className="mt-1 rotate-12 rounded-full bg-lemon px-3 py-1 text-xs font-medium text-ink shadow-sm">
          dinner, solved
        </span>
      </header>

      {tab === "cook" ? (
        <CookFlow
          inventory={inventory}
          onInventory={setInventory}
          saved={saved}
          onSave={(recipe) => setSaved([recipe, ...saved.filter((s) => s.id !== recipe.id)])}
        />
      ) : null}
      {tab === "plan" ? (
        <PlanFlow
          inventory={inventory}
          plan={plan}
          grocery={grocery}
          onPlan={setPlan}
          onGrocery={setGrocery}
        />
      ) : null}
      {tab === "saved" ? (
        <SavedView
          saved={saved}
          onDelete={(id) => setSaved(saved.filter((s) => s.id !== id))}
        />
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-paper/95 backdrop-blur"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-[680px] grid-cols-3 px-2 py-2">
          <TabButton
            active={tab === "cook"}
            onClick={() => setTab("cook")}
            icon={<CookingPot className="size-4" />}
            label="Cook now"
          />
          <TabButton
            active={tab === "plan"}
            onClick={() => setTab("plan")}
            icon={<CalendarDays className="size-4" />}
            label="Plan ahead"
          />
          <TabButton
            active={tab === "saved"}
            onClick={() => setTab("saved")}
            icon={<BookHeart className="size-4" />}
            label="Saved"
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium ${
        active ? "bg-leaf/12 text-leaf" : "text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
