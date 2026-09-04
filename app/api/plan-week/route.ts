import { NextResponse } from "next/server";
import { planLooksThin, planWeek } from "@/lib/mock";
import { completeJson, keyFromRequest } from "@/lib/llm";
import { PLAN_WEEK_SYSTEM } from "@/lib/prompts";
import { WEEKDAYS } from "@/lib/constants";
import type { DayPlan, Diet, WeekPlan } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      weekIndex?: number;
      weeksTotal?: number;
      diet?: Diet;
      cuisines?: string[];
      packableLunches?: boolean;
      inventory?: string[];
      previousDinners?: string[];
    };

    const weekIndex = body.weekIndex ?? 1;
    const weeksTotal = body.weeksTotal ?? 1;
    const diet = body.diet ?? "eggless_veg";
    const cuisines = body.cuisines?.length ? body.cuisines : ["Surprise me"];
    const packableLunches = Boolean(body.packableLunches);
    const inventory = body.inventory ?? [];
    const previousDinners = body.previousDinners ?? [];

    const key = keyFromRequest();
    if (key) {
      try {
        const result = await completeJson<{ days?: DayPlan[] }>({
          key,
          system: PLAN_WEEK_SYSTEM,
          user: JSON.stringify({
            weekIndex,
            weeksTotal,
            diet,
            cuisines,
            packableLunches,
            inventory,
            previousDinners,
          }),
        });
        const days = normalizeDays(result.days);
        if (days && !planLooksThin(days)) {
          const week: WeekPlan = {
            weekIndex,
            label: `Week ${weekIndex}`,
            days,
          };
          return NextResponse.json({ week, source: "openai" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Planning failed.";
        if (message !== "NO_KEY") {
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }
    }

    return NextResponse.json({
      week: planWeek({
        weekIndex,
        weeksTotal,
        diet,
        cuisines,
        packableLunches,
        inventory,
        previousDinners,
      }),
      source: "demo",
    });
  } catch {
    return NextResponse.json({ error: "Could not plan that week." }, { status: 400 });
  }
}

function normalizeDays(days?: DayPlan[]): DayPlan[] | null {
  if (!days?.length) return null;
  const byDay = new Map(days.map((d) => [d.day, d]));
  return WEEKDAYS.map((day, i) => {
    const row = byDay.get(day) ?? days[i];
    return {
      day,
      breakfast: row?.breakfast || "Yogurt and fruit",
      lunch: row?.lunch || "Leftover bowl",
      dinner: row?.dinner || "Simple veg stir-fry",
    };
  });
}
