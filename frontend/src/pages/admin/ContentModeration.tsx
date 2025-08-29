import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Trash2, Search, FileText, User, AlertTriangle } from 'lucide-react';

interface SolutionForModeration {
  id: string;
  solutionText: string;
  isVerified: boolean;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  error: {
    id: string;
    code: string;
    title: string;
    application: {
      name: string;
      slug: string;
      category?: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
  verifiedBy: {
    id: string;
    username: string;
    displayName: string;
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ContentModeration: React.FC = () => {
  const { user } = useAuth();
  const [solutions, setSolutions] = useState<SolutionForModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchSolutions();
  }, [user, pagination.page, pagination.limit, status]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        status
      };

      const response = await api.request<{ solutions: SolutionForModeration[]; pagination: PaginationMeta }>({
        method: 'get',
        url: '/admin/solutions/moderation',
        params
      });

      setSolutions(response.solutions);
      setPagination(response.pagination);
      setSelectedSolutions([]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch solutions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'verify' | 'reject' | 'delete') => {
    if (selectedSolutions.length === 0) return;

    try {
      await api.request({
        method: 'post',
        url: '/admin/solutions/bulk-moderation',
        data: {
          solutionIds: selectedSolutions,
          action
        }
      });

      // Refresh the solutions list
      fetchSolutions();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to ${action} solutions`);
    }
  };

  const toggleSolutionSelection = (solutionId: string) => {
    setSelectedSolutions(prev =>
      prev.includes(solutionId)
        ? prev.filter(id => id !== solutionId)
        : [...prev, solutionId]
    );
  };

  const selectAllSolutions = () => {
    if (selectedSolutions.length === solutions.length) {
      setSelectedSolutions([]);
    } else {
      setSelectedSolutions(solutions.map(s => s.id));
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access content moderation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage user-submitted solutions
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
              </SelectContent>
            </Select>

            {selectedSolutions.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('verify')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Selected ({selectedSolutions.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected ({selectedSolutions.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedSolutions.length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solutions</CardTitle>
          <CardDescription>
            {pagination.total} solutions found ({status} status)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : solutions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No solutions found</h3>
              <p className="text-muted-foreground">
                {status === 'pending' 
                  ? 'No solutions pending review' 
                  : `No ${status} solutions found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solutions.map((solution) => (
                <Card key={solution.id} className={selectedSolutions.includes(solution.id) ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedSolutions.includes(solution.id)}
                        onChange={() => toggleSolutionSelection(solution.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {solution.author.avatarUrl ? (
                            <img
                              src={solution.author.avatarUrl}
                              alt={solution.author.displayName}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                          <span className="font-medium">{solution.author.displayName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(solution.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant={solution.isVerified ? "default" : "secondary"}>
                            {solution.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              {solution.error.application.name} - {solution.error.code}: {solution.error.title}
                            </span>
                            {solution.error.application.category ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                {solution.error.application.category.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                                No Category
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-4">
                          <p>{solution.solutionText}</p>
                        </div>

                        <div className="flex gap-2">
                          {!solution.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBulkAction('verify')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction('reject')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBulkAction('delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} solutions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModeration;