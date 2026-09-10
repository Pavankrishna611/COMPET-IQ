/**
 * Centralized Typed API Client
 * Manages HTTP requests, bearer token injection, timeout handling, and uniform error formatting.
 */

import { API_BASE_URL, APP_CONFIG } from './config';
import { authStorage } from './auth-storage';

export class ApiError extends Error {
  status: number;
  detail?: any;
  isNetworkError: boolean;

  constructor(message: string, status: number = 500, detail?: any, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetworkError = isNetworkError;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private getCleanUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If endpoint already includes /api/v1, append to baseUrl directly
    if (cleanEndpoint.startsWith('/api/')) {
      return `${this.baseUrl}${cleanEndpoint}`;
    }
    return `${this.baseUrl}/api/v1${cleanEndpoint}`;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.getCleanUrl(endpoint);
    const timeoutMs = options.timeoutMs ?? APP_CONFIG.requestTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(options.headers || {});
    if (!options.skipAuth) {
      const token = authStorage.getToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Default to JSON unless body is FormData
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle common HTTP error statuses
      if (!response.ok) {
        let errorDetail: any = null;
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const jsonError = await response.json();
          errorDetail = jsonError;
          if (jsonError.error?.message) {
            errorMessage = jsonError.error.message;
          } else if (jsonError.detail) {
            errorMessage = typeof jsonError.detail === 'string'
              ? jsonError.detail
              : JSON.stringify(jsonError.detail);
          } else if (jsonError.message) {
            errorMessage = jsonError.message;
          }
        } catch {
          // If response body is non-JSON
        }

        if (response.status === 400) {
          throw new ApiError(
            errorMessage || 'Invalid request parameters. Please verify your input.',
            400,
            errorDetail
          );
        }

        if (response.status === 401) {
          // Invalidate session on unauthorized
          authStorage.clearAuth();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          const message = endpoint.includes('/auth/login')
            ? (errorMessage || 'Incorrect official ID, email, or password.')
            : (errorMessage || 'Your session has expired. Please sign in again.');
          throw new ApiError(message, 401, errorDetail);
        }

        if (response.status === 403) {
          throw new ApiError(
            errorMessage || 'Access restricted: You do not have permission for this resource.',
            403,
            errorDetail
          );
        }

        if (response.status === 404) {
          throw new ApiError(errorMessage || 'The requested resource was not found.', 404, errorDetail);
        }

        if (response.status === 422) {
          throw new ApiError(
            errorMessage || 'Validation error: Please check your submitted information.',
            422,
            errorDetail
          );
        }

        if (response.status >= 500) {
          const isGatewayError = response.status === 502 || response.status === 503 || response.status === 504;
          throw new ApiError(
            isGatewayError
              ? 'The COMPETIQ service is temporarily unavailable. Please retry in a few moments.'
              : (errorMessage || 'An unexpected internal server error occurred.'),
            response.status,
            errorDetail
          );
        }

        throw new ApiError(errorMessage, response.status, errorDetail);
      }

      // 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timer);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out while connecting to COMPETIQ services.', 408, null, true);
      }

      // Network unreachable
      throw new ApiError(
        'Unable to connect to the COMPETIQ backend. Please check that the server is running.',
        0,
        err,
        true
      );
    }
  }

  // Convenience Methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
