import { useEffect, useRef, useState } from 'react';

export function useNetworkActivity() {
  const [count, setCount] = useState(0);
  const [lastUrl, setLastUrl] = useState(null);
  const seen = useRef(new Set());

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    performance.getEntriesByType('resource').forEach((e) => seen.current.add(e.name));
    setCount(seen.current.size);

    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!seen.current.has(entry.name)) {
          seen.current.add(entry.name);
          setLastUrl(entry.name);
          setCount(seen.current.size);
        }
      }
    });
    obs.observe({ type: 'resource', buffered: true });
    return () => obs.disconnect();
  }, []);

  return { count, lastUrl };
}