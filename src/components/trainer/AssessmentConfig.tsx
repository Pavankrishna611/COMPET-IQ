'use client';

import React from 'react';
import { Sliders, BrainCircuit, Globe, Layers, BarChart3 } from 'lucide-react';

export interface GeneratorConfigState {
  questionsCount: 5 | 10 | 15 | 20;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  questionType: 'MCQ' | 'Scenario Based' | 'Mixed';
  language: 'English' | 'Hindi' | 'Telugu';
  competency: string;
}

interface AssessmentConfigProps {
  config: GeneratorConfigState;
  onChange: (newConfig: GeneratorConfigState) => void;
  disabled?: boolean;
}

const COMPETENCY_OPTIONS = [
  'Python',
  'SQL',
  'Data Visualization',
  'GIS',
  'Statistical Methods',
  'Sampling Techniques',
  'Data Quality',
  'AI / ML',
];

export function AssessmentConfig({ config, onChange, disabled = false }: AssessmentConfigProps) {
  const updateField = <K extends keyof GeneratorConfigState>(key: K, value: GeneratorConfigState[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border-light pb-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          Assessment Configuration
        </h3>
        <span className="text-[11px] text-text-muted">NSSTA Blueprint Parameters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Competency Dropdown */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            Target Competency Area
          </label>
          <select
            value={config.competency}
            onChange={(e) => updateField('competency', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
          >
            {COMPETENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Number of Questions */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Number of Questions
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {([5, 10, 15, 20] as const).map((count) => {
              const isSelected = config.questionsCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateField('questionsCount', count)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-elevated text-text-secondary border-border hover:border-primary/40'
                  } disabled:opacity-50`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Difficulty Level
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map((diff) => {
              const isSelected = config.difficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateField('difficulty', diff)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-elevated text-text-secondary border-border hover:border-primary/40'
                  } disabled:opacity-50`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            Question Format
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['MCQ', 'Scenario Based', 'Mixed'] as const).map((qType) => {
              const isSelected = config.questionType === qType;
              return (
                <button
                  key={qType}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateField('questionType', qType)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                    isSelected
                      ? 'bg-teal text-white border-teal shadow-xs'
                      : 'bg-surface-elevated text-text-secondary border-border hover:border-primary/40'
                  } disabled:opacity-50`}
                >
                  {qType}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            Assessment Language
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['English', 'Hindi', 'Telugu'] as const).map((lang) => {
              const isSelected = config.language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateField('language', lang)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-elevated text-text-secondary border-border hover:border-primary/40'
                  } disabled:opacity-50`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
