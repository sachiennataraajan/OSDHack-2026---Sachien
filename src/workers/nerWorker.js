import { pipeline, env } from '@huggingface/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'Xenova/bert-base-NER';

class NERPipeline {
  static instance = null;
  static device = null;

  static async getInstance(progressCallback) {
    if (this.instance) return this.instance;

    const gpuAvailable = typeof navigator !== 'undefined' && !!navigator.gpu;
    try {
      if (gpuAvailable) {
        this.instance = await pipeline('token-classification', MODEL_ID, {
          device: 'webgpu',
          dtype: 'fp32',
          progress_callback: progressCallback,
        });
        this.device = 'webgpu';
        return this.instance;
      }
    } catch (err) {
      console.warn('WebGPU pipeline init failed, falling back to WASM:', err);
    }

    this.instance = await pipeline('token-classification', MODEL_ID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: progressCallback,
    });
    this.device = 'wasm';
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, text, id } = event.data;

  if (type === 'load') {
    try {
      await NERPipeline.getInstance((progress) => {
        self.postMessage({ type: 'progress', progress });
      });
      self.postMessage({ type: 'ready', device: NERPipeline.device });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
    return;
  }

  if (type === 'run') {
    try {
      const classifier = await NERPipeline.getInstance();
      const raw = await classifier(text, { aggregation_strategy: 'simple' });
      const results = raw
        .filter((r) => r.score > 0.6)
        .map((r) => ({
          start: r.start,
          end: r.end,
          label: mapEntityLabel(r.entity_group),
          risk: riskForEntity(r.entity_group),
          source: 'ner',
          text: r.word,
          score: r.score,
        }));
      self.postMessage({ type: 'result', id, results });
    } catch (err) {
      self.postMessage({ type: 'error', id, error: String(err) });
    }
  }
});

function mapEntityLabel(group) {
  switch (group) {
    case 'PER':
      return 'PERSON_NAME';
    case 'ORG':
      return 'ORGANIZATION';
    case 'LOC':
      return 'LOCATION';
    default:
      return group;
  }
}

function riskForEntity(group) {
  if (group === 'PER') return 'high';
  if (group === 'LOC') return 'medium';
  return 'low';
}