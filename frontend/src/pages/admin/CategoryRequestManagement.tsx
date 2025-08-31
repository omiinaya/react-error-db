import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CategoryRequest } from '@/types';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CategoryRequestManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [rejectReason, setRejectReason] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchRequests();
  }, [user, pagination.page, pagination.limit, search, status]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (search) params.search = search;
      if (status && status !== 'all') params.status = status;

      const response = await api.request<{ categoryRequests: CategoryRequest[]; meta?: any }>({
        method: 'get',
        url: '/category-requests',
        params
      });

      setRequests(response.categoryRequests);
      setPagination(response.meta?.pagination || {
        page: 1,
        limit: 20,
        total: response.categoryRequests.length,
        pages: 1
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch category requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      await api.updateCategoryRequestStatus(requestId, { status: 'approved' });
      toast({
        title: 'Request Approved',
        description: 'Category request has been approved and the category has been created.',
      });
      fetchRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to approve request',
        variant: 'destructive'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessingRequest(requestId);
      await api.updateCategoryRequestStatus(requestId, { 
        status: 'rejected', 
        reason: rejectReason 
      });
      toast({
        title: 'Request Rejected',
        description: 'Category request has been rejected.',
      });
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to reject request',
        variant: 'destructive'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pending', icon: Clock },
      approved: { variant: 'default' as const, text: 'Approved', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, text: 'Rejected', icon: XCircle }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.pending;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.text}
      </Badge>
    );
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access category request management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Category Request Management</h1>
        <p className="text-muted-foreground">
          Review and manage category requests from users
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Requests</CardTitle>
          <CardDescription>
            {pagination.total} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
              <p className="text-muted-foreground">
                {search || status ? 'Try adjusting your search criteria' : 'No category requests pending review'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Details</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Slug: {request.slug}
                          </div>
                          {request.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {request.description}
                            </div>
                          )}
                          {request.reason && (
                            <div className="text-sm text-destructive mt-1">
                              Reason: {request.reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {request.requestedBy?.displayName || request.requestedBy?.username || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={processingRequest === request.id}
                            >
                              {processingRequest === request.id ? 'Approving...' : 'Approve'}
                            </Button>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="text-sm"
                                rows={2}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                                disabled={processingRequest === request.id || !rejectReason.trim()}
                              >
                                {processingRequest === request.id ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} requests
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

export default CategoryRequestManagement;