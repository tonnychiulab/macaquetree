import { useCallback, useEffect, useRef, useState } from 'react';
import { FILE_BATCH_SIZE } from '../types';
import type { SerializedFileNode, WorkerOutboundMessage } from '../types';

function createScanWorker(): Worker {
  return new Worker(new URL('../workers/scan.worker.ts', import.meta.url), {
    type: 'module',
  });
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export function useDirectoryScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [rootNode, setRootNode] = useState<SerializedFileNode | null>(null);
  const [focusedPath, setFocusedPath] = useState('');
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [scanTime, setScanTime] = useState(0);
  const [currentScanningPath, setCurrentScanningPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanSpeed, setScanSpeed] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [knownTotal, setKnownTotal] = useState<number | null>(null);

  const scannedCountRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isScanning) {
      let lastCount = 0;
      interval = setInterval(() => {
        const currentCount = scannedCountRef.current;
        setScanSpeed((currentCount - lastCount) * 2);
        lastCount = currentCount;
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const attachWorker = useCallback((worker: Worker) => {
    worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const data = event.data;
      if (data.type === 'progress') {
        setTotalFiles(data.totalFiles);
        setTotalFolders(data.totalFolders);
        setTotalSize(data.totalSize);
        setCurrentScanningPath(data.currentPath);
        setSkippedCount(data.skippedCount);
        scannedCountRef.current = data.totalFiles + data.totalFolders;
        if (typeof data.processed === 'number') setProcessed(data.processed);
        if (typeof data.total === 'number') setKnownTotal(data.total);
      } else if (data.type === 'complete') {
        setRootNode(data.rootNode);
        setFocusedPath(data.rootNode.path);
        setTotalFiles(data.totalFiles);
        setTotalFolders(data.totalFolders);
        setTotalSize(data.totalSize);
        setScanTime(data.executionTime);
        setSkippedCount(data.skippedCount);
        setIsScanning(false);
        worker.terminate();
        workerRef.current = null;
      } else if (data.type === 'error') {
        setError(data.error);
        setIsScanning(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (event) => {
      setError(`掃描引擎載入失敗: ${event.message}`);
      setIsScanning(false);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const resetProgress = () => {
    setError(null);
    setRootNode(null);
    setFocusedPath('');
    setTotalFiles(0);
    setTotalFolders(0);
    setTotalSize(0);
    setScanSpeed(0);
    setSkippedCount(0);
    setProcessed(0);
    setKnownTotal(null);
    scannedCountRef.current = 0;
  };

  const startFileSystemScan = async () => {
    try {
      workerRef.current?.terminate();
      const picker = window.showDirectoryPicker;
      if (!picker) {
        setError('此瀏覽器不支援 File System Access API。');
        return;
      }
      const directoryHandle = await picker({ mode: 'read' });

      resetProgress();
      setIsScanning(true);
      setCurrentScanningPath('取得授權，啟動掃描執行緒...');
      setKnownTotal(null);

      const worker = createScanWorker();
      workerRef.current = worker;
      attachWorker(worker);
      worker.postMessage({ type: 'start', directoryHandle });
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name !== 'AbortError') {
        const message = err instanceof Error ? err.message : '';
        setError(message || '掃描資料夾失敗，請確定瀏覽器已取得目錄存取權限。');
      }
      setIsScanning(false);
    }
  };

  const startFallbackScan = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    workerRef.current?.terminate();
    resetProgress();
    setIsScanning(true);
    setKnownTotal(fileList.length);
    setCurrentScanningPath('正在讀取所選的目錄結構...');

    const files = Array.from(fileList);
    const worker = createScanWorker();
    workerRef.current = worker;
    attachWorker(worker);

    for (let i = 0; i < files.length; i += FILE_BATCH_SIZE) {
      const chunk = files.slice(i, i + FILE_BATCH_SIZE);
      const done = i + FILE_BATCH_SIZE >= files.length;
      worker.postMessage({
        type: 'start-files',
        files: chunk,
        batchIndex: Math.floor(i / FILE_BATCH_SIZE),
        done,
        totalFiles: files.length,
      });
    }
  };

  const cancelScan = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsScanning(false);
    setCurrentScanningPath('掃描已被使用者取消。');
  };

  const reset = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    resetProgress();
    setScanTime(0);
    setScanSpeed(0);
    setCurrentScanningPath('');
  };

  return {
    isScanning,
    rootNode,
    focusedPath,
    setFocusedPath,
    totalFiles,
    totalFolders,
    totalSize,
    scanTime,
    currentScanningPath,
    error,
    setError,
    scanSpeed,
    skippedCount,
    processed,
    knownTotal,
    fileInputRef,
    startFileSystemScan,
    startFallbackScan,
    cancelScan,
    reset,
  };
}
