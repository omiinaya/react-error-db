import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { CreateApplicationRequest } from '@/types';

interface CreateApplicationDialogProps {
  categoryId: string;
  onApplicationCreated: (application: any) => void;
}

const CreateApplicationDialog: React.FC<CreateApplicationDialogProps> = ({ 
  categoryId, 
  onApplicationCreated 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateApplicationRequest>({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    categoryId
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
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Application name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createApplication(formData);
      onApplicationCreated(response.application);
      toast({
        title: 'Success',
        description: 'Application created successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create application',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., MongoDB, React, Express.js"
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
          placeholder="e.g., mongodb, react, express-js"
          value={formData.slug}
          onChange={handleInputChange}
          required
        />
        <p className="text-sm text-muted-foreground">
          URL-friendly identifier for the application
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the application and common error types..."
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL (optional)</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          placeholder="https://example.com/logo.png"
          value={formData.logoUrl}
          onChange={handleInputChange}
          type="url"
        />
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL (optional)</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          placeholder="https://example.com"
          value={formData.websiteUrl}
          onChange={handleInputChange}
          type="url"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => onApplicationCreated(null)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Application'}
        </Button>
      </div>
    </form>
  );
};

export default CreateApplicationDialog;