'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Check, X } from 'lucide-react';

export const AVAILABLE_CONTEXTS = [
  'Current Competency Profile',
  'Current Learning Path',
  'Recent Assessment',
  'Selected Course',
];

interface ContextSelectorProps {
  selectedContexts: string[];
  onToggleContext: (contextName: string) => void;
  onClearContexts: () => void;
}

export function ContextSelector({
  selectedContexts,
  onToggleContext,
  onClearContexts,
}: ContextSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
          selectedContexts.length > 0
            ? 'bg-primary-light text-primary border-primary/30 shadow-xs'
            : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface hover:text-text-primary'
        }`}
      >
        <Paperclip className="w-3.5 h-3.5" />
        <span>Attach Context</span>
        {selectedContexts.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-mono flex items-center justify-center font-bold">
            {selectedContexts.length}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-surface border border-border rounded-2xl p-2.5 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95 text-xs">
          <div className="flex items-center justify-between pb-1.5 px-2 border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>Attach Learning Context</span>
            {selectedContexts.length > 0 && (
              <button
                type="button"
                onClick={onClearContexts}
                className="text-rose-600 hover:underline capitalize font-normal"
              >
                Clear all
              </button>
            )}
          </div>

          {AVAILABLE_CONTEXTS.map((ctx) => {
            const isSelected = selectedContexts.includes(ctx);

            return (
              <button
                key={ctx}
                type="button"
                onClick={() => onToggleContext(ctx)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                }`}
              >
                <span>{ctx}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
