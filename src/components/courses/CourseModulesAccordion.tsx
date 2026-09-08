'use client';

import React, { useState } from 'react';
import { CourseModuleItem } from '@/data/courses';
import { ChevronDown, ChevronUp, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseModulesAccordionProps {
  modules: CourseModuleItem[];
  completedModuleCount?: number;
}

export function CourseModulesAccordion({
  modules,
  completedModuleCount = 0,
}: CourseModulesAccordionProps) {
  // Store set of open module ids
  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(
    new Set(modules.length > 0 ? [modules[0].id] : [])
  );

  const toggleModule = (id: string) => {
    setOpenModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenModuleIds(new Set(modules.map((m) => m.id)));
  };

  const collapseAll = () => {
    setOpenModuleIds(new Set());
  };

  const allExpanded = openModuleIds.size === modules.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header with expand/collapse control */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Curriculum & Modules
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {modules.length} modules • Complete curriculum structured for official statistical proficiency
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      {/* Accordion Modules List */}
      <div className="space-y-3">
        {modules.map((module, idx) => {
          const isOpen = openModuleIds.has(module.id);
          const isCompleted = idx < completedModuleCount;

          return (
            <div
              key={module.id}
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : isOpen
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{module.moduleNumber}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      Module {module.moduleNumber}: {module.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{module.duration}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-indigo-100/60 dark:border-indigo-900/30">
                  <p className="mt-2 text-slate-700 dark:text-slate-300">{module.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
