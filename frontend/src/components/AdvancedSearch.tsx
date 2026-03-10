import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'react-hot-toast';

interface SearchFilters {
  applicationId?: string;
  categoryId?: string;
  severity?: string;
  hasSolutions?: boolean;
  sortBy?: string;
}

interface SearchSuggestion {
  type: 'error' | 'popular' | 'application' | 'category';
  value: string;
  label: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  filters?: SearchFilters;
  resultCount: number;
  createdAt: string;
}

export function AdvancedSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    totalCount: 0,
  });

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      const response = await api.getSearchSuggestions(searchQuery, 5);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const response = await api.getSearchHistory(10);
      setSearchHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const performSearch = async (page: number = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await api.advancedSearch({
        query,
        ...filters,
        page,
        limit: pagination.limit,
      });

      setResults(response.errors || []);
      setPagination({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
      });

      // Update URL
      const params = new URLSearchParams();
      params.set('q', query);
      if (page > 1) params.set('page', page.toString());
      setSearchParams(params);

      // Refresh search history
      loadSearchHistory();
    } catch (error) {
      toast.error('Failed to perform search');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  const clearSearchHistory = async () => {
    try {
      await api.clearSearchHistory();
      setSearchHistory([]);
      toast.success('Search history cleared');
    } catch (error) {
      toast.error('Failed to clear search history');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    performSearch();
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    if (item.filters) {
      setFilters(item.filters);
    }
    performSearch();
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search error codes, titles, or descriptions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50">
                <CardContent className="p-2">
                  {suggestions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Suggestions
                      </h4>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-sm flex items-center gap-2"
                        >
                          <Search className="h-3 w-3" />
                          <span>{suggestion.label}</span>
                          {suggestion.type === 'popular' && (
                            <TrendingUp className="h-3 w-3 text-muted-foreground ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Recent Searches
                        </h4>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                      {searchHistory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleHistoryClick(item)}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-sm flex items-center gap-2"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1 truncate">{item.query}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.resultCount} results
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <Button onClick={() => performSearch()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.severity}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, severity: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, sortBy: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="solutions">Most Solutions</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.hasSolutions?.toString()}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                hasSolutions: value === 'true' ? true : value === 'false' ? false : undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Has Solutions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.totalCount} results found
            </p>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performSearch(pagination.page - 1)}
                >
                  Previous
                </Button>
              )}
              {pagination.page < pagination.totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performSearch(pagination.page + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </div>

          {results.map((error) => (
            <Card
              key={error.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/errors/${error.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {error.application?.name}: {error.code}
                      </h3>
                      <Badge variant={getSeverityVariant(error.severity)}>
                        {error.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {error.title}
                    </p>
                    {error.description && (
                      <p className="text-sm line-clamp-2">{error.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{error._count?.solutions || 0} solutions</span>
                      <span>{error.viewCount} views</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
}

function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'default';
    default:
      return 'outline';
  }
}
