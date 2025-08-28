import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface ApplicationWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  categoryId: string;
  websiteUrl: string | null;
  documentationUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    name: string;
    slug: string;
  };
  errorCount: number;
}

const ApplicationManagement: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.request<{ applications: ApplicationWithStats[] }>({
        method: 'get',
        url: '/admin/applications/stats'
      });

      setApplications(response.applications);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This will also delete all associated error codes and solutions.')) {
      return;
    }

    try {
      await api.request({
        method: 'delete',
        url: `/applications/${applicationId}`
      });
      
      // Refresh the applications list
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete application');
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access application management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Application Management</h1>
        <p className="text-muted-foreground">
          Manage applications and their error codes
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
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Applications</h3>
              <p className="text-muted-foreground">
                {applications.length} applications in the system
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first application
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {application.logoUrl ? (
                    <img
                      src={application.logoUrl}
                      alt={application.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Database className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{application.name}</h3>
                      <Badge variant="secondary">{application.category.name}</Badge>
                    </div>
                    
                    {application.description && (
                      <p className="text-muted-foreground text-sm mb-2">
                        {application.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{application.errorCount} error codes</span>
                      <span>•</span>
                      <span>Created {new Date(application.createdAt).toLocaleDateString()}</span>
                    </div>

                    {(application.websiteUrl || application.documentationUrl) && (
                      <div className="flex gap-2 mt-2">
                        {application.websiteUrl && (
                          <a
                            href={application.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        )}
                        {application.documentationUrl && (
                          <a
                            href={application.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Documentation
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteApplication(application.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationManagement;