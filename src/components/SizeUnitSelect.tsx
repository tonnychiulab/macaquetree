import { useEffect, useId, useRef, useState } from 'react';
import { useSizeUnit } from '../hooks/useSizeUnit';
import type { SizeUnit } from '../utils/helpers';

const OPTIONS: { value: SizeUnit; label: string }[] = [
  { value: 'auto', label: '自動' },
  { value: 'KB', label: 'KB' },
  { value: 'MB', label: 'MB' },
  { value: 'GB', label: 'GB' },
];

export function SizeUnitSelect() {
  const { sizeUnit, setSizeUnit } = useSizeUnit();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = OPTIONS.find((option) => option.value === sizeUnit) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="unit-select" ref={rootRef}>
      <span id={`${listId}-label`}>單位</span>
      <button
        type="button"
        className="unit-select-trigger"
        aria-label="容量顯示單位"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        {current.label}
      </button>
      {open && (
        <ul
          id={listId}
          className="unit-select-menu"
          role="listbox"
          aria-labelledby={`${listId}-label`}
          aria-activedescendant={`${listId}-${sizeUnit}`}
        >
          {OPTIONS.map((option) => {
            const selected = option.value === sizeUnit;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${option.value}`}
                  className={`unit-select-option${selected ? ' selected' : ''}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setSizeUnit(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
