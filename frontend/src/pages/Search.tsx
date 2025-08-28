import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, X, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { ErrorCode, Application } from '@/types';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [applicationFilter, setApplicationFilter] = useState(searchParams.get('application') || 'all');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');

  // Fetch applications for filter dropdown
  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await api.getApplications();
      return response.applications;
    },
  });

  // Fetch search results
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search-errors', searchQuery, applicationFilter, severityFilter, sortBy],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (applicationFilter && applicationFilter !== 'all') params.applicationId = applicationFilter;
      if (severityFilter) params.severity = severityFilter;
      if (sortBy) params.sort = sortBy;
      
      const response = await api.searchErrors(params);
      return response;
    },
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (applicationFilter && applicationFilter !== 'all') params.set('application', applicationFilter);
    if (severityFilter) params.set('severity', severityFilter);
    if (sortBy) params.set('sort', sortBy);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setApplicationFilter('');
    setSeverityFilter('');
    setSortBy('recent');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || applicationFilter || severityFilter || sortBy !== 'recent';

  useEffect(() => {
    updateSearchParams();
  }, [applicationFilter, severityFilter, sortBy]);

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'solutions', label: 'Most Solutions' },
  ];

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Error Codes</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by error code, title, or description..."
                className="pl-10 pr-4 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={applicationFilter} onValueChange={setApplicationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Applications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                {applications?.map((app: Application) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            <>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">Error loading search results. Please try again.</p>
              </CardContent>
            </Card>
          ) : searchResults?.errors?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No error codes found matching your criteria.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters and try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Found {searchResults?.meta?.pagination?.total || searchResults?.errors?.length || 0} results
              </div>
              
              {searchResults?.errors?.map((error: ErrorCode) => (
                <Card key={error.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{error.application.name}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {error.viewCount.toLocaleString()} views
                      </div>
                    </div>
                    <CardTitle className="text-xl">
                      <Link 
                        to={`/error/${error.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {error.code}: {error.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {error.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        error.severity === 'high' || error.severity === 'critical' 
                          ? 'destructive' 
                          : error.severity === 'medium'
                          ? 'default'
                          : 'outline'
                      }>
                        {error.severity}
                      </Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{error.solutionCount} solutions</span>
                        <span>•</span>
                        <span>{new Date(error.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;