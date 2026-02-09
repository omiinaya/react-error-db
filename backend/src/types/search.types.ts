export interface SearchFilters {
  query?: string;
  applicationId?: string;
  categoryId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  hasSolutions?: boolean;
  sortBy?: 'relevance' | 'newest' | 'popular' | 'solutions';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  code: string;
  title: string;
  description?: string;
  severity: string;
  viewCount: number;
  application: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  solutions: Array<{
    id: string;
    solutionText: string;
    score: number;
    isVerified: boolean;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  }>;
  _count: {
    solutions: number;
  };
}

export interface SearchSuggestion {
  type: 'error' | 'popular' | 'application' | 'category';
  value: string;
  label: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters?: SearchFilters;
  resultCount: number;
  clickedResultId?: string;
  createdAt: Date;
}

export interface SearchAnalytics {
  query: string;
  normalizedQuery: string;
  filters?: SearchFilters;
  resultCount: number;
  userId?: string;
  searchDuration?: number;
  createdAt: Date;
}
