import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { CreateErrorCodeRequest } from '@/types';
import CategoryApplicationSelector from '@/components/CategoryApplicationSelector';
import MarkdownEditor from '@/components/MarkdownEditor';

const ErrorCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateErrorCodeRequest>({
    code: '',
    applicationId: '',
    title: '',
    description: '',
    severity: 'medium',
    metadata: {}
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeverityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      severity: value as 'low' | 'medium' | 'high' | 'critical'
    }));
  };

  const handleApplicationSelect = (applicationId: string) => {
    setFormData(prev => ({
      ...prev,
      applicationId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create error codes',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (!formData.applicationId) {
      toast({
        title: 'Application required',
        description: 'Please select an application',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createErrorCode(formData);
      toast({
        title: 'Success',
        description: 'Error code created successfully'
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create error code',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create error codes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button asChild>
                <a href="/login">Log In</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/register">Register</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create New Error Code</CardTitle>
          <CardDescription>
            Add a new error code to help developers find solutions faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Application Selection */}
            <div className="space-y-2">
              <Label htmlFor="application">Application *</Label>
              <CategoryApplicationSelector
                onApplicationSelect={handleApplicationSelect}
                selectedApplicationId={formData.applicationId}
              />
            </div>

            {/* Error Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Error Code *</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g., E11000, 404, TypeError"
                value={formData.code}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Error Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Duplicate key error, Not Found, Type Error"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <MarkdownEditor
                value={formData.description || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Describe the error, common causes, and any additional context..."
                height={300}
                maxLength={5000}
                showCharacterCount={true}
                showToolbar={true}
              />
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={handleSeverityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Error Code'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorCreate;