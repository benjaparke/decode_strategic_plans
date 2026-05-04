import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

const allowedIntendedTypes = ["Goal", "Strategy", "Tactic/Action", "KPI/Metric", "Too Vague"] as const;

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { statement, intendedType } = await req.json();
    if (!statement?.trim() || !intendedType) return NextResponse.json({ error: "Statement and intendedType are required" }, { status: 400 });
    if (!allowedIntendedTypes.includes(intendedType)) return NextResponse.json({ error: "Invalid intendedType" }, { status: 400 });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a strategic planning editor. Write executive-grade rewrites that are decisive, concrete, and practical. Avoid generic AI phrasing, filler, and buzzwords. Prefer clear verbs and explicit outcomes. Do not use vague terms like 'enhance', 'leverage', or 'improve' unless tied to a specific concrete action or result.",
        },
        {
          role: "user",
          content: `Original statement: ${statement}\nRewrite as ${intendedType}. Valid types: Goal, Strategy, Tactic/Action, KPI/Metric, Too Vague. If intendedType is Too Vague, rewrite suggestions should clarify the statement into one of the other concrete planning types and set intended_type to that clarified type. Return ONLY JSON with this exact shape: { "intended_type": "...", "suggestions": [{ "text": "...", "why_it_works": "..." }, { "text": "...", "why_it_works": "..." }, { "text": "...", "why_it_works": "..." }] }.\n\nRequirements:\n- Provide exactly 3 suggestions.\n- Suggestion 1: conservative and realistic.\n- Suggestion 2: moderately ambitious.\n- Suggestion 3: bold/aspirational but structured.\n- Each suggestion text must start with a strong action or outcome statement.\n- Add light specificity by including a metric, timeframe, or scope when appropriate.\n- Keep tone executive, direct, and practical (VP-ready).\n- Avoid fluff, filler, and generic wording.\n- why_it_works must be exactly 1 concise sentence focused on structure (clarity, measurability, alignment).`,
        },
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
