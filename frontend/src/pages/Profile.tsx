import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Edit, Save, X, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { UpdateProfileRequest, Solution } from '@/types';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    avatarUrl: ''
  });

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const response = await api.getUserProfile(user!.id);
      return response;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.updateProfile(data),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      // Error is handled by global API interceptor, no need for duplicate toast
    },
  });

  const handleEdit = () => {
    if (profile?.user) {
      setEditData({
        displayName: profile.user.displayName,
        avatarUrl: profile.user.avatarUrl || ''
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Error loading profile. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userData = profile.user;
  const stats = profile.user.stats;

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userData.avatarUrl || ''} />
            <AvatarFallback className="text-2xl">
              {userData.displayName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={editData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                  placeholder="Enter avatar URL (optional)"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{userData.displayName}</h1>
                {userData.isVerified && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {userData.isAdmin && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-3">@{userData.username}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(userData.joinedAt).toLocaleDateString()}
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Solutions Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.solutionsSubmitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Solutions Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.solutionsVerified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Upvotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUpvotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Downvotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownvotes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Solutions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Solutions</CardTitle>
          <CardDescription>Your most recently submitted solutions</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.recentSolutions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't submitted any solutions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {profile.recentSolutions.map((solution: Solution) => (
                <div key={solution.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Last edited: {new Date(solution.lastEditedAt || solution.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <ThumbsUp className="h-3 w-3" />
                        {solution.upvotes}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <ThumbsDown className="h-3 w-3" />
                        {solution.downvotes}
                      </div>
                      {solution.isVerified && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">
                    {solution.solutionText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Solutions */}
      <Card>
        <CardHeader>
          <CardTitle>Top Solutions</CardTitle>
          <CardDescription>Your highest-rated solutions</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.topSolutions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You don't have any top solutions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {profile.topSolutions.map((solution: Solution) => (
                <div key={solution.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Last edited: {new Date(solution.lastEditedAt || solution.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <ThumbsUp className="h-3 w-3" />
                        {solution.upvotes}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <ThumbsDown className="h-3 w-3" />
                        {solution.downvotes}
                      </div>
                      {solution.isVerified && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">
                    {solution.solutionText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;