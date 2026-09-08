'use client';

import React from 'react';
import { SourceReference } from '@/data/assistant';
import { BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface SourceReferenceCardProps {
  source: SourceReference;
}

export function SourceReferenceCard({ source }: SourceReferenceCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-xs hover:border-primary/40 transition-all text-xs flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            <BookOpen className="w-3 h-3 text-primary" />
            <span className="truncate">{source.sourceType}</span>
          </div>

          <span className="text-[10px] font-mono font-bold text-teal bg-teal-light/60 px-2 py-0.5 rounded-full border border-teal/20 shrink-0">
            {source.relevanceScore}% Match
          </span>
        </div>

        <h5 className="font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {source.documentTitle}
        </h5>

        <p className="text-[11px] text-text-secondary line-clamp-1">
          {source.module}
        </p>

        {source.chunkReference && (
          <p className="text-[10px] text-text-muted italic truncate mt-1">
            Ref: {source.chunkReference}
          </p>
        )}
      </div>

      <div className="pt-2 mt-2 border-t border-border-light flex items-center justify-between text-[10px] text-text-muted">
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          Verified MoSPI Source
        </span>
        <span className="group-hover:text-primary transition-colors flex items-center gap-0.5">
          <span>Inspect Chunk</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}
