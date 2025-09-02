import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { CreateCategoryRequest } from '@/types';

interface CreateCategoryDialogProps {
  onCategoryCreated: (category: any) => void;
  onClose: () => void;
}

const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({ onCategoryCreated, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name: string) => {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Handle cases where slug becomes too short after processing
    if (slug.length < 2) {
      // For short names, use the full lowercase name with numbers if needed
      slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // If still too short, append a number to make it valid
      if (slug.length < 2) {
        slug = slug + '1';
      }
    }
    
    return slug;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Additional protection against event bubbling
    
    // Manual validation instead of relying on browser validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category slug is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.slug.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Slug must be at least 2 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createCategory(formData);
      onCategoryCreated(response.category);
      toast({
        title: 'Success',
        description: 'Category created successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create category',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Database, Frontend, API"
          value={formData.name}
          onChange={handleNameChange}
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="e.g., database, frontend, api"
          value={formData.slug}
          onChange={handleInputChange}
          required
        />
        <p className="text-sm text-muted-foreground">
          URL-friendly identifier for the category
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the category and what types of applications it contains..."
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>


      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default CreateCategoryDialog;