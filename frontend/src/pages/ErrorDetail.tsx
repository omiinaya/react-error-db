import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Calendar, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Solution, CreateSolutionRequest, UpdateSolutionRequest } from '@/types';
import toast from 'react-hot-toast';
import EditSolutionDialog from '@/components/EditSolutionDialog';

const ErrorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [solutionText, setSolutionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [solutionToDelete, setSolutionToDelete] = useState<Solution | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [solutionToEdit, setSolutionToEdit] = useState<Solution | null>(null);
  const { t } = useTranslation();

  // Character limit constants
  const MAX_CHARACTERS = 10000;
  const WARNING_THRESHOLD = 8000; // 80% of limit
  const currentLength = solutionText.length;
  const charactersRemaining = MAX_CHARACTERS - currentLength;
  const percentageUsed = (currentLength / MAX_CHARACTERS) * 100;

  // Determine text color based on character count
  const getCharacterCountColor = () => {
    if (currentLength > MAX_CHARACTERS) {
      return 'text-red-500'; // Over limit - red
    } else if (currentLength > WARNING_THRESHOLD) {
      return 'text-yellow-500'; // Warning zone - yellow/orange
    } else {
      return 'text-muted-foreground'; // Normal - muted color
    }
  };

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
    onError: () => {
      // Error is handled by global API interceptor, no need for duplicate toast
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
    onError: () => {
      setIsSubmitting(false);
      // Error is handled by global API interceptor, no need for duplicate toast
    },
  });

  // Delete solution mutation
  const deleteSolutionMutation = useMutation({
    mutationFn: (solutionId: string) =>
      api.deleteSolution(solutionId),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setSolutionToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['error-detail', id] });
      toast.success(t('errors:messages.solutionDeleted'));
    },
    onError: () => {
      setDeleteDialogOpen(false);
      setSolutionToDelete(null);
      // Error is handled by global API interceptor, no need for duplicate toast
    },
  });

  // Edit solution mutation
  const editSolutionMutation = useMutation({
    mutationFn: ({ solutionId, solutionText }: { solutionId: string; solutionText: string }) =>
      api.updateSolution(solutionId, { solutionText }),
    onSuccess: () => {
      setEditDialogOpen(false);
      setSolutionToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['error-detail', id] });
      toast.success(t('errors:messages.solutionUpdated'));
    },
    onError: () => {
      setEditDialogOpen(false);
      setSolutionToEdit(null);
      // Error is handled by global API interceptor, no need for duplicate toast
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

  const handleDeleteSolution = (solution: Solution) => {
    if (!isAuthenticated) {
      toast.error(t('errors:messages.signInToDelete'));
      return;
    }
    setSolutionToDelete(solution);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSolution = () => {
    if (solutionToDelete) {
      deleteSolutionMutation.mutate(solutionToDelete.id);
    }
  };

  const handleEditSolution = (solution: Solution) => {
    if (!isAuthenticated) {
      toast.error(t('errors:messages.signInToEdit'));
      return;
    }
    setSolutionToEdit(solution);
    setEditDialogOpen(true);
  };

  const handleSaveSolution = (solutionId: string, solutionText: string) => {
    editSolutionMutation.mutate({ solutionId, solutionText });
  };

  const isSolutionAuthor = (solution: Solution) => {
    return user && solution.author.id === user.id;
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
                    <div className="flex items-center gap-2">
                      {solution.isVerified && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('errors:detail.verified')}
                        </Badge>
                      )}
                      {isAuthenticated && isSolutionAuthor(solution) && !solution.isVerified && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSolution(solution)}
                            disabled={editSolutionMutation.isPending}
                            className="h-8 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSolution(solution)}
                            disabled={deleteSolutionMutation.isPending}
                            className="h-8 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground block">
                        {new Date(solution.createdAt).toLocaleDateString()}
                      </span>
                      {solution.updatedAt && solution.updatedAt !== solution.createdAt && (
                        <span className="text-xs text-muted-foreground block">
                          {t('errors:detail.lastEdited')}: {new Date(solution.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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
              <div className="relative mb-4">
                <Textarea
                  placeholder={t('errors:detail.solutionPlaceholder')}
                  className="min-h-32 pr-16"
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={MAX_CHARACTERS}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className={`text-xs font-medium ${getCharacterCountColor()} transition-colors duration-200`}>
                    {currentLength > MAX_CHARACTERS ? (
                      <span className="flex items-center gap-1">
                        <span className="text-red-500">-{Math.abs(charactersRemaining)}</span>
                      </span>
                    ) : (
                      charactersRemaining
                    )}
                  </div>
                  {percentageUsed > 80 && (
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                  )}
                </div>
              </div>
              {/* Error message in bottom right - only show when there are issues and more than 0 characters */}
              {(currentLength > 0 && (currentLength > MAX_CHARACTERS || currentLength < 10)) && (
                <div className="text-right mb-4">
                  <div className="text-xs text-red-500 font-medium">
                    {currentLength > MAX_CHARACTERS ? (
                      <span>{t('errors:detail.characterLimitExceeded')}</span>
                    ) : currentLength < 10 ? (
                      <span>{t('errors:validation.solutionTextTooSmall')}</span>
                    ) : null}
                  </div>
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !solutionText.trim() || currentLength > MAX_CHARACTERS}
                className={currentLength > MAX_CHARACTERS ? 'opacity-50 cursor-not-allowed' : ''}
              >
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('errors:detail.deleteSolutionTitle')}</DialogTitle>
            <DialogDescription>
              {t('errors:detail.deleteSolutionDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSolutionMutation.isPending}
            >
              {t('common:cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSolution}
              disabled={deleteSolutionMutation.isPending}
            >
              {deleteSolutionMutation.isPending ? t('common:deleting') : t('common:delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Solution Dialog */}
      <EditSolutionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        solution={solutionToEdit}
        onSave={handleSaveSolution}
        isSaving={editSolutionMutation.isPending}
      />
    </div>
  );
};

export default ErrorDetail;