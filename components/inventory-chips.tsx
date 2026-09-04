"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryChips({
  items,
  onRemove,
}: {
  items: string[];
  onRemove?: (item: string) => void;
}) {
  if (!items.length) {
    return (
      <p className="rounded-3xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nothing in the kitchen yet. Scan photos or type an item the camera missed — pasta, cumin, the frozen peas.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "chip-tilt flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm",
          )}
        >
          <span>{item}</span>
          {onRemove ? (
            <button
              type="button"
              className="rounded-full p-0.5 text-muted-foreground hover:text-tomato"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(item)}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
