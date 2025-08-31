import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Users, Code, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  // Fetch trending errors
  const { data: trendingErrors, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending-errors'],
    queryFn: async () => {
      const response = await api.searchErrors({
        limit: 6,
        sort: 'views' as any
      });
      return response.errors;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const features = [
    {
      icon: <Code className="h-8 w-8" />,
      title: t('common:features.comprehensiveDatabase'),
      description: t('common:features.comprehensiveDatabaseDesc')
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: t('common:features.communitySolutions'),
      description: t('common:features.communitySolutionsDesc')
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('common:features.verifiedContent'),
      description: t('common:features.verifiedContentDesc')
    }
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('home:hero.title')}
            <span className="text-primary"> {t('home:hero.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home:hero.description')}
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('common:search.placeholderHome')}
                className="pl-12 pr-4 py-6 text-lg border-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {t('common:search.button')}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/search">{t('common:cta.browseErrors')}</Link>
            </Button>
            <Button asChild>
              <Link to="/register">{t('home:hero.joinCommunity')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('home:features.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home:features.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Errors Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">{t('common:error.trending')}</h2>
            <Button variant="outline" asChild>
              <Link to="/search">{t('common:error.viewAll')}</Link>
            </Button>
          </div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingErrors?.map((error: any) => (
                <Card key={error.id} className="hover:shadow-lg transition-shadow">
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
                      <Badge variant={error.severity === 'high' || error.severity === 'critical' ? 'destructive' : 'outline'}>
                        {error.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {error.solutionCount} {t('common:error.solutions')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t('common:cta.readyToSolve')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('common:cta.joinCommunity')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">{t('common:cta.getStarted')}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/search">{t('common:cta.browseErrors')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;