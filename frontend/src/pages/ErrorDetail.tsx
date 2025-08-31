import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Solution, CreateSolutionRequest } from '@/types';
import toast from 'react-hot-toast';

const ErrorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [solutionText, setSolutionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  // Fetch error details
  const { data: errorDetail, isLoading, error } = useQuery({
    queryKey: ['error-detail', id],
    queryFn: async () => {
      const response = await api.getErrorById(id!);
      return response;
    },
    enabled: !!id,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ solutionId, voteType }: { solutionId: string; voteType: 'upvote' | 'downvote' }) =>
      api.voteOnSolution(solutionId, { voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-detail', id] });
      toast.success(t('errors:messages.voteRecorded'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('errors:messages.voteFailed'));
    },
  });

  // Add solution mutation
  const addSolutionMutation = useMutation({
    mutationFn: (data: CreateSolutionRequest) =>
      api.addSolution(id!, data),
    onSuccess: () => {
      setSolutionText('');
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['error-detail', id] });
      toast.success(t('errors:messages.solutionAdded'));
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.error?.message || t('errors:messages.solutionFailed'));
    },
  });

  const handleVote = (solutionId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast.error(t('errors:messages.signInToVote'));
      return;
    }
    voteMutation.mutate({ solutionId, voteType });
  };

  const handleSubmitSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(t('errors:messages.signInToAddSolution'));
      return;
    }
    if (!solutionText.trim()) {
      toast.error(t('errors:messages.solutionRequired'));
      return;
    }
    
    setIsSubmitting(true);
    addSolutionMutation.mutate({ solutionText: solutionText.trim() });
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !errorDetail) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{t('common:errorLoading')}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/search">{t('common:tryAgain')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const errorData = errorDetail.error;
  const solutions = errorDetail.solutions || [];

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Error Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {errorData.application.category ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {errorData.application.category.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              {t('common:error.noCategory')}
            </Badge>
          )}
          <Badge variant="secondary">{errorData.application.name}</Badge>
          <Badge variant={
            errorData.severity === 'high' || errorData.severity === 'critical'
              ? 'destructive'
              : errorData.severity === 'medium'
              ? 'default'
              : 'outline'
          }>
            {errorData.severity}
          </Badge>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          {errorData.code}: {errorData.title}
        </h1>
        
        <p className="text-muted-foreground mb-4">
          {errorData.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {errorData.viewCount.toLocaleString()} {t('common:error.views')}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {t('errors:detail.solutionCount', { count: solutions.length })}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(errorData.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Common Causes */}
      {errorData.metadata?.commonCauses && errorData.metadata.commonCauses.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('errors:detail.commonCauses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {errorData.metadata.commonCauses.map((cause: string, index: number) => (
                <li key={index} className="text-muted-foreground">
                  {cause}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Solutions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('errors:detail.solutions')}</h2>
          <span className="text-muted-foreground">
            {t('errors:detail.solutionCount', { count: solutions.length })}
          </span>
        </div>

        {solutions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">{t('errors:detail.noSolutions')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solutions.map((solution: Solution) => (
              <Card key={solution.id} className={solution.isVerified ? 'border-primary/20 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={solution.author.avatarUrl || ''} />
                        <AvatarFallback>
                          {solution.author.displayName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{solution.author.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          @{solution.author.username}
                        </div>
                      </div>
                    </div>
                    {solution.isVerified && (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('errors:detail.verified')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                    {solution.solutionText}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant={solution.userVote === 'upvote' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(solution.id, 'upvote')}
                          disabled={voteMutation.isPending}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {solution.upvotes}
                        </Button>
                        <Button
                          variant={solution.userVote === 'downvote' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(solution.id, 'downvote')}
                          disabled={voteMutation.isPending}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {solution.downvotes}
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t('errors:detail.score')}: {solution.score}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(solution.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Solution Form */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>{t('errors:detail.addSolution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitSolution}>
              <Textarea
                placeholder={t('errors:detail.solutionPlaceholder')}
                className="min-h-32 mb-4"
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting || !solutionText.trim()}>
                {isSubmitting ? t('errors:detail.submitting') : t('errors:detail.submitSolution')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAuthenticated && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              {t('errors:detail.signInToContribute')}
            </p>
            <Button asChild>
              <Link to="/login">{t('navigation:signIn')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ErrorDetail;