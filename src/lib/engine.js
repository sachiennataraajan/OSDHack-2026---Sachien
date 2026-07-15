import { runRegexDetectors } from './detectors/regexDetectors';

const RISK_RANK = { high: 3, medium: 2, low: 1 };

export function mergeDetections(a, b) {
  const all = [...a, ...b].sort((x, y) => x.start - y.start || y.end - x.end);
  const merged = [];

  for (const cur of all) {
    const last = merged[merged.length - 1];
    if (last && cur.start < last.end) {
      const curBetter =
        RISK_RANK[cur.risk] > RISK_RANK[last.risk] ||
        (RISK_RANK[cur.risk] === RISK_RANK[last.risk] &&
          cur.end - cur.start > last.end - last.start);
      if (curBetter) merged[merged.length - 1] = cur;
      continue;
    }
    merged.push(cur);
  }
  return merged;
}

export function detectRegex(text) {
  return runRegexDetectors(text);
}

export function buildRedactedText(text, spans) {
  let out = '';
  let cursor = 0;
  for (const span of spans) {
    out += text.slice(cursor, span.start);
    out += `[REDACTED:${span.label}]`;
    cursor = span.end;
  }
  out += text.slice(cursor);
  return out;
}