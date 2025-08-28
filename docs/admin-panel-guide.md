# Admin Panel Guide

## Overview

The admin panel provides comprehensive management tools for administrators to manage users, content, applications, and monitor system health. This guide covers the features and functionality available to administrators.

## Access Requirements

To access the admin panel, users must have the `isAdmin` flag set to `true` in their user profile. Admin routes are protected and will redirect non-admin users to the home page.

## Admin Navigation

The admin panel is accessible through the main navigation menu when logged in as an admin user. The admin section includes:

- **Dashboard**: Overview statistics and system health
- **Users**: User management and role assignment
- **Content**: Solution moderation and content management
- **Applications**: Application and category management
- **Logs**: System activity and audit logs

## Features

### 1. Dashboard

The admin dashboard provides an overview of system statistics:

- Total users count
- Total solutions submitted
- Pending moderation count
- System health status
- Recent activity feed

### 2. User Management

Manage all users in the system:

- View all users with pagination
- Filter users by role or search by username/email
- Update user roles (admin/regular user)
- Delete users (with safety checks)
- View user statistics (solutions submitted, verified solutions, etc.)

### 3. Content Moderation

Review and manage user-submitted solutions:

- View solutions pending verification
- Filter by verification status (pending, verified, reported)
- Bulk operations (verify, reject, delete multiple solutions)
- Individual solution actions
- View solution context and author information

### 4. Application Management

Manage applications and categories:

- View all applications with statistics
- Add new applications
- Edit existing applications
- Delete applications (with cascade deletion of error codes)
- View application details and metadata

### 5. System Logs

Monitor system activity:

- View audit logs of admin actions
- Filter logs by level (info, warn, error, debug)
- Search through log messages
- Export logs in various formats
- View detailed context for each log entry

## API Endpoints

### Admin Dashboard
- `GET /admin/dashboard/stats` - Get dashboard statistics

### User Management
- `GET /admin/users` - Get all users with pagination
- `PUT /admin/users/:userId/role` - Update user role
- `DELETE /admin/users/:userId` - Delete user

### Content Moderation
- `GET /admin/solutions/moderation` - Get solutions for moderation
- `POST /admin/solutions/bulk-moderation` - Bulk moderate solutions
- `POST /admin/solutions/:solutionId/verify` - Verify solution

### Application Management
- `GET /admin/applications/stats` - Get applications with statistics

### System Logs
- `GET /admin/system/logs` - Get system logs
- `GET /admin/export/logs` - Export logs

## Security Features

### Role-Based Access Control
- All admin routes require `isAdmin: true`
- Protected routes use middleware validation
- Frontend routes use ProtectedRoute component with `requireAdmin` prop

### Audit Logging
- All admin actions are logged to the database
- Logs include user, action, resource, and outcome
- Audit trail for compliance and debugging

### Input Validation
- All admin endpoints use Zod validation
- Parameter sanitization and type checking
- Rate limiting on sensitive operations

## Setup Instructions

### 1. Create Admin User

To create an admin user, you can either:

1. **Database update**: Set `isAdmin = true` for an existing user in the database
2. **Registration**: Register a new user and update their role via the API
3. **Seed data**: Use the seed script to create admin users

### 2. Environment Configuration

Ensure proper environment variables are set:

```env
# Admin-specific settings
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=changeme
```

### 3. Testing

Run the admin test script to verify functionality:

```bash
node test-admin.js --email admin@example.com --password yourpassword
```

## Best Practices

1. **Regular Audits**: Regularly review admin actions through the audit logs
2. **Least Privilege**: Only grant admin access to trusted users
3. **Backup**: Regularly backup the database, especially before bulk operations
4. **Monitoring**: Set up alerts for critical admin actions
5. **Documentation**: Keep this guide updated with new features

## Troubleshooting

### Common Issues

1. **Access Denied**: Ensure user has `isAdmin: true` in database
2. **Missing Routes**: Check that backend server is running on port 3010
3. **Database Errors**: Verify database connection and migrations
4. **CORS Issues**: Check frontend-backend URL configuration

### Support

For issues with the admin panel:

1. Check the system logs for error messages
2. Verify database connectivity
3. Ensure all migrations have been applied
4. Check user permissions in the database

## Future Enhancements

Planned features for the admin panel:

- [ ] Real-time notifications for new content
- [ ] Advanced search and filtering
- [ ] User activity tracking
- [ ] Export functionality for all data
- [ ] Integration with monitoring tools
- [ ] Two-factor authentication for admin access
- [ ] Role hierarchy with different admin levels