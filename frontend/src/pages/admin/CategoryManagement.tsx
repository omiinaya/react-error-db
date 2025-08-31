import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Folder, Plus, Edit, Trash2, Calendar, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateCategoryDialog from '@/components/CreateCategoryDialog';

interface CategoryWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: CategoryWithStats[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CategoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchCategories();
  }, [user, pagination.page, pagination.limit, search, parentFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        includeChildren: true
      };

      if (search) params.search = search;
      if (parentFilter && parentFilter !== 'all') {
        params.parentId = parentFilter;
      } else if (parentFilter === 'root') {
        params.includeChildren = false;
      }

      const response = await api.request<{ categories: CategoryWithStats[]; meta: { pagination: PaginationMeta } }>({
        method: 'get',
        url: '/categories',
        params
      });

      setCategories(response.categories);
      setPagination(response.meta.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCreated = () => {
    setShowCreateDialog(false);
    fetchCategories();
    toast({
      title: 'Success',
      description: 'Category created successfully'
    });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await api.request({
        method: 'delete',
        url: `/categories/${categoryId}`
      });
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  const getParentOptions = () => {
    const rootCategories = categories.filter(cat => !cat.parentId);
    return [
      { id: 'all', name: 'All categories' },
      { id: 'root', name: 'Root categories only' },
      ...rootCategories.map(cat => ({ id: cat.id, name: cat.name }))
    ];
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access category management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
        <p className="text-muted-foreground">
          Manage categories and their organization
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
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={parentFilter} onValueChange={setParentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by parent" />
              </SelectTrigger>
              <SelectContent>
                {getParentOptions().map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {pagination.total} categories found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
              <p className="text-muted-foreground">
                {search || parentFilter !== 'all' ? 'Try adjusting your search criteria' : 'Get started by creating your first category'}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {category.icon ? (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-lg">{category.icon}</span>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <Folder className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Badge variant="secondary">{category.slug}</Badge>
                            {category.applicationCount > 0 && (
                              <Badge variant="outline">
                                <Layers className="h-3 w-3 mr-1" />
                                {category.applicationCount} apps
                              </Badge>
                            )}
                          </div>
                          
                          {category.description && (
                            <p className="text-muted-foreground text-sm mb-2">
                              {category.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Sort order: {category.sortOrder}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {new Date(category.createdAt).toLocaleDateString()}
                            </span>
                            {category.parent && (
                              <>
                                <span>•</span>
                                <span>Parent: {category.parent.name}</span>
                              </>
                            )}
                          </div>

                          {category.children && category.children.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium mb-2">Subcategories:</h4>
                              <div className="flex flex-wrap gap-2">
                                {category.children.map((child) => (
                                  <Badge key={child.id} variant="outline" className="text-xs">
                                    {child.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
                          disabled={category.applicationCount > 0 || (category.children && category.children.length > 0)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
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
                {pagination.total} categories
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

      {showCreateDialog && (
        <CreateCategoryDialog
          onCategoryCreated={handleCategoryCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
};

export default CategoryManagement;