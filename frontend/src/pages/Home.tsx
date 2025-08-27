import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Users, Code, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch trending errors
  const { data: trendingErrors, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending-errors'],
    queryFn: async () => {
      const response = await api.searchErrors({ 
        limit: 6,
        sort: 'views' 
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
      title: "Comprehensive Database",
      description: "Thousands of error codes from popular frameworks and libraries"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Solutions",
      description: "Real solutions from experienced developers around the world"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Verified Content",
      description: "Expert-verified solutions to ensure accuracy and reliability"
    }
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Find Solutions to Every
            <span className="text-primary"> Error Code</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The largest database of error codes and solutions. Get instant help from our community of developers.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for error codes (e.g., 'E11000', '404', 'TypeError')..."
                className="pl-12 pr-4 py-6 text-lg border-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                size="lg" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/search">Browse All Errors</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Join Community</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose ErrorDB?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the most comprehensive and reliable error code database with community-driven solutions.
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
            <h2 className="text-3xl font-bold">Trending Errors</h2>
            <Button variant="outline" asChild>
              <Link to="/search">View All</Link>
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
                      <Badge variant={error.severity === 'high' || error.severity === 'critical' ? 'destructive' : 'outline'}>
                        {error.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {error.solutionCount} solutions
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
          <h2 className="text-3xl font-bold mb-4">Ready to Solve Your Errors?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers who use ErrorDB to quickly find solutions to their coding problems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/search">Browse Errors</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;