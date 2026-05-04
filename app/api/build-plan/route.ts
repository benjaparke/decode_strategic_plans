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
        { role: "system", content: "Create a fully aligned workplan with goal, strategies, tactics, and KPIs that logically connect." },
        { role: "user", content: `Build from: ${statement}. Return ONLY JSON with keys goal (string), objectives (2-3), strategies (2-3), tactics (4-6), kpis (4-6). Executive, practical, non-generic language.` }
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
