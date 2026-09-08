'use client';

import React from 'react';
import { ConversationThread } from '@/data/assistant';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Plus, MessagesSquare, Calendar, ChevronRight } from 'lucide-react';

interface ConversationSidebarProps {
  conversations: ConversationThread[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-border p-4 space-y-4">
      {/* Header & New Conversation Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Conversations
          </h3>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onNewConversation}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs h-7 px-2.5 font-semibold text-primary"
        >
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {conversations.map((thread) => {
          const isActive = activeConversationId === thread.id;

          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectConversation(thread.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all select-none ${
                isActive
                  ? 'bg-primary-light/60 border-primary/40 shadow-xs ring-1 ring-primary/20'
                  : 'bg-surface border-transparent hover:border-border hover:bg-surface-elevated/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-primary' : 'text-text-muted'
                    }`}
                  />
                  <span
                    className={`text-xs truncate ${
                      isActive ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary'
                    }`}
                  >
                    {thread.title}
                  </span>
                </div>

                <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                  {thread.dateLabel}
                </span>
              </div>

              <p className="text-[11px] text-text-muted truncate pl-5">
                {thread.lastMessagePreview}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="pt-3 border-t border-border-light text-[10px] text-text-muted text-center">
        Sessions stored in local browser state
      </div>
    </div>
  );
}
