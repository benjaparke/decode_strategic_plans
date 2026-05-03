"use client";

import { useMemo, useState } from "react";

type AnalyzeResponse = {
  classification: string;
  confidence: string;
  explanation: string;
  missing_elements: string[];
  possible_confusions: string[];
  clarity_scores?: Record<string, string | number | null | undefined>;
  clarity_notes?: Record<string, string>;
};

type RewriteResponse = {
  intended_type: string;
  suggestions: { text: string; why_it_works: string }[];
};

type PlanResponse = {
  goal: string;
  objectives: string[];
  strategies: string[];
  tactics: string[];
  kpis: string[];
};

const samples = [
  "Become the #1 seller in our industry",
  "Leverage marketing data to better target ages 25–35",
  "Increase donor engagement by 20% by Q4",
  "Launch quarterly manager training",
  "Improve internal communication",
];

const intentOptions = ["Goal", "Objective", "Strategy", "Tactic/Action", "Measurable Outcome", "KPI/Metric"];

function toSafeArray<T>(value: unknown, isItem: (item: unknown) => item is T): T[] {
  if (Array.isArray(value)) return value.filter(isItem);
  if (isItem(value)) return [value];
  return [];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSuggestion(value: unknown): value is { text: string; why_it_works: string } {
  if (!value || typeof value !== "object") return false;
  const suggestion = value as { text?: unknown; why_it_works?: unknown };
  return typeof suggestion.text === "string" && typeof suggestion.why_it_works === "string";
}

function toSafeScore(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(5, Math.max(0, parsed));
}

export default function Home() {
  const [statement, setStatement] = useState("");
  const [intent, setIntent] = useState(intentOptions[0]);
  const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
  const [rewrite, setRewrite] = useState<RewriteResponse | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState<"analyze" | "rewrite" | "plan" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRun = statement.trim().length > 0;

  const copyText = async (text: string) => navigator.clipboard.writeText(text);

  const copyFull = useMemo(() => {
    return [
      "Workplan Clarifier Export",
      "",
      analyze ? `Classification: ${analyze.classification}\nConfidence: ${analyze.confidence}\nExplanation: ${analyze.explanation}` : "",
      rewrite ? `\nRewrite Suggestions:\n${toSafeArray(rewrite.suggestions, isSuggestion).map((s, i) => `${i + 1}. ${s.text}\nWhy: ${s.why_it_works}`).join("\n\n")}` : "",
      plan
        ? `\nFull Workplan:\nGoal: ${plan.goal}\nObjectives:\n- ${toSafeArray(plan.objectives, isString).join("\n- ")}\nStrategies:\n- ${toSafeArray(plan.strategies, isString).join("\n- ")}\nTactics:\n- ${toSafeArray(plan.tactics, isString).join("\n- ")}\nKPIs:\n- ${toSafeArray(plan.kpis, isString).join("\n- ")}`
        : "",
    ].join("\n");
  }, [analyze, rewrite, plan]);

  const downloadTxt = () => {
    const blob = new Blob([copyFull], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workplan-clarifier.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  async function postJson(path: string, payload: object) {
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(data.error || "Request failed");
    }
    return res.json();
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-8 shadow-executive">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Workplan Clarifier</h1>
        <p className="mt-2 text-lg text-slate-700">Turn unclear planning language into structured goals, strategies, and measurable outcomes.</p>
      </header>

      <section className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-executive">
        <label className="text-sm font-medium text-slate-800">Paste a planning statement</label>
        <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={5} className="w-full rounded-xl border border-blue-200 bg-white p-4 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500" />
        <div className="flex flex-wrap gap-2">
          {samples.map((sample) => (
            <button key={sample} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-200 hover:text-blue-800" onClick={() => setStatement(sample)}>
              {sample}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button disabled={!canRun || !!loading} onClick={async () => { setLoading("analyze"); try { setAnalyze(await postJson("/api/analyze", { statement })); } catch (e) { setError((e as Error).message); } finally { setLoading(null); } }} className="rounded-xl bg-blue-700 px-5 py-3 font-medium text-white transition hover:bg-blue-800 disabled:opacity-50">{loading === "analyze" ? "Analyzing..." : "Analyze Statement"}</button>
        </div>

        {analyze && <section className="space-y-3 rounded-xl border border-blue-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-amber-600">What did you intend this to be?</h2>
          <div className="flex flex-wrap gap-3">
            <select value={intent} onChange={(e) => setIntent(e.target.value)} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-slate-900">
              {intentOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
            <button disabled={!canRun || !!loading} onClick={async () => { setLoading("rewrite"); try { setRewrite(await postJson("/api/rewrite", { statement, intendedType: intent })); } catch (e) { setError((e as Error).message); } finally { setLoading(null); } }} className="rounded-xl border border-blue-600 px-5 py-3 font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50">{loading === "rewrite" ? "Rewriting..." : "Rewrite as Selected Type"}</button>
            <button disabled={!canRun || !!loading} onClick={async () => { setLoading("plan"); try { setPlan(await postJson("/api/build-plan", { statement })); } catch (e) { setError((e as Error).message); } finally { setLoading(null); } }} className="rounded-xl border border-blue-600 px-5 py-3 font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50">{loading === "plan" ? "Building..." : "Build Full Workplan"}</button>
          </div>
        </section>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      </section>

      {rewrite && <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-executive">
        <h2 className="text-xl font-semibold text-slate-900">Rewrite Suggestions <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-700">({rewrite.intended_type})</span></h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {toSafeArray(rewrite.suggestions, isSuggestion).map((s, i) => <article key={i} className="rounded-xl border border-blue-200 bg-white p-4"><p className="font-medium text-slate-900">{s.text}</p><p className="mt-2 text-sm text-slate-700">{s.why_it_works}</p><button onClick={() => copyText(s.text)} className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-800">Copy</button></article>)}
        </div>
      </section>}

      {analyze && <section className="mt-8 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-executive md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-amber-600">Analysis</h2>
          <p className="mt-3 text-slate-900"><strong>Classification:</strong> {analyze.classification || "Not available"}</p>
          <p><strong>Confidence:</strong> {analyze.confidence || "Not available"}</p>
          <p className="mt-2 text-slate-800">{analyze.explanation || "No explanation provided."}</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-800">{toSafeArray(analyze.missing_elements, isString).map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-amber-600">Planning Clarity Check</h3>
          {Object.entries(analyze.clarity_scores || {}).map(([key, rawScore]) => {
            const score = toSafeScore(rawScore);
            return (
              <div key={key} className="mt-3">
                <div className="mb-1 flex justify-between text-sm text-slate-800"><span>{key}</span><span>{score}/5</span></div>
                <div className="h-2 rounded-full bg-blue-100"><div className={`${score >= 4 ? "bg-gradient-to-r from-blue-700 to-amber-500" : "bg-gradient-to-r from-blue-600 to-blue-700"} h-2 rounded-full`} style={{ width: `${(score / 5) * 100}%` }} /></div>
                <p className="text-xs text-slate-500">{toSafeArray(analyze.clarity_notes?.[key], isString).join(" ")}</p>
              </div>
            );
          })}
        </div>
      </section>}

      {plan && <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-executive">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-900">Full Workplan Builder</h2><button onClick={() => copyText(copyFull)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white transition hover:bg-blue-800">Copy Full Plan</button></div>
        <div className="space-y-3">
          <Card title="Goal" items={[plan.goal]} />
          <Card title="Objectives" items={toSafeArray(plan.objectives, isString)} />
          <Card title="Strategies" items={toSafeArray(plan.strategies, isString)} />
          <Card title="Tactics / Actions" items={toSafeArray(plan.tactics, isString)} />
          <Card title="KPIs / Measurable Outcomes" items={toSafeArray(plan.kpis, isString)} />
        </div>
        <button onClick={downloadTxt} className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-800">Download as .txt</button>
      </section>}
    </main>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-blue-200 bg-white p-4"><h3 className="font-semibold text-amber-600">{title}</h3><ul className="mt-2 list-disc pl-5 text-slate-900">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
