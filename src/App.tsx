import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Layers3,
  Lightbulb,
  Megaphone,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import { analyzeContent } from './analysis';

const STORAGE_KEY = 'kpc-content-strategist-source';

const workflowSteps = [
  { title: 'Source', description: 'Add the information you need to communicate.', icon: FileText },
  { title: 'Analysis', description: 'Understand audiences, objectives, risks, and gaps.', icon: Lightbulb },
  { title: 'Plan', description: 'Choose channels, timing, sequence, and priorities.', icon: Layers3 },
  { title: 'Create', description: 'Develop distinct content for each selected channel.', icon: Megaphone },
  { title: 'Before You Publish', description: 'Complete a practical readiness check.', icon: ClipboardCheck },
  { title: 'Communications Package', description: 'Review the complete coordinated package.', icon: PackageCheck },
];

function countWords(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue.split(/\s+/).length : 0;
}

function ResultList({ items, emptyMessage }: { items: string[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function App() {
  const [sourceText, setSourceText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [activeStep, setActiveStep] = useState(0);

  const wordCount = useMemo(() => countWords(sourceText), [sourceText]);
  const analysis = useMemo(() => analyzeContent(sourceText), [sourceText]);
  const hasSource = sourceText.trim().length > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sourceText);
  }, [sourceText]);

  function clearSource() {
    setSourceText('');
    setActiveStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }

  function continueToAnalysis() {
    if (hasSource) {
      setActiveStep(1);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="KPC Content Strategist home">
          <span className="brand-mark" aria-hidden="true">KPC</span>
          <span>
            <strong>KPC Content Strategist</strong>
            <small>Helping KPC communicate with confidence.</small>
          </span>
        </a>
        <span className="product-status">Sprint 1</span>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Communications workspace</p>
            <h1 id="page-title">Turn source information into a coordinated communications package.</h1>
            <p className="hero-copy">
              Begin with meeting minutes, an email, event notes, an announcement, or a policy update.
              The workspace will guide the Communications Team through planning, creation, review, and packaging.
            </p>
          </div>
          <div className="hero-principle">
            <Check aria-hidden="true" size={22} />
            <p><strong>Website first.</strong> Supporting channels reinforce the authoritative source.</p>
          </div>
        </section>

        <nav className="workflow" aria-label="Communications workflow">
          <ol>
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isComplete = index < activeStep;
              const isAvailable = index === 0 || (hasSource && index <= activeStep);

              return (
                <li key={step.title}>
                  <button
                    type="button"
                    className={`workflow-step${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                    disabled={!isAvailable}
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => isAvailable && setActiveStep(index)}
                  >
                    <span className="step-number">{isComplete ? <Check size={16} /> : index + 1}</span>
                    <Icon className="step-icon" aria-hidden="true" size={20} />
                    <span className="step-copy">
                      <strong>{step.title}</strong>
                      <small>{step.description}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="workspace" aria-live="polite">
          {activeStep === 0 && (
            <div className="source-layout">
              <article className="workspace-card source-card">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Step 1 of 6</p>
                    <h2>Add your source information</h2>
                    <p>Paste the complete source. Do not rewrite or organize it first.</p>
                  </div>
                  <div className="word-count" aria-label={`${wordCount} words`}>
                    <strong>{wordCount}</strong>
                    <span>{wordCount === 1 ? 'word' : 'words'}</span>
                  </div>
                </div>

                <label htmlFor="source-text">Source text</label>
                <textarea
                  id="source-text"
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="Paste meeting minutes, an email, event information, an announcement, a policy update, or rough notes here..."
                  rows={18}
                />

                <div className="autosave-note" role="status">
                  Your source is saved automatically on this device.
                </div>

                <div className="card-actions">
                  <button className="button secondary" type="button" onClick={clearSource} disabled={!hasSource}>
                    <RotateCcw aria-hidden="true" size={18} />
                    Clear
                  </button>
                  <button className="button primary" type="button" onClick={continueToAnalysis} disabled={!hasSource}>
                    Continue to Analysis
                    <ArrowRight aria-hidden="true" size={18} />
                  </button>
                </div>
              </article>

              <aside className="workspace-card guidance-card" aria-labelledby="guidance-title">
                <p className="eyebrow">Source guidance</p>
                <h2 id="guidance-title">Include the facts. The strategist will organize them.</h2>
                <ul>
                  <li>What happened or is changing</li>
                  <li>Dates, deadlines, and locations</li>
                  <li>Who is affected</li>
                  <li>Registration or contact details</li>
                  <li>Links that must be included</li>
                  <li>Anything sensitive or uncertain</li>
                </ul>
                <div className="guidance-callout">
                  <strong>Questions will be limited.</strong>
                  <span>Only essential missing information should interrupt the workflow.</span>
                </div>
              </aside>
            </div>
          )}

          {activeStep === 1 && (
            <article className="workspace-card analysis-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Step 2 of 6</p>
                  <h2>Communication analysis</h2>
                  <p>Review the strategist's interpretation before developing the communication plan.</p>
                </div>
              </div>

              <div className="analysis-grid">
                <section>
                  <h3>Likely audiences</h3>
                  <ResultList items={analysis.audience} emptyMessage="No audience identified." />
                </section>
                <section>
                  <h3>Communication objectives</h3>
                  <ResultList items={analysis.objectives} emptyMessage="No objective identified." />
                </section>
                <section>
                  <h3>Key messages</h3>
                  <ResultList items={analysis.keyMessages} emptyMessage="No key messages identified." />
                </section>
                <section>
                  <h3>Potential risks</h3>
                  <ResultList items={analysis.risks} emptyMessage="No risks identified." />
                </section>
                <section>
                  <h3>Recommended channels</h3>
                  <ResultList items={analysis.suggestedChannels} emptyMessage="No channels identified." />
                </section>
                <section>
                  <h3>Missing information</h3>
                  <ResultList items={analysis.missingInformation} emptyMessage="No essential gaps detected." />
                </section>
              </div>

              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => setActiveStep(0)}>
                  <ArrowLeft aria-hidden="true" size={18} />
                  Edit Source
                </button>
                <button className="button primary" type="button" disabled>
                  Continue to Plan
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            </article>
          )}

          {activeStep > 1 && (
            <article className="workspace-card placeholder-card">
              <p className="eyebrow">Step {activeStep + 1} of 6</p>
              <h2>{workflowSteps[activeStep].title}</h2>
              <p>This workspace is reserved for the next functional slice of the application.</p>
              <button className="button secondary" type="button" onClick={() => setActiveStep(1)}>
                Return to Analysis
              </button>
            </article>
          )}
        </section>
      </main>

      <footer>
        <span>KPC Content Strategist</span>
        <span>Recommendations support Communications Team decisions.</span>
      </footer>
    </div>
  );
}

export default App;
