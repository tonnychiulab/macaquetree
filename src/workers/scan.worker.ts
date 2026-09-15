import { createScanWorkerRuntime } from '../scan/workerHandler';
import type { WorkerInboundMessage } from '../types';

const runtime = createScanWorkerRuntime((message) => {
  self.postMessage(message);
});

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  void runtime.handle(event.data);
};
