import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { statement } = await req.json();
    if (!statement?.trim()) return NextResponse.json({ error: "Statement is required" }, { status: 400 });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a strategic planning architect. Build a fully aligned workplan with strict category separation between Goal, Strategy, Tactic/Action, and KPI/Metric. Enforce these definitions and never blur categories.\n\nGOAL: desired future end state; outcome only; describes what success looks like; no actions, no tactics, no implementation details, no timelines, no percentages, no numbers.\nSTRATEGY: high-level approach to achieve the goal; describes how the organization will win; directional and method-oriented; not a specific task, project, or checklist item.\nTACTIC/ACTION: concrete, operational initiative a team can execute; specific and assignable; action-oriented.\nKPI/METRIC: measurable indicator of progress or success; numeric or quantifiable; not a sentence about action or approach.\n\nStrict enforcement rules:\n1) If it contains a number, percentage, threshold, or measurable target -> KPI.\n2) If it starts with or clearly implies a concrete execution activity -> Tactic/Action.\n3) If it explains an approach but not a specific task -> Strategy.\n4) If it describes an outcome without explaining how -> Goal.\n\nOutput must be mutually exclusive by category so no item can be mistaken for another type.",
        },
        {
          role: "user",
          content:
            `Build from: ${statement}. Return ONLY JSON with keys goal (string), objectives (2-3), strategies (2-3), tactics (4-6), kpis (4-6).\n\nCategory requirements:\n- goal: exactly one outcome-only statement, no \"how\", no execution verbs, no numbers.\n- objectives: outcome-focused sub-goals aligned to the main goal; no execution steps.\n- strategies: \"how we approach\" statements at high level; no step-by-step actions.\n- tactics: clear, concrete, assignable actions that teams can execute.\n- kpis: numeric, measurable, trackable indicators.\n\nUse executive, practical, non-generic language.`,
        }
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
