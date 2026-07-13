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
            "You are a strategic planning editor. Rewrite statements with strict category separation across Goal, Strategy, Tactic/Action, and KPI/Metric.\n\nDefinitions:\n- GOAL: desired future state/end result; outcome-only; what success looks like; no actions, no tactics, no implementation details, no timelines, no percentages, no numbers.\n- STRATEGY: high-level approach/method to achieve the goal; describes how the organization will succeed; directional; not a specific task/project.\n- TACTIC/ACTION: concrete activity or initiative; specific, operational, assignable, executable by a team.\n- KPI/METRIC: measurable indicator of progress/success; numeric or quantifiable; not action or approach prose.\n\nStrict enforcement rules:\n1) If it contains a number, percentage, threshold, or measurable target -> KPI/METRIC.\n2) If it starts with or implies a concrete execution activity -> TACTIC/ACTION.\n3) If it describes an approach but not a specific task -> STRATEGY.\n4) If it describes an outcome without how -> GOAL.\n\nOutput must be unambiguous so each rewrite clearly fits only one category.",
        },
        {
          role: "user",
          content: `Original statement: ${statement}\nRewrite as ${intendedType}. Valid types: Goal, Strategy, Tactic/Action, KPI/Metric, Too Vague. If intendedType is Too Vague, rewrite suggestions should clarify the statement into one concrete planning type and set intended_type to that clarified type. Return ONLY JSON with this exact shape: { "intended_type": "...", "suggestions": [{ "text": "...", "why_it_works": "..." }, { "text": "...", "why_it_works": "..." }, { "text": "...", "why_it_works": "..." }] }.\n\nCategory-specific rewrite rules:\n- Goal: outcome only; no "how"; no execution verbs; no numeric targets.\n- Strategy: "how we approach" framing; high-level directional method; no step-by-step actions.\n- Tactic/Action: explicit concrete action statement; operational and assignable.\n- KPI/Metric: numeric, measurable, trackable indicator only.\n\nRequirements:\n- Provide exactly 3 suggestions.\n- Suggestion 1: conservative and realistic.\n- Suggestion 2: moderately ambitious.\n- Suggestion 3: bold/aspirational but structured.\n- Ensure every suggestion strictly matches intended_type and cannot be mistaken for another category.\n- For Goal suggestions, start with an outcome statement (not an action).\n- For Strategy suggestions, start with an approach statement.\n- For Tactic/Action suggestions, start with a concrete execution verb.\n- For KPI/Metric suggestions, include explicit quantifiable measurement.\n- Keep tone executive, direct, and practical (VP-ready).\n- Avoid fluff, filler, and generic wording.\n- why_it_works must be exactly 1 concise sentence focused on structure (clarity, measurability, alignment).`,
        },
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
