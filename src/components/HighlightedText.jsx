const RISK_BG = {
  high: 'var(--color-redact)',
  medium: 'var(--color-amber)',
  low: 'var(--color-paper-dim)',
};

export function HighlightedText({ text, spans, revealed, onToggleReveal }) {
  if (!spans.length) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const parts = [];
  let cursor = 0;

  spans.forEach((span, i) => {
    if (span.start > cursor) {
      parts.push(
        <span key={`t-${i}`} className="whitespace-pre-wrap">
          {text.slice(cursor, span.start)}
        </span>
      );
    }
    const isRevealed = revealed.has(i);
    parts.push(
      <span
        key={`m-${i}`}
        onClick={() => onToggleReveal(i)}
        title={`${span.label} · ${span.risk} risk · click to toggle`}
        className="redact-bar relative mx-0.5 inline-flex cursor-pointer items-center rounded-[2px] px-1.5 py-0.5 font-mono text-sm transition-colors"
        style={{
          backgroundColor: isRevealed ? 'transparent' : RISK_BG[span.risk],
          color: isRevealed ? 'var(--color-paper)' : 'var(--color-ink-950)',
          border: isRevealed ? `1px dashed ${RISK_BG[span.risk]}` : 'none',
        }}
      >
        {isRevealed ? (
          text.slice(span.start, span.end)
        ) : (
          <span className="select-none text-[10px] font-bold uppercase tracking-wider">
            {span.label}
          </span>
        )}
      </span>
    );
    cursor = span.end;
  });

  if (cursor < text.length) {
    parts.push(
      <span key="t-end" className="whitespace-pre-wrap">
        {text.slice(cursor)}
      </span>
    );
  }

  return <>{parts}</>;
}