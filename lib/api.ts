export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: string }).error)
        : "Something went wrong in the kitchen. Try again?";
    const code =
      data && typeof data === "object" && "code" in data
        ? String((data as { code: string }).code)
        : undefined;
    throw new ApiError(err, code);
  }
  return data as T;
}
