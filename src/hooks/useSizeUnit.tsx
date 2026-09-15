import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { formatBytes, type SizeUnit } from '../utils/helpers';

/* Context files export a provider component together with the consuming hook. */
/* eslint-disable react-refresh/only-export-components */

const STORAGE_KEY = 'macaquetree.sizeUnit';

function readStoredUnit(): SizeUnit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'auto' || stored === 'KB' || stored === 'MB' || stored === 'GB') {
      return stored;
    }
  } catch {
    // private mode or tests without storage
  }
  return 'auto';
}

interface SizeUnitContextValue {
  sizeUnit: SizeUnit;
  setSizeUnit: (unit: SizeUnit) => void;
  formatSize: (bytes: number) => string;
}

const SizeUnitContext = createContext<SizeUnitContextValue>({
  sizeUnit: 'auto',
  setSizeUnit: () => undefined,
  formatSize: (bytes: number) => formatBytes(bytes),
});

export function SizeUnitProvider({ children }: { children: ReactNode }) {
  const [sizeUnit, setSizeUnitState] = useState<SizeUnit>(readStoredUnit);

  const setSizeUnit = useCallback((unit: SizeUnit) => {
    setSizeUnitState(unit);
    try {
      localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const value = useMemo<SizeUnitContextValue>(
    () => ({
      sizeUnit,
      setSizeUnit,
      formatSize: (bytes: number) => formatBytes(bytes, 2, sizeUnit),
    }),
    [sizeUnit, setSizeUnit]
  );

  return <SizeUnitContext.Provider value={value}>{children}</SizeUnitContext.Provider>;
}

export function useSizeUnit(): SizeUnitContextValue {
  return useContext(SizeUnitContext);
}
