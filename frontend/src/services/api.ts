import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n';
import {
  ApiResponse,
  ApiError,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  CreateErrorCodeRequest,
  CreateCategoryRequestInput,
  UpdateCategoryRequestStatusInput,
  CategoryRequest
} from '@/types';
import { useAuthStore } from '@/store/authStore';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (!response.data.success) {
          throw new Error(response.data.message || 'Request failed');
        }
        return response;
      },
      async (error: AxiosError<{ error?: ApiError }>) => {
        const responseData = error.response?.data;
        let message = 'An unexpected error occurred';
        
        // Handle validation errors with detailed field messages
        if (error.response?.status === 400 && responseData?.error?.code === 'VALIDATION_ERROR') {
          const validationErrors = responseData.error.details;
          if (validationErrors && validationErrors.length > 0) {
            // Map backend validation errors to i18n translation keys
            const firstError = validationErrors[0];
            console.log('DEBUG: Original validation error:', firstError);
            message = this.mapValidationErrorToMessage(firstError);
            console.log('DEBUG: Mapped validation message:', message);
          } else {
            message = i18n.t('errors:validation.genericValidationError', { defaultValue: 'Validation failed' });
          }
        }
        // Handle other error types
        else if (responseData?.error?.message) {
          message = responseData.error.message;
        } else if (error.message) {
          message = error.message;
        }
        
        // Show error toast for non-401 errors with improved formatting
        if (error.response?.status !== 401) {
          // For validation errors, show a more user-friendly message
          if (error.response?.status === 400 && responseData?.error?.code === 'VALIDATION_ERROR') {
            toast.error(message, {
              duration: 5000, // Longer duration for validation errors
            });
          } else {
            toast.error(message);
          }
        }

        // Handle token expiration with automatic refresh
        if (error.response?.status === 401) {
          const originalRequest = error.config;
          
          if (!originalRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          // Check if this is a retry attempt to avoid infinite loops
          if ((originalRequest as any)._retry) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          // Try to refresh the token
          (originalRequest as any)._retry = true;
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (refreshToken) {
            try {
              const response = await axios.post(
                `${(import.meta as any).env?.VITE_API_BASE_URL || '/api'}/auth/refresh`,
                { refreshToken }
              );
              
              if (response.data.success) {
                const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Update auth store state with new tokens
                const authStore = useAuthStore.getState();
                authStore.setToken(newAccessToken);
                authStore.setRefreshToken(newRefreshToken);
                
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.client.request(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              console.error('Token refresh failed:', refreshError);
            }
          }
          
          // If refresh fails or no refresh token, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Map backend validation errors to i18n messages
  private mapValidationErrorToMessage(error: { field?: string; message: string; code?: string }): string {
    const { field, message, code } = error;
    
    // Map common validation error patterns to translation keys
    if (message.includes('must be at least') && message.includes('characters')) {
      const minMatch = message.match(/at least (\d+)/);
      const min = minMatch ? parseInt(minMatch[1]) : 10;
      
      if (field) {
        // For solutionText field, use the specific translation key
        if (field === 'solutionText') {
          return i18n.t('errors:validation.solutionTextTooSmall', {
            defaultValue: message
          });
        }
        
        return i18n.t('errors:validation.fieldTooShort', {
          field,
          min,
          defaultValue: `${field}: ${message}`
        });
      }
      return i18n.t('errors:validation.genericTooShort', {
        min,
        defaultValue: message
      });
    }
    
    if (message.includes('must be at most') && message.includes('characters')) {
      const maxMatch = message.match(/at most (\d+)/);
      const max = maxMatch ? parseInt(maxMatch[1]) : 10000;
      
      if (field) {
        // For solutionText field, use the specific translation key
        if (field === 'solutionText') {
          return i18n.t('errors:validation.solutionTextTooBig', {
            defaultValue: message
          });
        }
        
        return i18n.t('errors:validation.fieldTooLong', {
          field,
          max,
          defaultValue: `${field}: ${message}`
        });
      }
      return i18n.t('errors:validation.genericTooLong', {
        max,
        defaultValue: message
      });
    }
    
    if (message.includes('is required') || message.includes('cannot be empty')) {
      if (field) {
        return i18n.t('errors:validation.fieldRequired', {
          field,
          defaultValue: `${field} is required`
        });
      }
      return i18n.t('errors:validation.genericRequired', {
        defaultValue: message
      });
    }
    
    // Default: use the field context if available
    return field ? `${field}: ${message}` : message;
  }

  // Generic request method
  async request<T>(config: {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    url: string;
    data?: any;
    params?: any;
  }): Promise<T> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(data: { email: string; password: string }) {
    return this.request<{ user: any; token: string; refreshToken: string }>({
      method: 'post',
      url: '/auth/login',
      data,
    });
  }

  async register(data: { email: string; username: string; password: string; displayName: string }) {
    return this.request<{ user: any; token: string; refreshToken: string }>({
      method: 'post',
      url: '/auth/register',
      data,
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>({
      method: 'get',
      url: '/auth/me',
    });
  }

  // Categories endpoints
  async getCategories(params?: { parentId?: string; includeChildren?: boolean }) {
    return this.request<{ categories: any[] }>({
      method: 'get',
      url: '/categories',
      params,
    });
  }

  async getCategoryBySlug(slug: string) {
    return this.request<{ category: any }>({
      method: 'get',
      url: `/categories/${slug}`,
    });
  }

  async createCategory(data: CreateCategoryRequest) {
    return this.request<{ category: any }>({
      method: 'post',
      url: '/categories',
      data,
    });
  }

  async updateCategory(id: string, data: UpdateCategoryRequest) {
    return this.request<{ category: any }>({
      method: 'put',
      url: `/categories/${id}`,
      data,
    });
  }

  // Applications endpoints
  async getApplications(params?: { categoryId?: string; search?: string; page?: number; limit?: number }) {
    return this.request<{ applications: any[]; meta?: any }>({
      method: 'get',
      url: '/applications',
      params,
    });
  }

  async getApplicationBySlug(slug: string) {
    return this.request<{ application: any }>({
      method: 'get',
      url: `/applications/${slug}`,
    });
  }

  async createApplication(data: CreateApplicationRequest) {
    return this.request<{ application: any }>({
      method: 'post',
      url: '/applications',
      data,
    });
  }

  async updateApplication(id: string, data: UpdateApplicationRequest) {
    return this.request<{ application: any }>({
      method: 'put',
      url: `/applications/${id}`,
      data,
    });
  }

  // Error codes endpoints
  async searchErrors(params?: { applicationId?: string; search?: string; severity?: string; page?: number; limit?: number; sort?: string }) {
    return this.request<{ errors: any[]; meta?: any }>({
      method: 'get',
      url: '/errors',
      params,
    });
  }

  async getErrorById(id: string) {
    return this.request<{ error: any; solutions: any[] }>({
      method: 'get',
      url: `/errors/${id}`,
    });
  }

  async createErrorCode(data: CreateErrorCodeRequest) {
    return this.request<{ error: any }>({
      method: 'post',
      url: '/errors',
      data,
    });
  }

  // Solutions endpoints
  async addSolution(errorId: string, data: { solutionText: string }) {
    return this.request<{ solution: any }>({
      method: 'post',
      url: `/errors/${errorId}/solutions`,
      data,
    });
  }

  async voteOnSolution(solutionId: string, data: { voteType: 'upvote' | 'downvote' }) {
    return this.request<{ solution: any }>({
      method: 'post',
      url: `/solutions/${solutionId}/vote`,
      data,
    });
  }

  async deleteSolution(solutionId: string) {
    return this.request<{ message: string }>({
      method: 'delete',
      url: `/solutions/${solutionId}`,
    });
  }

  // Search endpoint
  async globalSearch(params: { q: string; type?: string; page?: number; limit?: number }) {
    return this.request<{ results: any[] }>({
      method: 'get',
      url: '/search',
      params,
    });
  }

  // User endpoints
  async getUserProfile(userId: string) {
    return this.request<{ user: any; recentSolutions: any[]; topSolutions: any[] }>({
      method: 'get',
      url: `/users/${userId}`,
    });
  }

  async updateProfile(data: { displayName?: string; avatarUrl?: string }) {
    return this.request<{ user: any }>({
      method: 'put',
      url: '/users/me',
      data,
    });
  }

  // Theme endpoints
  async getThemePreference() {
    return this.request<{ themePreference: string }>({
      method: 'get',
      url: '/users/me/theme',
    });
  }

  async updateThemePreference(data: { themePreference: string }) {
    return this.request<{ themePreference: string }>({
      method: 'put',
      url: '/users/me/theme',
      data,
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<{ stats: any }>({
      method: 'get',
      url: '/admin/dashboard/stats',
    });
  }

  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    return this.request<{ users: any[]; pagination: any }>({
      method: 'get',
      url: '/admin/users',
      params,
    });
  }

  async getAdminSolutions(params?: { page?: number; limit?: number; status?: string }) {
    return this.request<{ solutions: any[]; pagination: any }>({
      method: 'get',
      url: '/admin/solutions/moderation',
      params,
    });
  }

  async bulkModerateSolutions(data: { solutionIds: string[]; action: string }) {
    return this.request<{ count: number; message: string }>({
      method: 'post',
      url: '/admin/solutions/bulk-moderation',
      data,
    });
  }

  async getAdminApplications() {
    return this.request<{ applications: any[] }>({
      method: 'get',
      url: '/admin/applications/stats',
    });
  }

  async getAdminLogs(params?: { page?: number; limit?: number; search?: string; level?: string }) {
    return this.request<{ logs: any[]; pagination: any }>({
      method: 'get',
      url: '/admin/system/logs',
      params,
    });
  }

  async exportData(type: string, format: string = 'json') {
    return this.request<any>({
      method: 'get',
      url: `/admin/export/${type}`,
      params: { format },
    });
  }

  // Category Request endpoints
  async createCategoryRequest(data: CreateCategoryRequestInput) {
    return this.request<{ categoryRequest: CategoryRequest }>({
      method: 'post',
      url: '/category-requests',
      data,
    });
  }

  async getCategoryRequests(params?: { status?: string; userId?: string; search?: string; page?: number; limit?: number }) {
    return this.request<{ categoryRequests: CategoryRequest[]; meta?: any }>({
      method: 'get',
      url: '/category-requests',
      params,
    });
  }

  async getUserCategoryRequests() {
    return this.request<{ categoryRequests: CategoryRequest[] }>({
      method: 'get',
      url: '/category-requests/user',
    });
  }

  async getCategoryRequestById(id: string) {
    return this.request<{ categoryRequest: CategoryRequest }>({
      method: 'get',
      url: `/category-requests/${id}`,
    });
  }

  async updateCategoryRequestStatus(id: string, data: UpdateCategoryRequestStatusInput) {
    return this.request<{ categoryRequest: CategoryRequest; createdCategory?: any }>({
      method: 'put',
      url: `/category-requests/${id}/status`,
      data,
    });
  }
}

export const api = new ApiClient();