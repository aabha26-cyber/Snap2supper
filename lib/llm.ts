import { parseAiJson } from "./parse-json";

export function keyFromRequest(): string | undefined {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    undefined
  );
}

export function visionConfigured(): boolean {
  return Boolean(keyFromRequest());
}

function isGeminiKey(key: string): boolean {
  return key.startsWith("AIza");
}

export async function completeJson<T>(input: {
  key?: string;
  system: string;
  user: string;
  images?: string[];
  temperature?: number;
}): Promise<T> {
  const key = input.key?.trim();
  if (!key) throw new Error("NO_KEY");

  if (isGeminiKey(key)) {
    return completeGemini<T>(key, input);
  }
  return completeOpenAI<T>(key, input);
}

async function completeOpenAI<T>(
  key: string,
  input: {
    system: string;
    user: string;
    images?: string[];
    temperature?: number;
  },
): Promise<T> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: input.user }];

  for (const url of input.images ?? []) {
    userContent.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw new Error("That API key was rejected. Check it and try again.");
    }
    throw new Error(
      `The kitchen brain failed (${res.status}): ${text.slice(0, 220)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response.");
  return parseAiJson<T>(content);
}

async function completeGemini<T>(
  key: string,
  input: {
    system: string;
    user: string;
    images?: string[];
    temperature?: number;
  },
): Promise<T> {
  const parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [{ text: `${input.system}\n\n${input.user}` }];

  for (const url of input.images ?? []) {
    const match = url.match(/^data:(.+);base64,(.+)$/);
    if (!match) continue;
    parts.push({
      inline_data: { mime_type: match[1]!, data: match[2]! },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: input.temperature ?? 0.4,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 400 && /API_KEY/i.test(text)) {
      throw new Error("That API key was rejected. Check it and try again.");
    }
    throw new Error(
      `The kitchen brain failed (${res.status}): ${text.slice(0, 220)}`,
    );
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("\n");
  if (!content) throw new Error("Empty model response.");
  return parseAiJson<T>(content);
}
