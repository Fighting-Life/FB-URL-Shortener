import type { RequestEvent } from '@sveltejs/kit';
import { ServerBase } from './server.js';

export class RequestService extends ServerBase implements ApiClient {
  private fetchFn: typeof fetch;
  private baseHeaders: HeadersInit;
  private baseUrl: string;

  constructor(
    protected readonly event: RequestEvent,
    baseHeaders: HeadersInit,
    baseUrl: string
  ) {
    super(event);
    this.fetchFn = this.event.fetch;
    this.baseUrl = baseUrl;
    this.baseHeaders = {
      'Content-Type': 'application/json',
      ...baseHeaders
    };
  }
  private buildUrl(
    url: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    if (!params) return fullUrl;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const paramString = searchParams.toString();
    return paramString ? `${fullUrl}?${paramString}` : fullUrl;
  }
  private async executeRequest<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, params, timeout = 30000, retries = 0 } = options;

    const finalUrl = this.buildUrl(url, params);
    const finalHeaders = { ...this.baseHeaders, ...headers };

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: finalHeaders,
      credentials: 'include'
    };

    // Handle body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type for FormData (browser sets it with boundary)
        delete (finalHeaders as any)['Content-Type'];
        requestOptions.body = body;
      } else if (typeof body === 'string') {
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Timeout wrapper
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        requestOptions.signal = controller.signal;

        const response = await this.fetchFn(finalUrl, requestOptions);
        clearTimeout(timeoutId);

        let jsonData: any;
        try {
          jsonData = await response.json();
        } catch {
          jsonData = { message: response.statusText };
        }

        const apiResponse: ApiResponse<T> = {
          status: response.status,
          success: response.ok,
          message: jsonData.message || response.statusText,
          data: jsonData.data || (response.ok ? jsonData : null),
          meta: jsonData.meta,
          error: !response.ok
            ? jsonData.error || {
              code: `HTTP_${response.status}`,
              message: jsonData.message || response.statusText
            }
            : undefined,
          headers: response.headers
        };

        return apiResponse;
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (error.name === 'AbortError' || attempt === retries) {
          break;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return {
      status: 0,
      success: false,
      message: lastError?.message || 'Network error',
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message || 'Failed to fetch',
        details: lastError
      }
    };
  }

  private headersToRecord(headers: Headers): Record<string, string> {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  async request<T = any>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, options);
  }
  async get<T = any>(
    url: string,
    options: Omit<FetchOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'GET' });
  }
  async post<T = any>(
    url: string,
    body?: any,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'POST', body });
  }
  async put<T = any>(
    url: string,
    body?: any,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'PUT', body });
  }
  async patch<T = any>(
    url: string,
    body?: any,
    options: Omit<FetchOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'PATCH', body });
  }
  async delete<T = any>(
    url: string,
    options: Omit<FetchOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'DELETE' });
  }
}
