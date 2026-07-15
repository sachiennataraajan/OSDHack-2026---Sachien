import { useEffect, useRef, useState, useCallback } from 'react';

export function useNerWorker() {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const nextId = useRef(0);
  const [status, setStatus] = useState('idle'); 
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/nerWorker.js', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.addEventListener('message', (event) => {
      const { type } = event.data;
      if (type === 'progress') {
        const p = event.data.progress;
        if (p && typeof p.progress === 'number') {
          setProgress(Math.round(p.progress));
        }
      } else if (type === 'ready') {
        setStatus('ready');
        setProgress(100);
        setDevice(event.data.device ?? null);
      } else if (type === 'result') {
        const { id, results } = event.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          resolve(results);
          pendingRef.current.delete(id);
        }
      } else if (type === 'error') {
        setStatus('error');
        setError(event.data.error);
      }
    });

    return () => worker.terminate();
  }, []);

  const load = useCallback(() => {
    setStatus('loading');
    workerRef.current?.postMessage({ type: 'load' });
  }, []);

  const run = useCallback((text) => {
    return new Promise((resolve) => {
      const id = nextId.current++;
      pendingRef.current.set(id, resolve);
      workerRef.current?.postMessage({ type: 'run', text, id });
    });
  }, []);

  return { status, progress, error, device, load, run };
}