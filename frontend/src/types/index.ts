// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  children?: Category[];
  applicationCount?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
}

// Category Request Types
export interface CategoryRequest {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requestedById: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  requestedBy?: {
    id: string;
    username: string;
    displayName: string;
  };
  reviewedBy?: {
    id: string;
    username: string;
    displayName: string;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateCategoryRequestInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryRequestStatusInput {
  status: 'approved' | 'rejected';
  reason?: string;
}

// Application Types
export interface Application {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  categoryId: string;
  category?: Category;
  websiteUrl?: string;
  errorCount: number;
}

export interface CreateApplicationRequest {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  categoryId: string;
  websiteUrl?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  categoryId?: string;
  websiteUrl?: string;
}

// Error Code Types
export interface ErrorCode {
  id: string;
  code: string;
  application: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    commonCauses?: string[];
    [key: string]: any;
  };
  viewCount: number;
  solutionCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ErrorCodeDetail extends ErrorCode {
  solutions: Solution[];
}

export interface CreateErrorCodeRequest {
  code: string;
  applicationId: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    commonCauses?: string[];
    [key: string]: any;
  };
}

// Solution Types
export interface Solution {
  id: string;
  solutionText: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  upvotes: number;
  downvotes: number;
  score: number;
  isVerified: boolean;
  userVote?: 'upvote' | 'downvote' | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSolutionRequest {
  solutionText: string;
}

export interface VoteRequest {
  voteType: 'upvote' | 'downvote';
}

// Search Types
export interface SearchResult {
  type: 'error' | 'application' | 'category';
  id: string;
  code?: string;
  title?: string;
  name?: string;
  description?: string;
  application?: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

// User Profile Types
export interface UserStats {
  solutionsSubmitted: number;
  solutionsVerified: number;
  totalUpvotes: number;
  totalDownvotes: number;
}

export interface UserProfile {
  user: User & {
    joinedAt: string;
    stats: UserStats;
  };
  recentSolutions: Solution[];
  topSolutions: Solution[];
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
}

// Filter Types
export interface ErrorFilters {
  applicationId?: string;
  search?: string;
  severity?: string;
  page?: number;
  limit?: number;
  sort?: 'views' | 'recent' | 'solutions';
}

export interface ApplicationFilters {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}