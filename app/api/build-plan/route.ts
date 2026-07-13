import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { statement, savedItems } = await req.json();
    const goalItems = Array.isArray(savedItems?.goal) ? savedItems.goal.filter((item: unknown) => typeof item === "string" && item.trim()) : [];
    const strategyItems = Array.isArray(savedItems?.strategies) ? savedItems.strategies.filter((item: unknown) => typeof item === "string" && item.trim()) : [];
    const actionItems = Array.isArray(savedItems?.actions) ? savedItems.actions.filter((item: unknown) => typeof item === "string" && item.trim()) : [];
    const kpiItems = Array.isArray(savedItems?.kpis) ? savedItems.kpis.filter((item: unknown) => typeof item === "string" && item.trim()) : [];

    const savedCount = goalItems.length + strategyItems.length + actionItems.length + kpiItems.length;
    if (savedCount < 3) {
      return NextResponse.json({ error: "Add at least 3 saved workplan items before building." }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a strategic planning architect. Build a fully aligned workplan with strict category separation between Goal, Strategy, Tactic/Action, and KPI/Metric. Use the saved workplan items as the primary source of direction. Preserve them when they are clear and correctly categorized. Fill gaps only where needed. Build a coherent, aligned workplan from the selected Goal, Strategy, Action, and KPI items. Do not generate a generic plan if saved items are provided.\n\nGOAL: desired future end state; outcome only; describes what success looks like; no actions, no tactics, no implementation details, no timelines, no percentages, no numbers.\nSTRATEGY: high-level approach to achieve the goal; describes how the organization will win; directional and method-oriented; not a specific task, project, or checklist item.\nTACTIC/ACTION: concrete, operational initiative a team can execute; specific and assignable; action-oriented.\nKPI/METRIC: measurable indicator of progress or success; numeric or quantifiable; not a sentence about action or approach.\n\nStrict enforcement rules:\n1) If it contains a number, percentage, threshold, or measurable target -> KPI.\n2) If it starts with or clearly implies a concrete execution activity -> Tactic/Action.\n3) If it explains an approach but not a specific task -> Strategy.\n4) If it describes an outcome without explaining how -> Goal.\n\nOutput must be mutually exclusive by category so no item can be mistaken for another type.",
        },
        {
          role: "user",
          content: `Original input (optional context): ${statement || "Not provided"}\n\nSaved workplan items:\nGoal items: ${goalItems.join(" | ") || "None"}\nStrategy items: ${strategyItems.join(" | ") || "None"}\nAction items: ${actionItems.join(" | ") || "None"}\nKPI items: ${kpiItems.join(" | ") || "None"}\n\nReturn ONLY JSON with keys goal (string), objectives (2-3), strategies (2-3), tactics (4-6), kpis (4-6).\n\nPreserve user-selected saved items where they are clear and aligned. Fill missing levels with aligned suggestions only as needed.`
        }
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
