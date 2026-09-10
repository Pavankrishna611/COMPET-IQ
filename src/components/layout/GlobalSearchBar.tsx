'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  BookOpen,
  Target,
  FileCheck2,
  Route,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { searchService } from '@/services/search.service';
import { SearchResultItem } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearchBar({
  className,
  placeholder = 'Search courses, competencies, assessments...',
}: GlobalSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Perform backend search with debounce
  const executeSearch = useCallback(
    async (searchTerm: string, category: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        setCategoryCounts({});
        setIsLoading(false);
        setHasSearched(false);
        setSearchError(null);
        return;
      }

      try {
        setIsLoading(true);
        setSearchError(null);
        const res = await searchService.search(trimmed, {
          category: category === 'all' ? undefined : category,
          limit: 15,
        });
        setResults(res.results || []);
        setCategoryCounts(res.category_counts || {});
        setHasSearched(true);
      } catch (err: any) {
        console.warn('Search request error:', err);
        setSearchError('Search is temporarily unavailable.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, selectedCategory);
    }, 250);
  };

  // Handle category tab changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setActiveIndex(-1);
    if (query.trim().length >= 2) {
      executeSearch(query, cat);
    }
  };

  // Clear query
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // Navigate to result
  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(item.url);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && query.trim().length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectResult(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      } else if (query.trim().length > 0) {
        // Fallback: navigate to courses page with query
        setIsOpen(false);
        router.push(`/learner/courses?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course':
        return <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />;
      case 'competency':
        return <Target className="w-3.5 h-3.5 text-teal shrink-0" />;
      case 'assessment':
        return <FileCheck2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'learning_path':
        return <Route className="w-3.5 h-3.5 text-ai-purple shrink-0" />;
      case 'material':
      default:
        return <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />;
    }
  };

  // Category Badge variant helper
  const getCategoryBadgeVariant = (category: string): 'info' | 'teal' | 'warning' | 'ai' | 'neutral' => {
    switch (category) {
      case 'course':
        return 'info';
      case 'competency':
        return 'teal';
      case 'assessment':
        return 'warning';
      case 'learning_path':
        return 'ai';
      default:
        return 'neutral';
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'course', label: 'Courses', count: categoryCounts['course'] },
    { id: 'competency', label: 'Competencies', count: categoryCounts['competency'] },
    { id: 'assessment', label: 'Assessments', count: categoryCounts['assessment'] },
    { id: 'learning_path', label: 'Paths', count: categoryCounts['learning_path'] },
  ];

  return (
    <div ref={containerRef} className={cn('relative w-56 md:w-64 lg:w-72', className)}>
      {/* Input container */}
      <div className="relative flex items-center w-full">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-primary absolute left-2.5 animate-spin pointer-events-none" />
        ) : (
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Global Search"
          autoComplete="off"
          className="w-full h-8 pl-8 pr-7 text-xs bg-[#F5F8FC] border border-border rounded-btn text-text-primary placeholder:text-text-muted/80 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="absolute right-2 text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-w-[90vw] rounded-panel bg-surface border border-border shadow-modal z-50 overflow-hidden animate-in fade-in duration-100">
          {/* Category Filter Pills (if results or searched) */}
          {hasSearched && results.length > 0 && (
            <div className="p-2 border-b border-border-light bg-[#F9FBFC] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    'px-2 py-0.5 rounded-full font-medium transition-colors shrink-0',
                    selectedCategory === cat.id
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'bg-surface text-text-secondary border border-border hover:bg-[#F0F4F8]'
                  )}
                >
                  {cat.label}
                  {cat.count !== undefined && cat.count > 0 && ` (${cat.count})`}
                </button>
              ))}
            </div>
          )}

          {/* Results List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border-light">
            {isLoading && results.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Searching platform...</span>
              </div>
            ) : searchError ? (
              <div className="p-5 text-center text-xs text-text-muted">
                <p className="text-critical font-medium mb-1">Unable to load results</p>
                <p>{searchError}</p>
              </div>
            ) : results.length === 0 && hasSearched ? (
              <div className="p-6 text-center text-xs text-text-muted">
                <p className="font-semibold text-text-primary mb-1">
                  No matching results found
                </p>
                <p className="text-[11px]">
                  No items matched &ldquo;<span className="font-mono text-primary">{query}</span>&rdquo;. Try searching for &ldquo;python&rdquo;, &ldquo;statistical&rdquo;, &ldquo;data&rdquo;, or &ldquo;survey&rdquo;.
                </p>
              </div>
            ) : (
              results.map((item, idx) => (
                <div
                  key={`${item.category}-${item.id}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    'p-3 flex items-start gap-2.5 transition-colors cursor-pointer text-left',
                    activeIndex === idx
                      ? 'bg-primary-light/40 border-l-2 border-primary pl-2.5'
                      : 'hover:bg-[#F5F8FC]'
                  )}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-btn bg-[#F0F4F8]">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-text-primary truncate">
                        {item.title}
                      </span>
                      <Badge
                        variant={getCategoryBadgeVariant(item.category)}
                        size="sm"
                        className="shrink-0 text-[9px] uppercase tracking-wider"
                      >
                        {item.category_label}
                      </Badge>
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-text-secondary truncate leading-tight">
                        {item.subtitle}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>

          {/* Footer with keyboard hint */}
          {results.length > 0 && (
            <div className="p-2 px-3 border-t border-border-light bg-[#F9FBFC] flex items-center justify-between text-[10px] text-text-muted">
              <span>
                {results.length} {results.length === 1 ? 'match' : 'matches'} found
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span>↑↓</span> navigate <span className="ml-1">↵</span> select <span className="ml-1">esc</span> close
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
