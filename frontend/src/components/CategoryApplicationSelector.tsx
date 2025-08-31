import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Category, Application } from '@/types';
import CreateCategoryDialog from './CreateCategoryDialog';
import CreateApplicationDialog from './CreateApplicationDialog';
import CategoryRequestDialog from './CategoryRequestDialog';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryApplicationSelectorProps {
  onApplicationSelect: (applicationId: string) => void;
  selectedApplicationId?: string;
}

const CategoryApplicationSelector: React.FC<CategoryApplicationSelectorProps> = ({
  onApplicationSelect,
  selectedApplicationId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateApplicationOpen, setIsCreateApplicationOpen] = useState(false);
  const [isRequestCategoryOpen, setIsRequestCategoryOpen] = useState(false);

  useEffect(() => {
    console.log('CategoryApplicationSelector - Current user:', user);
    console.log('User isAdmin:', user?.isAdmin);
    loadCategories();
  }, [user]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadApplications(selectedCategoryId);
    } else {
      setApplications([]);
      onApplicationSelect('');
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories({ includeChildren: false });
      setCategories(response.categories);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async (categoryId: string) => {
    try {
      const response = await api.getApplications({ categoryId });
      setApplications(response.applications);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive'
      });
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id);
    setIsCreateCategoryOpen(false);
  };

  const handleApplicationCreated = (newApplication: Application) => {
    setApplications(prev => [...prev, newApplication]);
    onApplicationSelect(newApplication.id);
    setIsCreateApplicationOpen(false);
  };

  const handleCategoryRequestCreated = () => {
    toast({
      title: 'Request Submitted',
      description: 'Your category request has been submitted for review by an administrator.',
    });
    setIsRequestCategoryOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="category">Category</Label>
          {user?.isAdmin ? (
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="h-8 px-0">
                  + New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category to organize applications and error codes.
                  </DialogDescription>
                </DialogHeader>
                <CreateCategoryDialog
                  onCategoryCreated={handleCategoryCreated}
                  onClose={() => setIsCreateCategoryOpen(false)}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isRequestCategoryOpen} onOpenChange={setIsRequestCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="h-8 px-0">
                  + Request Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request New Category</DialogTitle>
                  <DialogDescription>
                    Submit a request for a new category. An administrator will review your request.
                  </DialogDescription>
                </DialogHeader>
                <CategoryRequestDialog
                  onRequestCreated={handleCategoryRequestCreated}
                  onClose={() => setIsRequestCategoryOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.applicationCount || 0} apps)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Application Selection */}
      {selectedCategoryId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="application">Application *</Label>
            <Dialog open={isCreateApplicationOpen} onOpenChange={setIsCreateApplicationOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="h-8 px-0">
                  + New Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Application</DialogTitle>
                  <DialogDescription>
                    Add a new application to the selected category.
                  </DialogDescription>
                </DialogHeader>
                <CreateApplicationDialog 
                  categoryId={selectedCategoryId}
                  onApplicationCreated={handleApplicationCreated}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Select 
            value={selectedApplicationId} 
            onValueChange={onApplicationSelect}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an application" />
            </SelectTrigger>
            <SelectContent>
              {applications.map((application) => (
                <SelectItem key={application.id} value={application.id}>
                  {application.name} ({application.errorCount} errors)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default CategoryApplicationSelector;