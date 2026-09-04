export function parseAiJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The kitchen brain returned something that was not JSON.");
  }
  return JSON.parse(unfenced.slice(start, end + 1)) as T;
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const n = normalizeName(name);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function inventoryHas(inventory: string[], keyword: string): boolean {
  const k = normalizeName(keyword);
  if (!k) return false;
  return inventory.some((item) => {
    const i = normalizeName(item);
    return i === k || i.includes(k) || k.includes(i);
  });
}

export function slugId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
