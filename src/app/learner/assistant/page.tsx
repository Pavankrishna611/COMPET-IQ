'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ConversationSidebar,
  LearningContextPanel,
  ChatMessageItem,
  ChatInput,
  AssistantLoadingState,
} from '@/components/assistant';
import {
  mockConversations,
  mockSuggestedPrompts,
  mockLearnerContext,
  ConversationThread,
  ChatMessage,
} from '@/data/assistant';
import { assistantService } from '@/lib/assistantService';
import {
  Bot,
  Sparkles,
  RotateCcw,
  Download,
  Trash2,
  Plus,
  Compass,
  MessagesSquare,
  ShieldCheck,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

export default function LearnerAssistantPage() {
  // Conversation threads stored in local state
  const [conversations, setConversations] = useState<ConversationThread[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(mockConversations[0].id);

  // Layout panel toggles for responsive viewports
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  // Handle sending a message
  const handleSendMessage = async (text: string, attachedContext: string[] = []) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedContext,
    };

    // Append user message immediately
    setConversations((prev) =>
      prev.map((thread) => {
        if (thread.id === activeConversationId) {
          return {
            ...thread,
            lastMessagePreview: text,
            updatedAt: new Date().toISOString(),
            messages: [...thread.messages, userMessage],
          };
        }
        return thread;
      })
    );

    setIsLoading(true);

    try {
      // Query future-ready AssistantService abstraction
      const aiResponse = await assistantService.sendMessage(text, {
        attachedContext,
        role: mockLearnerContext.role,
        department: mockLearnerContext.department,
      });

      const assistantMessage: ChatMessage = {
        id: `msg-a-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredResponse: aiResponse,
      };

      setConversations((prev) =>
        prev.map((thread) => {
          if (thread.id === activeConversationId) {
            return {
              ...thread,
              updatedAt: new Date().toISOString(),
              messages: [...thread.messages, assistantMessage],
            };
          }
          return thread;
        })
      );
    } catch (err) {
      showToast('Error communicating with assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh conversation
  const handleNewConversation = () => {
    const newThreadId = `conv-${Date.now()}`;
    const newThread: ConversationThread = {
      id: newThreadId,
      title: 'New Consultation',
      lastMessagePreview: 'Started a new session',
      dateLabel: 'Just now',
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setConversations((prev) => [newThread, ...prev]);
    setActiveConversationId(newThreadId);
    showToast('Started new consultation thread.');
  };

  // Clear current active conversation messages
  const handleClearConversation = () => {
    setConversations((prev) =>
      prev.map((thread) => {
        if (thread.id === activeConversationId) {
          return {
            ...thread,
            messages: [],
            lastMessagePreview: 'Conversation cleared',
          };
        }
        return thread;
      })
    );
    showToast('Conversation cleared.');
  };

  // Export current conversation
  const handleExportConversation = () => {
    if (!activeThread || activeThread.messages.length === 0) {
      showToast('No messages to export in current consultation.');
      return;
    }

    const transcript = activeThread.messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.structuredResponse ? m.structuredResponse.answer : m.text
          }\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COMPETIQ_Consultation_${activeThread.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Conversation export prepared and downloaded.');
  };

  return (
    <AppShell
      title="Learning Assistant"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'AI Assistant' },
      ]}
      defaultRole="learner"
    >
      <div className="max-w-7xl mx-auto pb-6 space-y-4">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar for Responsive Panels */}
        <div className="flex items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="text-xs h-8 text-text-secondary hidden md:flex"
              title={showLeftSidebar ? 'Collapse Conversations' : 'Expand Conversations'}
            >
              {showLeftSidebar ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
              <span className="ml-1.5 hidden lg:inline">History</span>
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                Learning Intelligence Active
              </Badge>
              <Badge variant="neutral" size="sm" className="font-mono text-[10px] hidden sm:inline-flex">
                RAG Grounded Intelligence
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs h-8 text-primary font-semibold"
            >
              New Chat
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-xs h-8 text-text-secondary hover:text-rose-600 hidden sm:inline-flex"
            >
              Clear
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportConversation}
              leftIcon={<Download className="w-3.5 h-3.5 text-text-muted" />}
              className="text-xs h-8 font-semibold"
            >
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="text-xs h-8 text-text-secondary hidden xl:flex"
              title={showRightSidebar ? 'Collapse Context Panel' : 'Expand Context Panel'}
            >
              <span className="mr-1.5">Context</span>
              {showRightSidebar ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Three-Panel Main Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start h-[calc(100vh-210px)] min-h-[640px]">
          {/* Left Panel: Conversation History */}
          {showLeftSidebar && (
            <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full rounded-2xl overflow-hidden border border-border bg-surface shadow-xs">
              <ConversationSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
                onNewConversation={handleNewConversation}
              />
            </div>
          )}

          {/* Center Panel: Main AI Conversation */}
          <div
            className={`col-span-12 flex flex-col h-full bg-surface border border-border rounded-2xl shadow-xs overflow-hidden ${showLeftSidebar && showRightSidebar
              ? 'md:col-span-8 lg:col-span-6 xl:col-span-6'
              : showLeftSidebar && !showRightSidebar
                ? 'md:col-span-8 lg:col-span-9'
                : !showLeftSidebar && showRightSidebar
                  ? 'md:col-span-8 lg:col-span-9 xl:col-span-9'
                  : 'md:col-span-12'
              }`}
          >
            {/* Conversation Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {activeThread.messages.length === 0 ? (
                /* PART M — Empty State */
                <div className="py-8 max-w-xl mx-auto text-center space-y-6 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-[#123B66] text-white flex items-center justify-center mx-auto shadow-md">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                      How can COMPETIQ help you learn today?
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                      Hello! I&apos;m your <strong>COMPETIQ Learning Assistant</strong>. I can help you understand statistical concepts, practice questions, explore competency gaps, summarize approved learning materials, and guide you through your personalized learning path.
                    </p>
                  </div>

                  {/* Suggested Prompts Grid */}
                  <div className="space-y-3 pt-2 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block text-center">
                      Suggested Inquiries Grounded in Your Profile
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mockSuggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="p-3 bg-surface-elevated/70 hover:bg-primary-light/50 border border-border hover:border-primary/40 rounded-xl text-xs font-medium text-text-secondary hover:text-primary transition-all text-left flex items-center justify-between gap-2 shadow-2xs group"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Message List */
                <div className="space-y-6">
                  {activeThread.messages.map((msg) => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      onFollowUpClick={(q) => handleSendMessage(q)}
                      onCopyNotice={showToast}
                    />
                  ))}

                  {/* Progressive Loading State */}
                  {isLoading && <AssistantLoadingState />}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Input Area & AI Reliability Note */}
            <div className="p-3.5 bg-surface border-t border-border-light space-y-2 shrink-0">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />

              {/* PART N — AI Safety / Reliability Note */}
              <p className="text-[11px] text-text-muted text-center leading-snug px-4">
                COMPETIQ responses are designed to be grounded in approved learning materials. Always verify important professional decisions using official sources.
              </p>
            </div>
          </div>

          {/* Right Panel: Learning Context */}
          {showRightSidebar && (
            <div className="col-span-12 lg:col-span-3 xl:col-span-3 h-full rounded-2xl overflow-hidden border border-border bg-surface shadow-xs hidden lg:block">
              <LearningContextPanel context={mockLearnerContext} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
