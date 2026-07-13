import { NextRequest, NextResponse } from "next/server";
import { assertApiKey, openai } from "@/lib/openai";
import { parseJsonObject } from "@/lib/json";

const analyzeResponseSchemaProperties = {
  classification: { type: "string" },
  clarity_type: { type: "string" },
  confidence: { type: "string" },
  explanation: { type: "string" },
  insight: { type: "string" },
  missing_elements: { type: "string" },
  possible_confusions: { type: "string" },
  clarity_scores: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: { type: "string" },
  },
  clarity_notes: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: { type: "string" },
  },
} as const;

const analyzeResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: analyzeResponseSchemaProperties,
  required: Object.keys(analyzeResponseSchemaProperties),
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
            `Analyze this statement: ${statement}

Step 1: Determine classification first using one of:
- Goal
- Strategy
- Tactic/Action
- KPI/Metric
- Too Vague

If the statement does not clearly fit Goal, Strategy, Tactic/Action, or KPI/Metric, classify it as Too Vague.

Step 2: Set clarity_type from the detected classification using exactly one of:
- Goal
- Strategy
- Action
- KPI

Map Tactic/Action to Action.
Map KPI/Metric to KPI.
If classification is Too Vague, choose the closest likely type and set clarity_type accordingly.

Step 3: Create type-specific clarity_scores and clarity_notes.
Use only these criteria for each type:

GOAL:
- Outcome clarity
- Directional strength
- Scope clarity
- Strategic relevance
Do NOT evaluate tactics, execution steps, or detailed metrics.

STRATEGY:
- Approach clarity
- Alignment to outcome
- Focus
- Distinctiveness

ACTION:
- Specificity
- Executability
- Clarity of outcome
- Scope

KPI:
- Measurability
- Clarity
- Relevance
- Trackability

Scoring rules:
- clarity_scores values must be strings representing 0-5 numbers.
- clarity_notes values must be short, supportive, context-aware coaching notes.
- Tone must be supportive and neutral.
- Do not imply something is missing when it is not appropriate for that type.

Return ONLY JSON with keys classification, clarity_type, confidence, explanation, insight, missing_elements, possible_confusions, clarity_scores, clarity_notes.`,
        },
      ],
    });

    return NextResponse.json(parseJsonObject(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
