import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

const analyzeResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "classification",
    "confidence",
    "explanation",
    "missing_elements",
    "possible_confusions",
    "clarity_scores",
    "clarity_notes",
  ],
  properties: {
    classification: { type: "string" },
    confidence: { type: "string" },
    explanation: { type: "string" },
    missing_elements: { type: "string" },
    possible_confusions: { type: "string" },
    clarity_scores: {
      type: "object",
      additionalProperties: false,
      required: [
        "Specificity",
        "Measurability",
        "Time-bound clarity",
        "Actionability",
        "Strategic alignment",
      ],
      properties: {
        Specificity: { type: "string" },
        Measurability: { type: "string" },
        "Time-bound clarity": { type: "string" },
        Actionability: { type: "string" },
        "Strategic alignment": { type: "string" },
      },
    },
    clarity_notes: {
      type: "object",
      additionalProperties: false,
      required: [
        "Specificity",
        "Measurability",
        "Time-bound clarity",
        "Actionability",
        "Strategic alignment",
      ],
      properties: {
        Specificity: { type: "string" },
        Measurability: { type: "string" },
        "Time-bound clarity": { type: "string" },
        Actionability: { type: "string" },
        "Strategic alignment": { type: "string" },
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { statement } = await req.json();
    if (!statement?.trim()) return NextResponse.json({ error: "Statement is required" }, { status: 400 });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      text: {
        format: {
          type: "json_schema",
          name: "analyze_statement_response",
          schema: analyzeResponseSchema,
          strict: true,
        },
      },
      input: [
        {
          role: "system",
          content:
            "You are an expert in strategic planning. Return ONLY valid JSON that matches the provided schema exactly. Every field value must be a string, including all clarity_scores values.",
        },
        {
          role: "user",
          content:
            `Classify this statement: ${statement}\nValid classifications: Goal, Strategy, Tactic/Action, KPI/Metric, Too Vague.\nIf the statement does not clearly fit one of the first four categories, classify it as Too Vague.\nUse supportive and neutral wording. Avoid negative words like bad/wrong/weak/confused.\nReturn ONLY JSON with keys classification, confidence, explanation, missing_elements, possible_confusions, clarity_scores, clarity_notes.`,
        },
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
