export function Stamp({ children, tone = 'safe' }) {
  const toneClasses = {
    safe: 'border-(--color-safe) text-(--color-safe)',
    redact: 'border-(--color-redact) text-(--color-redact)',
    paper: 'border-(--color-paper-dim) text-(--color-paper-dim)',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border-2 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest ${toneClasses}`}
      style={{ transform: 'rotate(-1.5deg)' }}
    >
      {children}
    </span>
  );
}