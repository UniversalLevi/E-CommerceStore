import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies (HttpOnly)
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      const isRetryable = 
        error.response?.status >= 500 && 
        error.response?.status < 600 &&
        error.response?.data?.retryable !== false &&
        retries > 0;

      if (!isRetryable) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, retries - 1, delay * 2);
    }
  }

  async get<T>(url: string) {
    return this.retryRequest(async () => {
      const response = await this.client.get<T>(url);
      return response.data;
    });
  }

  async post<T>(url: string, data?: any) {
    return this.retryRequest(async () => {
      const response = await this.client.post<T>(url, data);
      return response.data;
    });
  }

  async put<T>(url: string, data?: any) {
    return this.retryRequest(async () => {
      const response = await this.client.put<T>(url, data);
      return response.data;
    });
  }

  async delete<T>(url: string) {
    return this.retryRequest(async () => {
      const response = await this.client.delete<T>(url);
      return response.data;
    });
  }
}

export const api = new ApiClient();

