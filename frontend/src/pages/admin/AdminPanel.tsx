import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Database, 
  AlertTriangle, 
  Activity, 
  Shield,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import admin components
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import ApplicationManagement from './ApplicationManagement';
import SystemLogs from './SystemLogs';
import CategoryManagement from './CategoryManagement';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const adminMenuItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: Activity,
      description: 'Overview of system statistics and metrics'
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage user accounts and permissions'
    },
    {
      title: 'Content Moderation',
      href: '/admin/content',
      icon: FileText,
      description: 'Review and moderate user-generated content'
    },
    {
      title: 'Application Management',
      href: '/admin/applications',
      icon: Database,
      description: 'Manage applications and categories'
    },
    {
      title: 'Category Management',
      href: '/admin/categories',
      icon: AlertTriangle,
      description: 'Manage error categories and taxonomy'
    },
    {
      title: 'System Logs',
      href: '/admin/logs',
      icon: Shield,
      description: 'View system logs and audit trails'
    }
  ];


  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Main Site
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            Manage system settings, users, content, and monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Admin Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {location.pathname === '/admin' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Admin Panel</CardTitle>
                  <CardDescription>
                    Select a section from the menu to manage different aspects of the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/content" element={<ContentModeration />} />
                <Route path="/applications" element={<ApplicationManagement />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/logs" element={<SystemLogs />} />
              </Routes>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;