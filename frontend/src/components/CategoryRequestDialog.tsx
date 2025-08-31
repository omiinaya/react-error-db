import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { CreateCategoryRequestInput } from '@/types';

interface CategoryRequestDialogProps {
  onRequestCreated: (request: any) => void;
  onClose: () => void;
}

const CategoryRequestDialog: React.FC<CategoryRequestDialogProps> = ({ onRequestCreated, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryRequestInput>({
    name: '',
    slug: '',
    description: '',
    icon: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
    e.stopPropagation();
    
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

    setIsSubmitting(true);
    try {
      const response = await api.createCategoryRequest(formData);
      onRequestCreated(response.categoryRequest);
      toast({
        title: 'Success',
        description: 'Category request submitted successfully. It will be reviewed by an administrator.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to submit category request',
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

      {/* Icon */}
      <div className="space-y-2">
        <Label htmlFor="icon">Icon (optional)</Label>
        <Input
          id="icon"
          name="icon"
          placeholder="e.g., database, globe, code"
          value={formData.icon}
          onChange={handleInputChange}
        />
        <p className="text-sm text-muted-foreground">
          Icon name from Lucide or similar icon library
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryRequestDialog;
