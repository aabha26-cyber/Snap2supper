"use client";

import { useState } from "react";
import { ChevronDown, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import type { SavedRecipe } from "@/lib/types";

export function SavedView({
  saved,
  onDelete,
}: {
  saved: SavedRecipe[];
  onDelete: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(saved[0]?.id ?? null);

  if (!saved.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
        <Heart className="mx-auto size-8 text-tomato" />
        <h2 className="font-heading mt-3 text-2xl">No keepers yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          When a recipe makes the table go quiet in a good way, tap the heart.
          It stays here even after you close the app.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-heading text-2xl">Recipes you love</h2>
        <p className="text-sm text-muted-foreground">{saved.length} saved</p>
      </div>
      {saved.map((recipe) => {
        const open = openId === recipe.id;
        return (
          <Card key={recipe.id} className="rounded-3xl py-0">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
              onClick={() => setOpenId(open ? null : recipe.id)}
              aria-expanded={open}
            >
              <div className="flex-1">
                <p className="font-heading text-lg leading-tight">{recipe.name}</p>
                <p className="text-xs text-muted-foreground">
                  {MEAL_TYPE_LABELS[recipe.mealType]} · {recipe.cuisine} · {recipe.timeMin} min ·{" "}
                  {new Date(recipe.savedAt).toLocaleDateString()}
                </p>
              </div>
              <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open ? (
              <CardContent className="flex flex-col gap-3 pb-4">
                <ul className="text-sm">
                  {recipe.ingredients.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                <ol className="list-decimal pl-4 text-sm">
                  {recipe.steps.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                {recipe.notes ? (
                  <p className="rounded-2xl bg-secondary px-3 py-2 text-sm">{recipe.notes}</p>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  className="w-fit rounded-full"
                  onClick={() => onDelete(recipe.id)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
