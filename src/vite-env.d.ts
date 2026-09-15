/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string;

  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<import('./types').DirectoryHandleLike>;
  }
}

declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string;
  }
}

export {};
