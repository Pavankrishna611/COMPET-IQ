'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ContextSelector } from './ContextSelector';
import { Send, Sparkles, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string, attachedContext: string[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['Current Competency Profile']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleToggleContext = (ctx: string) => {
    setSelectedContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };

  const handleRemoveContext = (ctx: string) => {
    setSelectedContexts((prev) => prev.filter((c) => c !== ctx));
  };

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim(), selectedContexts);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2 bg-surface border border-border rounded-2xl p-3 shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      {/* Attached Context Chips */}
      {selectedContexts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-1">
            Attached Context:
          </span>
          {selectedContexts.map((ctx) => (
            <span
              key={ctx}
              className="text-[10px] font-medium bg-primary-light text-primary border border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in"
            >
              <Paperclip className="w-2.5 h-2.5" />
              <span>{ctx}</span>
              <button
                type="button"
                onClick={() => handleRemoveContext(ctx)}
                className="hover:text-primary-hover p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about a competency, concept, assessment or learning path... (Shift+Enter for newline)"
        disabled={isLoading}
        className="w-full px-2 py-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none scrollbar-none"
      />

      {/* Bottom Bar: Context Selector + Send CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-border-light">
        <ContextSelector
          selectedContexts={selectedContexts}
          onToggleContext={handleToggleContext}
          onClearContexts={() => setSelectedContexts([])}
        />

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted hidden sm:inline">
            Press <strong>Enter ↵</strong> to send
          </span>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
