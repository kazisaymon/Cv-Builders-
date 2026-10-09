import { NextResponse } from "next/server";

export const maxDuration = 30;

const PROMPTS: Record<string, (lang: string) => string> = {
  improve: () => "Rewrite the CV text to be clear, concise and achievement-focused. Keep facts unchanged, do not invent anything. Keep the same line structure (one bullet per line). Return only the rewritten text.",
  summary: () => "Write a 3-4 sentence professional CV summary from the given CV content. Do not invent facts. Return only the summary.",
  translate: (lang) => `Translate the CV text into ${lang}. Keep names, numbers, links and line breaks. Return only the translation.`,
  fix: () => "Fix spelling and grammar only, in the same language. Return only the corrected text.",
};

async function groq(system: string, text: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [{ role: "system", content: system }, { role: "user", content: text }],
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content as string;
}

async function gemini(system: string, text: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") as string;
}

export async function POST(req: Request) {
  const { task, text, lang = "English", provider = "groq" } = await req.json();
  if (!PROMPTS[task] || typeof text !== "string" || !text.trim() || text.length > 8000)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const system = PROMPTS[task](lang);
  const order = provider === "gemini" ? [gemini, groq] : [groq, gemini];
  for (const fn of order) {
    try {
      const out = await fn(system, text);
      if (out) return NextResponse.json({ text: out.trim() });
    } catch {
      /* try the next provider */
    }
  }
  return NextResponse.json({ error: "AI is unavailable. Check your API keys." }, { status: 502 });
}
