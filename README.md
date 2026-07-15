# Strategic Clarity: Decode Strategic Plans

> **s-t-r-a-t-e-g-y...** an app to help users understand the difference between a goal, strategy, objective, tactic, KPI, and that weird vague thing your boss said in the meeting.

Supports intentional thinking and brings clarity to the work plan process. *(Because some folks can't even spell strategic.)*

---

## The Problem We're Solving

You know that meeting where someone says something like:

> _"We need to leverage synergies to increase market penetration by being more strategic about our approach."_

And everyone nods while internally asking themselves: *"Did they just say anything?"*

Or your strategic plan reads like this:
- Goal: "Increase seller engagement"
- Strategy: "Sell more stuff"  
- Tactic: "Be better at sales"
- KPI: "Success metrics"

Yeah. **This app fixes that.**

## What It Does

**Strategic Clarity** is a web app that uses OpenAI's GPT-4 to transform vague planning statements into structured, actionable work plans. It helps you:

1. **Analyze** any planning statement and classify it (Goal? Strategy? Tactic? KPI? Or just vibes?)
2. **Rewrite** statements to match their intended purpose with crystal-clear language
3. **Build** complete workplans from curated pieces
4. **Export** your entire strategic clarity effort as a downloadable .txt file (very web1.0 of us, but it works)

### The Three-Move Combo:

1. **Analyze Phase** → AI breaks down what you said and what you probably *meant*
2. **Rewrite Phase** → AI suggests better versions tailored to the statement's actual purpose
3. **Build Phase** → Combine multiple curated pieces into a coherent workplan (minimum 3 items to prevent chaos)

---

## How It's Organized

```
app/
  layout.tsx             Root layout with metadata and Vercel Analytics
  page.tsx               Main client-side component (the whole app is here, no page bloat!)
  globals.css            Base Tailwind styles
  api/
    analyze/route.ts     Analyzes statements, classifies type, scores clarity
    rewrite/route.ts     Rewrites a statement for a specific purpose
    build-plan/route.ts  Builds a full workplan from saved items
lib/
  openai.ts              OpenAI SDK setup with API key assertion
  json.ts                Safe JSON parsing from LLM responses
```

### How It Fits Together

The entire app lives in a **single React component** (`app/page.tsx`) that manages five distinct state machines:

1. **Input & Analysis** → User pastes or picks a sample statement → hits "Analyze" → calls `/api/analyze`
2. **Intent Selection & Rewrite** → User specifies what they *meant* → hits "Rewrite" → calls `/api/rewrite`
3. **Workplan Building** → User collects ≥3 curated pieces → hits "Build Plan" → calls `/api/build-plan`
4. **Local Workplan Staging** → Items are saved to component state, grouped by type (Goal/Strategy/Action/KPI)
5. **Export** → User downloads the full strategic clarity export as a .txt file

Each API route uses **OpenAI's structured JSON output** (via `gpt-4.1-mini`) to ensure type-safe responses. The UI is built with **Tailwind CSS** and includes a delightful (and borderline judgmental) UX.

---

## How to Run It

### Prerequisites
- Node.js 18+
- An OpenAI API key with access to `gpt-4.1-mini`

### Development
```bash
# Clone it
git clone https://github.com/benjaparke/decode_strategic_plans.git
cd decode_strategic_plans

# Install dependencies
npm install

# Set up environment
echo "OPENAI_API_KEY=your-key-here" > .env.local

# Run dev server
npm run dev

# Visit http://localhost:3000
```

### Production
```bash
# Build
npm run build

# Start
npm start

# Lint
npm lint
```

### Environment Variables
- **`OPENAI_API_KEY`** (required) — Your OpenAI API key. The app will explode without this. Not literally, but philosophically.

---

## Tech Stack

- **Language:** TypeScript
- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS + PostCSS
- **LLM:** OpenAI API (gpt-4.1-mini)
- **Deployment:** Vercel (with built-in analytics)
- **Dev Tools:** ESLint, TypeScript strict mode

---

## Key Features

### Statement Analysis
- Classifies statements into: Goal, Strategy, Tactic/Action, KPI/Metric, or Too Vague
- Provides type-specific clarity scoring (0–5 scale)
- Identifies missing elements and possible confusions
- Includes supportive, coaching-style feedback notes

### Intelligent Rewriting
- Rewrites statements for their intended purpose
- Provides 3+ alternative phrasings
- Explains *why* each rewrite works
- Detects what the user probably meant and corrects it

### Workplan Building
- Combines multiple curated pieces into a coherent full workplan
- Ensures alignment between goals, strategies, tactics, and KPIs
- Requires at least 3 saved items (prevents "strategic plans" with 1 item)
- Generates balanced workplans with all four pillars

### Export Magic
- Download entire clarity session as a clean .txt file
- Includes analysis, rewrite suggestions, and final workplan
- Great for sharing with stakeholders or your confused team

### Sample Statements
Pre-loaded examples to get started:
- _"Become the #1 seller in our industry"_
- _"Leverage marketing data to better target ages 25–35"_
- _"Increase donor engagement by 20% by Q4"_
- _"Launch quarterly manager training"_
- _"Improve internal communication"_

---

## The AI Prompting Strategy

Each API endpoint uses **structured JSON schemas** with OpenAI's `gpt-4.1-mini`:

### `/api/analyze`
- Enforces strict field types (strings, objects with additionalProperties)
- Asks GPT to classify, score clarity, and note missing elements
- Returns: `classification`, `clarity_type`, `confidence`, `explanation`, `missing_elements`, `possible_confusions`, `clarity_scores`, `clarity_notes`

### `/api/rewrite`
- Provides clear definitions of Goal, Strategy, Tactic/Action, and KPI/Metric
- Asks for 3+ rewrite suggestions with explanations
- Returns: `intended_type`, `suggestions` (array with `text` and `why_it_works`)

### `/api/build-plan`
- Takes saved items grouped by type (goal, strategies, actions, kpis)
- Builds a fully aligned workplan that ties them together
- Returns: `goal`, `objectives`, `strategies`, `tactics`, `kpis`

All responses are validated using `parseJsonObject()` which safely extracts JSON from the model output.

---

## UI Highlights

- **Blue & Amber Color Scheme** — Strategic clarity, with a dash of warmth
- **Rounded Cards & Shadow Effects** — Executive, but approachable
- **Responsive Grid Layout** — Works on desktop and tablet
- **Real-time State Management** — All state lives in React, no backend persistence
- **Copy-to-Clipboard & Download** — Export your clarity, take it with you
- **Clear Sectioning** — Input → Analysis → Rewrite → Workplan → Export (or skip steps as needed)

---

## Development Notes

### Type Safety
- Full TypeScript strict mode
- Type guards for API responses (`isString`, `isSuggestion`, `toSafeArray`)
- Schema validation on both client and server

### Error Handling
- API errors are caught and displayed to the user (no silent failures)
- Missing API keys blow up at request time with a clear message
- Invalid JSON from the model is caught by `parseJsonObject()`

### State Management Pattern
```typescript
const [statement, setStatement] = useState("");
const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
const [rewrite, setRewrite] = useState<RewriteResponse | null>(null);
const [plan, setPlan] = useState<PlanResponse | null>(null);
const [savedWorkplanItems, setSavedWorkplanItems] = useState<SavedWorkplanItem[]>([]);
const [loading, setLoading] = useState<"analyze" | "rewrite" | "plan" | null>(null);
const [error, setError] = useState<string | null>(null);
```

Each operation sets `loading` to its type, preventing concurrent requests and enabling loading states.

---

## Live Demo

Check it out: **[decode-strategic-plans-beta.vercel.app](https://decode-strategic-plans-beta.vercel.app)**

---

## Contributing

This is a single-developer passion project, but if you find bugs or have ideas:
1. Open an issue
2. Describe what went wrong or what could be better
3. Include sample statements if it's a classification bug

---

## License

No license specified. Do what you want, but maybe don't claim you invented strategic planning. (That honor belongs to Sun Tzu, and also maybe confused board members.)

---

## Inspiration

Built by someone who sat through too many meetings where people confused "goals," "strategies," and "tactics," and decided the best response was to build an AI that fixes vague planning language instead of just nodding politely.

---

**Happy Planning! **

*May your strategies be clear, your tactics executable, and your KPIs measurable.*
