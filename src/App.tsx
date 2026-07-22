import { useMemo, useState } from "react";

type Analysis = {
  purpose: string;
  audience: string;
  keyMessage: string;
  details: string;
  missing: string;
};

const emptyAnalysis: Analysis = {
  purpose: "",
  audience: "",
  keyMessage: "",
  details: "",
  missing: "",
};

function inferAnalysis(source: string): Analysis {
  const lower = source.toLowerCase();
  const eventLike = /event|clinic|tournament|session|meeting|workshop|play/.test(lower);
  const volunteerLike = /volunteer|help needed|signup|sign up/.test(lower);
  const memberLike = /member|registration|club/.test(lower);

  return {
    purpose: volunteerLike
      ? "Recruit volunteers or encourage participation"
      : eventLike
        ? "Promote or explain a KPC event or activity"
        : "Share a KPC update or announcement",
    audience: memberLike ? "KPC members" : "KPC members and the local pickleball community",
    keyMessage: source.split(/[.!?]/)[0]?.trim() || "KPC has information to share.",
    details: source,
    missing: /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i.test(source) && /\b(road|street|avenue|centre|center|park|courts?)\b/i.test(source)
      ? "No essential details are obvious. Confirm the call to action before publishing."
      : "Check whether the date, time, location, contact person, deadline, link, and requested action are included.",
  };
}

function generateCopy(source: string, analysis: Analysis) {
  const action = analysis.missing.toLowerCase().includes("no essential")
    ? "Please review the details and take the requested action."
    : "Please watch for confirmed details or contact KPC if you need more information.";

  return `${analysis.keyMessage}\n\n${source.trim()}\n\nThis information is intended for ${analysis.audience.toLowerCase()}. ${action}`;
}

export default function App() {
  const [step, setStep] = useState<"source" | "analysis" | "result">("source");
  const [source, setSource] = useState("");
  const [analysis, setAnalysis] = useState<Analysis>(emptyAnalysis);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const wordCount = useMemo(() => source.trim() ? source.trim().split(/\s+/).length : 0, [source]);

  function analyze() {
    setAnalysis(inferAnalysis(source));
    setStep("analysis");
  }

  function createContent() {
    setResult(generateCopy(source, analysis));
    setStep("result");
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="shell">
      <header className="brand">
        <div className="brand-mark">KPC</div>
        <div>
          <h1>KPC Content Strategist</h1>
          <p>Helping KPC communicate with confidence.</p>
        </div>
      </header>

      <nav className="steps" aria-label="Workflow">
        <span className={step === "source" ? "active" : "done"}>1. Source</span>
        <span className={step === "analysis" ? "active" : step === "result" ? "done" : ""}>2. What We Understand</span>
        <span className={step === "result" ? "active" : ""}>3. Draft</span>
      </nav>

      {step === "source" && (
        <section className="card">
          <p className="eyebrow">Start with what you have</p>
          <h2>What would you like to communicate?</h2>
          <p className="intro">Paste text, rough notes, an announcement, event details, or other material. It does not need to be polished.</p>
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Example: We are holding a beginner clinic next month and need members to register..."
            rows={12}
          />
          <div className="row between">
            <span className="muted">{wordCount} words</span>
            <button disabled={source.trim().length < 20} onClick={analyze}>Analyze My Content</button>
          </div>
        </section>
      )}

      {step === "analysis" && (
        <section className="card">
          <p className="eyebrow">Review before we write</p>
          <h2>What We Understand</h2>
          <p className="intro">Correct anything that is incomplete or inaccurate. These fields guide the draft.</p>
          <div className="form-grid">
            {Object.entries(analysis).map(([key, value]) => (
              <label key={key} className={key === "details" || key === "missing" ? "wide" : ""}>
                <span>{key === "keyMessage" ? "Key message" : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <textarea
                  rows={key === "details" ? 6 : 3}
                  value={value}
                  onChange={(event) => setAnalysis({ ...analysis, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="row between">
            <button className="secondary" onClick={() => setStep("source")}>Back</button>
            <button onClick={createContent}>Create Draft</button>
          </div>
        </section>
      )}

      {step === "result" && (
        <section className="card">
          <p className="eyebrow">First working draft</p>
          <h2>Your Communication</h2>
          <p className="intro">This initial version creates one general-purpose KPC communication. Channel-specific versions come in a later iteration.</p>
          <textarea className="result" rows={14} value={result} onChange={(event) => setResult(event.target.value)} />
          <div className="row between">
            <button className="secondary" onClick={() => setStep("analysis")}>Edit Understanding</button>
            <div className="row">
              <button className="secondary" onClick={() => { setStep("source"); setSource(""); setAnalysis(emptyAnalysis); setResult(""); }}>Start Over</button>
              <button onClick={copyResult}>{copied ? "Copied" : "Copy Draft"}</button>
            </div>
          </div>
        </section>
      )}

      <footer>Prototype analysis is simulated. No information is sent outside this browser.</footer>
    </main>
  );
}
