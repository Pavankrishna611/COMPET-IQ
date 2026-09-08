/**
 * Quiz Attempt, Answer Persistence, and Grading API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  QuizActiveResponse,
  QuizResultResponse,
  QuizStartResponse,
  UserAttemptHistoryItem,
} from '@/types/api';

class QuizService {
  /**
   * Start a new assessment attempt or resume an active session.
   * Returns learner-safe questions (correct answers are securely withheld).
   */
  async startQuiz(assessmentId: string): Promise<QuizStartResponse> {
    return apiClient.post<QuizStartResponse>(`/quiz/${assessmentId}/start`);
  }

  /**
   * Fetch active in-progress quiz session and already saved answers.
   */
  async getActiveQuiz(attemptId: string): Promise<QuizActiveResponse> {
    return apiClient.get<QuizActiveResponse>(`/quiz/attempts/${attemptId}`);
  }

  /**
   * Save or update an answer selection for a specific question.
   */
  async saveAnswer(attemptId: string, questionId: string, selectedOption: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/quiz/attempts/${attemptId}/answer`, {
      question_id: questionId,
      selected_option: selectedOption,
    });
  }

  /**
   * Submit quiz attempt for automatic scoring and competency updates.
   */
  async submitQuiz(attemptId: string, submittedAnswers?: Record<string, string>): Promise<QuizResultResponse> {
    const payload = submittedAnswers ? { answers: submittedAnswers } : undefined;
    return apiClient.post<QuizResultResponse>(`/quiz/attempts/${attemptId}/submit`, payload);
  }

  /**
   * Fetch evaluated quiz result, percentage, competency impact, and unlocked question reviews.
   */
  async getQuizResult(attemptId: string): Promise<QuizResultResponse> {
    return apiClient.get<QuizResultResponse>(`/quiz/attempts/${attemptId}/result`);
  }

  /**
   * Fetch user's assessment attempt history.
   */
  async getMyAttempts(params?: { status?: string; assessment_id?: string }): Promise<UserAttemptHistoryItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.assessment_id) query.set('assessment_id', params.assessment_id);

    const qs = query.toString();
    const endpoint = qs ? `/quiz/my-attempts?${qs}` : '/quiz/my-attempts';
    return apiClient.get<UserAttemptHistoryItem[]>(endpoint);
  }
}

export const quizService = new QuizService();
