import { createScanWorkerRuntime, isWorkerInboundMessage } from '../scan/workerHandler';

const runtime = createScanWorkerRuntime((message) => {
  self.postMessage(message);
});

self.onmessage = (event: MessageEvent<unknown>) => {
  if (!isWorkerInboundMessage(event.data)) return;
  void runtime.handle(event.data);
};
