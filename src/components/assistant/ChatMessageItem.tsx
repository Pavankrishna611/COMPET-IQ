'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChatMessage } from '@/data/assistant';
import { SourceReferenceCard } from './SourceReferenceCard';
import { RelatedCompetencyCard } from './RelatedCompetencyCard';
import { FollowUpQuestions } from './FollowUpQuestions';
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Paperclip,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ChatMessageItemProps {
  message: ChatMessage;
  onFollowUpClick?: (question: string) => void;
  onCopyNotice?: (text: string) => void;
}

export function ChatMessageItem({
  message,
  onFollowUpClick,
  onCopyNotice,
}: ChatMessageItemProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);

  const handleCopy = () => {
    let fullText = message.text;
    if (message.structuredResponse) {
      const resp = message.structuredResponse;
      const parts = [resp.answer];
      if (resp.keyPoints) parts.push('\nKey Points:\n' + resp.keyPoints.map((k) => `• ${k}`).join('\n'));
      if (resp.example) parts.push('\nExample:\n' + resp.example);
      fullText = parts.join('\n');
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    if (onCopyNotice) onCopyNotice('Response copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFeedback = (type: 'helpful' | 'unhelpful') => {
    setFeedback((prev) => (prev === type ? null : type));
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 max-w-2xl ml-auto animate-in fade-in duration-200">
        <div className="space-y-1.5 flex flex-col items-end">
          {/* Attached Context Pills */}
          {message.attachedContext && message.attachedContext.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {message.attachedContext.map((ctx, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-primary-light text-primary border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <Paperclip className="w-2.5 h-2.5" />
                  {ctx}
                </span>
              ))}
            </div>
          )}

          {/* User Bubble */}
          <div className="bg-[#123B66] text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm leading-relaxed max-w-xl">
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>

          <span className="text-[10px] font-mono text-text-muted">
            {message.timestamp}
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border text-text-primary flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      </div>
    );
  }

  // AI Message
  const resp = message.structuredResponse;

  return (
    <div className="flex items-start gap-3 max-w-3xl animate-in fade-in duration-200 group">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#123B66] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-4 flex-1 min-w-0">
        {/* Header meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary">
              COMPETIQ Learning Assistant
            </span>
            <Badge variant="teal" size="sm" className="font-mono text-[10px]">
              Grounded Guidance
            </Badge>
          </div>

          <span className="text-[10px] font-mono text-text-muted">
            {message.timestamp}
          </span>
        </div>

        {/* Message Content Container */}
        <div className="bg-surface border border-border rounded-2xl rounded-tl-xs p-5 shadow-xs space-y-4 text-xs sm:text-sm leading-relaxed text-text-primary">
          {/* Main Answer Paragraph */}
          <div className="space-y-2">
            <p className="whitespace-pre-wrap leading-relaxed text-text-primary">
              {resp ? resp.answer : message.text}
            </p>
          </div>

          {/* Key Ideas List */}
          {resp?.keyPoints && resp.keyPoints.length > 0 && (
            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border-light space-y-2 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-text-muted block">
                Key Conceptual Highlights
              </span>
              <ul className="space-y-1.5">
                {resp.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0 mt-1.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Real-World Official Example Callout */}
          {resp?.example && (
            <div className="p-3.5 bg-primary-light/40 border border-primary/20 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Info className="w-3.5 h-3.5" />
                <span>Practical MoSPI Implementation Example</span>
              </div>
              <p className="text-text-secondary leading-relaxed">
                {resp.example}
              </p>
            </div>
          )}

          {/* Recommendation Banner */}
          {resp?.recommendation && (
            <div className="p-3.5 bg-gradient-to-r from-teal-light/40 to-primary-light/30 border border-teal/20 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal block">
                  {resp.recommendation.title}
                </span>
                <span className="font-bold text-text-primary block">
                  {resp.recommendation.courseTitle}
                </span>
                <span className="text-[11px] text-text-muted">
                  Impact: {resp.recommendation.impact}
                </span>
              </div>

              <Link href={`/learner/courses/${resp.recommendation.courseId}`}>
                <Button
                  size="sm"
                  variant="teal"
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                  className="text-xs font-semibold h-8"
                >
                  View Course
                </Button>
              </Link>
            </div>
          )}

          {/* Related Competency Card */}
          {resp?.relatedCompetency && (
            <RelatedCompetencyCard competency={resp.relatedCompetency} />
          )}

          {/* RAG Sources Section */}
          {resp?.sources && resp.sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border-light">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-primary" />
                  Grounded Sources ({resp.sources.length})
                </span>
                <span className="text-[10px] text-text-muted">
                  Retrieved via Official Learning Catalog
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {resp.sources.map((src) => (
                  <SourceReferenceCard key={src.id} source={src} />
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {resp?.followUpQuestions && onFollowUpClick && (
            <FollowUpQuestions
              questions={resp.followUpQuestions}
              onSelect={onFollowUpClick}
            />
          )}

          {/* Chat Actions: Copy, Feedback Buttons */}
          <div className="pt-2 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
            <span className="text-[10px]">
              Grounded in MoSPI Capacity Building Framework
            </span>

            <div className="flex items-center gap-1">
              {/* Copy Action */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy response to clipboard"
                className="p-1.5 rounded-lg hover:bg-surface-elevated hover:text-text-primary transition-colors flex items-center gap-1 text-[11px]"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Feedback: Helpful */}
              <button
                type="button"
                onClick={() => handleFeedback('helpful')}
                title="Mark as helpful"
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${feedback === 'helpful'
                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
                  : 'hover:bg-surface-elevated hover:text-text-primary'
                  }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful</span>
              </button>

              {/* Feedback: Not Helpful */}
              <button
                type="button"
                onClick={() => handleFeedback('unhelpful')}
                title="Mark as unhelpful"
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${feedback === 'unhelpful'
                  ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 font-semibold'
                  : 'hover:bg-surface-elevated hover:text-text-primary'
                  }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
