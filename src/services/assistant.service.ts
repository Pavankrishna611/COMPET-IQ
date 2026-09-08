/**
 * RAG-Based AI Learning Assistant API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  AssistantResponse,
  ConversationDetailResponse,
  ConversationResponse,
} from '@/types/api';

class AssistantService {
  /**
   * Submit learner question to RAG Assistant for grounded pedagogical response.
   */
  async chat(message: string, conversationId?: string): Promise<AssistantResponse> {
    return apiClient.post<AssistantResponse>('/assistant/chat', {
      message,
      conversation_id: conversationId || null,
    });
  }

  /**
   * Fetch user's active conversation threads.
   */
  async getConversations(): Promise<ConversationResponse[]> {
    return apiClient.get<ConversationResponse[]>('/assistant/conversations');
  }

  /**
   * Fetch full conversation transcript with cited sources.
   */
  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    return apiClient.get<ConversationDetailResponse>(`/assistant/conversations/${conversationId}`);
  }

  /**
   * Delete conversation thread.
   */
  async deleteConversation(conversationId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/assistant/conversations/${conversationId}`);
  }
}

export const assistantApiService = new AssistantService();
