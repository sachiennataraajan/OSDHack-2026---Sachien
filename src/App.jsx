import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stamp } from './components/Stamp';
import { HighlightedText } from './components/HighlightedText';
import { FindingsPanel } from './components/FindingsPanel';
import { useNerWorker } from './lib/useNerWorker';
import { useNetworkActivity } from './lib/useNetworkActivity';
import { detectRegex, mergeDetections, buildRedactedText } from './lib/engine';

const SAMPLE_TEXT = `Hi team, quick update before the call.
My name is Sarah Chen and you can reach me at sarah.chen@northwind-labs.com or +1 415 555 0142.
Please use this key to pull the staging logs: sk-live_9fT2kL0pQmZxR7vC1nB4hA8e
The client is based out of Austin, Texas and their internal server is at 192.168.1.42.
Card on file ends in ...4242 but full number is 4111 1111 1111 1111 if finance needs it.
Let's sync after lunch.`;

export default function App() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [regexSpans, setRegexSpans] = useState([]);
  const [nerSpans, setNerSpans] = useState([]);
  const [revealed, setRevealed] = useState(new Set());
  const [showRedacted, setShowRedacted] = useState(false);
  const [copied, setCopied] = useState(false);

  const ner = useNerWorker();
  const net = useNetworkActivity();
  const debounceRef = useRef(null);

  useEffect(() => {
    setRegexSpans(detectRegex(text));
  }, [text]);

  useEffect(() => {
    if (ner.status !== 'ready') return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await ner.run(text);
      setNerSpans(results);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [text, ner.status]);

  const spans = useMemo(
    () => mergeDetections(regexSpans, nerSpans).sort((a, b) => a.start - b.start),
    [regexSpans, nerSpans]
  );

  const riskCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    spans.forEach((s) => c[s.risk]++);
    return c;
  }, [spans]);

  const redactedText = useMemo(() => buildRedactedText(text, spans), [text, spans]);

  const toggleReveal = useCallback((i) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(showRedacted ? redactedText : text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-paper">
      <header className="border-b border-wire">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-safe font-mono text-xs font-bold text-safe">
              AL
            </div>
            <div>
              <div className="font-mono text-lg font-semibold tracking-tight">Airlock</div>
              <div className="text-xs text-paper-dim">catches what you're about to paste into the cloud</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Stamp tone="safe">On-Device</Stamp>
            <Stamp tone="paper">Open Source</Stamp>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-8">
          <h1 className="max-w-2xl font-mono text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Before you paste it into ChatGPT,{' '}
            <span className="text-redact">let Airlock read it first.</span>
          </h1>
          <p className="mt-3 max-w-xl text-paper-dim">
            Every scan below runs locally in this browser tab — a local NER model plus pattern
            matching, both compiled to run on your device. Nothing you type is ever sent anywhere.
            Watch the network counter on the right stay flat while you type.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatusCard
            label="Local model"
            value={
              ner.status === 'ready'
                ? `Loaded (${ner.device === 'webgpu' ? 'WebGPU' : 'WASM'})`
                : ner.status === 'loading'
                  ? `Loading ${ner.progress}%`
                  : ner.status === 'error'
                    ? 'Error'
                    : 'Not loaded'
            }
            action={
              ner.status === 'idle' ? (
                <button
                  onClick={ner.load}
                  className="mt-2 rounded-sm border border-safe px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-safe hover:bg-safe/10"
                >
                  Load model
                </button>
              ) : null
            }
            tone={ner.status === 'ready' ? 'safe' : 'paper'}
          />
          <StatusCard
            label="Detections found"
            value={`${spans.length}`}
            sub={`${riskCounts.high} high · ${riskCounts.medium} med · ${riskCounts.low} low`}
            tone={spans.length ? 'redact' : 'paper'}
          />
          <StatusCard
            label="Network requests since load"
            value={`${net.count}`}
            sub="watch this stay flat while you type"
            tone="safe"
            blink
          />
        </section>

        <section className="grain rounded-md border border-wire bg-ink-900 p-1">
          <div className="flex items-center justify-between border-b border-wire px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowRedacted(false)}
                className={`rounded-sm px-3 py-1 font-mono text-xs uppercase tracking-wide ${
                  !showRedacted ? 'bg-wire text-paper' : 'text-paper-dim'
                }`}
              >
                Live scan
              </button>
              <button
                onClick={() => setShowRedacted(true)}
                className={`rounded-sm px-3 py-1 font-mono text-xs uppercase tracking-wide ${
                  showRedacted ? 'bg-wire text-paper' : 'text-paper-dim'
                }`}
              >
                Redacted output
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="rounded-sm border border-paper-dim px-3 py-1 font-mono text-xs uppercase tracking-wide text-paper-dim hover:border-paper hover:text-paper"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {!showRedacted ? (
            <div className="grid gap-0 sm:grid-cols-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                className="h-96 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-paper outline-none placeholder:text-paper-dim/50"
                placeholder="Paste anything you were about to send to a cloud AI tool..."
              />
              <div className="h-96 overflow-y-auto border-t border-wire p-4 font-mono text-sm leading-relaxed sm:border-l sm:border-t-0">
                <HighlightedText
                  text={text}
                  spans={spans}
                  revealed={revealed}
                  onToggleReveal={toggleReveal}
                />
              </div>
            </div>
          ) : (
            <pre className="h-96 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-paper">
              {redactedText}
            </pre>
          )}
        </section>

        <p className="mt-3 text-xs text-paper-dim">
          Click any highlighted span to reveal or re-hide it. High risk (red) = keys, cards, IDs, names ·
          Medium (amber) = emails, phone, location · Low (grey) = IP addresses and other metadata.
        </p>

        <section className="mt-8">
          <h2 className="font-mono text-sm uppercase tracking-widest text-paper-dim">
            Findings ({spans.length})
          </h2>
          <div className="mt-3">
            <FindingsPanel
              text={text}
              spans={spans}
              revealed={revealed}
              onToggleReveal={toggleReveal}
            />
          </div>
        </section>

        <section className="mt-14 border-t border-wire pt-8">
          <h2 className="font-mono text-sm uppercase tracking-widest text-paper-dim">How it works</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Step n="01" title="Pattern engine">
              Regex rules catch structured data instantly — emails, API keys, JWTs, card numbers —
              no model needed, runs on every keystroke.
            </Step>
            <Step n="02" title="Local NER model">
              A small transformer (BERT-NER, ~17M params) runs fully in-browser via Transformers.js +
              WASM/WebGPU to catch names, orgs, and locations regex can't.
            </Step>
            <Step n="03" title="Zero network calls">
              After the one-time model download (cached by your browser), every scan happens purely
              on your CPU/GPU. No server, no API key, works offline.
            </Step>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-wire px-6 py-6 text-xs text-paper-dim">
        Built for OSDHack 2026 · On-Device AI · MIT Licensed
      </footer>
    </div>
  );
}

function StatusCard({ label, value, sub, action, tone = 'paper', blink }) {
  const toneColor = { safe: 'text-safe', redact: 'text-redact', paper: 'text-paper' }[tone];
  return (
    <div className="rounded-md border border-wire bg-ink-900 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-paper-dim">
        {blink && <span className="h-1.5 w-1.5 rounded-full bg-safe blink" />}
        {label}
      </div>
      <div className={`mt-1 font-mono text-xl font-semibold ${toneColor}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-paper-dim">{sub}</div>}
      {action}
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div>
      <div className="font-mono text-xs text-paper-dim">{n}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-paper">{title}</div>
      <p className="mt-1 text-sm text-paper-dim">{children}</p>
    </div>
  );
}