const RULES = [
  {
    label: 'EMAIL',
    risk: 'medium',
    re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    label: 'API_KEY',
    risk: 'high',
    re: /\b(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]{10,}|AIzaSy[a-zA-Z0-9_\-]{35}|AQ[a-zA-Z0-9_\-]{10,60})\b/g,
  },
  {
    label: 'JWT',
    risk: 'high',
    re: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
  },
  {
    label: 'PHONE',
    risk: 'medium',
    re: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}\b/g,
  },
  {
    label: 'CREDIT_CARD',
    risk: 'high',
    re: /\b(?:\d[ -]*?){13,16}\b/g,
  },
  {
    label: 'SSN_OR_ID',
    risk: 'high',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    label: 'IP_ADDRESS',
    risk: 'low',
    re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
];

export function runRegexDetectors(text) {
  const matches = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        label: rule.label,
        risk: rule.risk,
        source: 'regex',
        text: m[0],
      });
      if (m[0].length === 0) rule.re.lastIndex++;
    }
  }
  return matches;
}