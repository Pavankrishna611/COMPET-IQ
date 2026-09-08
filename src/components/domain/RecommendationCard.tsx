import React from 'react';
import { cn } from '@/lib/utils';
import { Recommendation } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction?: (rec: Recommendation) => void;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  onAction,
  className,
}: RecommendationCardProps) {
  return (
    <Card hoverable className={cn('p-5 flex flex-col justify-between', className)}>
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {recommendation.isAiGenerated && (
              <Badge variant="ai" size="sm" withDot>
                <Sparkles className="w-3 h-3 text-ai-purple mr-0.5 inline" />
                AI Curated
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              {recommendation.type.toUpperCase()}
            </Badge>
          </div>
          <span className="text-xs font-bold text-teal bg-teal-light px-2 py-0.5 rounded">
            {recommendation.score}% Fit
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-text-primary mb-1.5 leading-snug">
          {recommendation.title}
        </h4>

        {/* Rationale */}
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
          {recommendation.rationale}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {recommendation.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-[#F0F4F8] text-text-secondary px-2 py-0.5 rounded font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="pt-3 border-t border-border-light flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium truncate max-w-[180px]">
          Target: {recommendation.competencyName}
        </span>
        <Button
          size="sm"
          variant="primary"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => onAction?.(recommendation)}
        >
          Explore
        </Button>
      </div>
    </Card>
  );
}
