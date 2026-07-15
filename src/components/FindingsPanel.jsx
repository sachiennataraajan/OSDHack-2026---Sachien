const RISK_COLOR = {
  high: 'var(--color-redact)',
  medium: 'var(--color-amber)',
  low: 'var(--color-paper-dim)',
};

export function FindingsPanel({ text, spans, revealed, onToggleReveal }) {
  if (!spans.length) {
    return (
      <p className="text-sm italic text-paper-dim">
        No sensitive data detected yet — start typing or paste something above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {spans.map((span, i) => {
        const isRevealed = revealed.has(i);
        const value = text.slice(span.start, span.end);
        return (
          <button
            key={i}
            onClick={() => onToggleReveal(i)}
            className="flex items-center gap-3 rounded-sm border border-wire bg-ink-800 px-3 py-2 text-left transition-colors hover:border-paper-dim"
            style={{ borderLeftWidth: '3px', borderLeftColor: RISK_COLOR[span.risk] }}
          >
            <span
              className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color: RISK_COLOR[span.risk] }}
            >
              {span.label}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-paper">
              {isRevealed ? value : '•'.repeat(Math.min(value.length, 24))}
            </span>
            {span.source === 'ner' && typeof span.score === 'number' && (
              <span className="shrink-0 font-mono text-[10px] text-paper-dim">
                {Math.round(span.score * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}