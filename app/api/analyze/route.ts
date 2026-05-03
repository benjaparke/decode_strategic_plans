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
        { role: "system", content: "You are an expert in strategic planning. Classify the statement and explain clearly and neutrally." },
        { role: "user", content: `Classify this statement: ${statement}\nReturn ONLY JSON with keys classification, confidence, explanation, missing_elements, possible_confusions, clarity_scores (object with Specificity, Measurability, Time-bound clarity, Actionability, Strategic alignment scored 0-5), clarity_notes (same keys with supportive phrases). Avoid negative words like bad/wrong/weak/confused.` }
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
