"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Snap", "Review", "Meals", "Recipe"] as const;

export function ProgressSteps({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Cook flow progress">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-full rounded-full",
                done && "bg-leaf",
                active && "bg-lemon",
                !done && !active && "bg-border",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-medium",
                active ? "text-ink" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
