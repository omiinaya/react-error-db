import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { ErrorCode, Application } from '@/types';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [applicationFilter, setApplicationFilter] = useState(searchParams.get('application') || 'all');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const { t } = useTranslation();

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
      if (severityFilter && severityFilter !== 'all') params.severity = severityFilter;
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
    if (severityFilter && severityFilter !== 'all') params.set('severity', severityFilter);
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
    { value: 'all', label: t('common:search.allSeverities') },
    { value: 'low', label: t('common:error.severity.low') },
    { value: 'medium', label: t('common:error.severity.medium') },
    { value: 'high', label: t('common:error.severity.high') },
    { value: 'critical', label: t('common:error.severity.critical') },
  ];

  const sortOptions = [
    { value: 'recent', label: t('errors:sort.recent') },
    { value: 'views', label: t('errors:sort.views') },
    { value: 'solutions', label: t('errors:sort.solutions') },
  ];

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('errors:search.title')}</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('errors:search.placeholder')}
                className="pl-10 pr-4 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {t('common:search.button')}
              </Button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('common:search.filters')}:</span>
            </div>

            <Select value={applicationFilter} onValueChange={setApplicationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('common:search.allApplications')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:search.allApplications')}</SelectItem>
                {applications?.map((app: Application) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('common:search.allSeverities')} />
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
                <SelectValue placeholder={t('common:search.sortBy')} />
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
                {t('common:search.clearFilters')}
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
                <p className="text-destructive">{t('common:errorLoading')}</p>
              </CardContent>
            </Card>
          ) : searchResults?.errors?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">{t('errors:search.noResults')}</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  {t('errors:search.clearAndTry')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {t('errors:search.results', { count: searchResults?.meta?.pagination?.total || searchResults?.errors?.length || 0 })}
              </div>
              
              {searchResults?.errors?.map((error: ErrorCode) => (
                <Card key={error.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {error.application.category ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {error.application.category.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                            {t('common:error.noCategory')}
                          </Badge>
                        )}
                        <Badge variant="secondary">{error.application.name}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {error.viewCount.toLocaleString()} {t('common:error.views')}
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
                        <span>{error.solutionCount} {t('common:error.solutions')}</span>
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