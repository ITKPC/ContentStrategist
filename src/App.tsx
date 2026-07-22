import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Layers3,
  Lightbulb,
  Megaphone,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import { analyzeContent } from './analysis';
import { buildCommunicationPlan } from './planning';
import { generateContentPackage } from './contentGenerator';
import { reviewCommunicationPackage } from './review';
import {
  buildCommunicationsPackage,
  packageToPlainText,
} from './packageBuilder';

const STORAGE_KEY = 'kpc-content-strategist-source';

const workflowSteps = [
  { title: 'Source', description: 'Add the information you need to communicate.', icon: FileText },
  { title: 'Analysis', description: 'Understand audiences, objectives, risks, and gaps.', icon: Lightbulb },
  { title: 'Plan', description: 'Review channels, timing, sequence, and priorities.', icon: Layers3 },
  { title: 'Create', description: 'Develop distinct content for each selected channel.', icon: Megaphone },
  { title: 'Before You Publish', description: 'Complete a practical readiness check.', icon: ClipboardCheck },
  { title: 'Communications Package', description: 'Review and copy the coordinated package.', icon: PackageCheck },
];

function countWords(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue.split(/\s+/).length : 0;
}

function ResultList({ items, emptyMessage }: { items: string[]; emptyMessage: string }) {
  if (items.length === 0) return <p>{emptyMessage}</p>;

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function App() {
  const [sourceText, setSourceText] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  );
  const [activeStep, setActiveStep] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');

  const wordCount = useMemo(() => countWords(sourceText), [sourceText]);
  const analysis = useMemo(() => analyzeContent(sourceText), [sourceText]);
  const plan = useMemo(() => buildCommunicationPlan(analysis), [analysis]);
  const generatedContent = useMemo(
    () => generateContentPackage(analysis, plan),
    [analysis, plan]
  );
  const review = useMemo(
    () => reviewCommunicationPackage(analysis, plan, generatedContent),
    [analysis, generatedContent, plan]
  );
  const communicationsPackage = useMemo(
    () =>
      buildCommunicationsPackage(analysis, plan, generatedContent, review),
    [analysis, generatedContent, plan, review]
  );
  const hasSource = sourceText.trim().length > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sourceText);
  }, [sourceText]);

  function clearSource() {
    setSourceText('');
    setActiveStep(0);
    setCopyMessage('');
    localStorage.removeItem(STORAGE_KEY);
  }

  function goToStep(step: number) {
    if (hasSource && step >= 0 && step < workflowSteps.length) {
      setActiveStep(step);
    }
  }

  async function copyPackage() {
    try {
      await navigator.clipboard.writeText(
        packageToPlainText(communicationsPackage)
      );
      setCopyMessage('Complete package copied.');
    } catch {
      setCopyMessage('The package could not be copied automatically.');
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
        <span className="product-status">Working prototype</span>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Communications workspace</p>
            <h1 id="page-title">Turn source information into a coordinated communications package.</h1>
            <p className="hero-copy">
              Begin with meeting minutes, an email, event notes, an announcement, or a policy update.
              The workspace guides the Communications Team through planning, creation, review, and packaging.
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
              const isAvailable = index === 0 || hasSource;

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
                  <button className="button primary" type="button" onClick={() => goToStep(1)} disabled={!hasSource}>
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
              </aside>
            </div>
          )}

          {activeStep === 1 && (
            <article className="workspace-card analysis-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Step 2 of 6</p>
                  <h2>Communication analysis</h2>
                  <p>Review the strategist's interpretation before developing the plan.</p>
                </div>
              </div>
              <div className="analysis-grid">
                <section><h3>Likely audiences</h3><ResultList items={analysis.audience} emptyMessage="No audience identified." /></section>
                <section><h3>Communication objectives</h3><ResultList items={analysis.objectives} emptyMessage="No objective identified." /></section>
                <section><h3>Key messages</h3><ResultList items={analysis.keyMessages} emptyMessage="No key messages identified." /></section>
                <section><h3>Potential risks</h3><ResultList items={analysis.risks} emptyMessage="No risks identified." /></section>
                <section><h3>Recommended channels</h3><ResultList items={analysis.suggestedChannels} emptyMessage="No channels identified." /></section>
                <section><h3>Missing information</h3><ResultList items={analysis.missingInformation} emptyMessage="No essential gaps detected." /></section>
              </div>
              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => goToStep(0)}><ArrowLeft size={18} />Edit Source</button>
                <button className="button primary" type="button" onClick={() => goToStep(2)}>Continue to Plan<ArrowRight size={18} /></button>
              </div>
            </article>
          )}

          {activeStep === 2 && (
            <article className="workspace-card analysis-card">
              <p className="eyebrow">Step 3 of 6</p>
              <h2>Communication plan</h2>
              <div className="analysis-grid">
                <section><h3>Publication order</h3><ResultList items={plan.publicationOrder} emptyMessage="No sequence available." /></section>
                <section><h3>Recommended channels</h3><ResultList items={plan.recommendedChannels} emptyMessage="No channels selected." /></section>
                <section><h3>Review required</h3><ResultList items={plan.reviewRequired} emptyMessage="No additional review identified." /></section>
                <section><h3>Timing guidance</h3><ResultList items={plan.timing} emptyMessage="No timing guidance available." /></section>
              </div>
              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => goToStep(1)}><ArrowLeft size={18} />Back</button>
                <button className="button primary" type="button" onClick={() => goToStep(3)}>Create Content<ArrowRight size={18} /></button>
              </div>
            </article>
          )}

          {activeStep === 3 && (
            <article className="workspace-card analysis-card">
              <p className="eyebrow">Step 4 of 6</p>
              <h2>Channel content</h2>
              <div className="analysis-grid">
                {generatedContent.items.map((item) => (
                  <section key={item.channel}>
                    <h3>{item.channel}: {item.title}</h3>
                    <p><strong>Purpose:</strong> {item.purpose}</p>
                    <pre>{item.body}</pre>
                  </section>
                ))}
              </div>
              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => goToStep(2)}><ArrowLeft size={18} />Back</button>
                <button className="button primary" type="button" onClick={() => goToStep(4)}>Review Before Publishing<ArrowRight size={18} /></button>
              </div>
            </article>
          )}

          {activeStep === 4 && (
            <article className="workspace-card analysis-card">
              <p className="eyebrow">Step 5 of 6</p>
              <h2>Before You Publish</h2>
              <p><strong>Status:</strong> {review.status.replace('_', ' ')}</p>
              <p><strong>Readiness score:</strong> {review.readinessScore}/100</p>
              <div className="analysis-grid">
                <section><h3>Blocking issues</h3><ResultList items={review.blockingIssues.map((item) => `${item.message} ${item.recommendation}`)} emptyMessage="No blocking issues." /></section>
                <section><h3>Warnings</h3><ResultList items={review.warnings.map((item) => `${item.message} ${item.recommendation}`)} emptyMessage="No warnings." /></section>
                <section><h3>Completed checks</h3><ResultList items={review.completedChecks} emptyMessage="No completed checks." /></section>
                <section><h3>Recommended actions</h3><ResultList items={review.recommendedActions} emptyMessage="No additional actions." /></section>
              </div>
              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => goToStep(3)}><ArrowLeft size={18} />Back</button>
                <button className="button primary" type="button" onClick={() => goToStep(5)}>Build Package<ArrowRight size={18} /></button>
              </div>
            </article>
          )}

          {activeStep === 5 && (
            <article className="workspace-card analysis-card">
              <p className="eyebrow">Step 6 of 6</p>
              <h2>{communicationsPackage.title}</h2>
              <p>{communicationsPackage.summary}</p>
              <div className="analysis-grid">
                <section><h3>Audience</h3><ResultList items={communicationsPackage.audience} emptyMessage="No audience listed." /></section>
                <section><h3>Key messages</h3><ResultList items={communicationsPackage.keyMessages} emptyMessage="No key messages listed." /></section>
                <section><h3>Publication checklist</h3><ResultList items={communicationsPackage.publicationChecklist} emptyMessage="No checklist items." /></section>
                <section><h3>Package status</h3><p>{communicationsPackage.status.replace('_', ' ')}</p></section>
              </div>
              <div className="card-actions">
                <button className="button secondary" type="button" onClick={() => goToStep(4)}><ArrowLeft size={18} />Back</button>
                <button className="button primary" type="button" onClick={copyPackage}><Copy size={18} />Copy Complete Package</button>
              </div>
              {copyMessage && <p role="status">{copyMessage}</p>}
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
