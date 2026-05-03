import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { statement, intendedType } = await req.json();
    if (!statement?.trim() || !intendedType) return NextResponse.json({ error: "Statement and intendedType are required" }, { status: 400 });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Rewrite the statement as a selected type with clear structure and professional tone." },
        { role: "user", content: `Original statement: ${statement}\nRewrite as ${intendedType}. Return ONLY JSON with intended_type and suggestions (3 items with text and why_it_works). Keep concise, practical, and specific.` }
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
