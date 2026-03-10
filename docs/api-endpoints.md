# Error Database - API Endpoints Specification

## Base URL
```
https://api.errdb.example.com/api
```

## Authentication
All endpoints except public routes require Bearer token authentication:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "meta": {
    "pagination": {}
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

## Table of Contents
1. [Authentication](#authentication-endpoints)
2. [Search](#search-endpoints)
3. [Bookmarks](#bookmarks-endpoints)
4. [Notifications](#notifications-endpoints)
5. [Categories](#categories-endpoints)
6. [Applications](#applications-endpoints)
7. [Error Codes](#error-codes-endpoints)
8. [Solutions](#solutions-endpoints)
9. [Users](#users-endpoints)
10. [Webhooks](#webhooks-endpoints)
11. [Export](#export-endpoints)
12. [Admin](#admin-endpoints)

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Request body:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "User Display Name"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "User Display Name",
      "isVerified": false
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Login User
**POST** `/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: Same as register endpoint

### Get Current User
**GET** `/auth/me`

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "displayName": "User Display Name",
      "avatarUrl": null,
      "isVerified": false,
      "isAdmin": false,
      "reputation": 150,
      "solutionCount": 10,
      "verifiedSolutionCount": 3
    }
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Request body:
```json
{
  "refreshToken": "refresh_token"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

## Search Endpoints

### Advanced Search
**GET** `/search`

Query parameters:
- `query` (required): Search query string
- `applicationId` (optional): Filter by application UUID
- `categoryId` (optional): Filter by category UUID
- `severity` (optional): Filter by severity (low, medium, high, critical)
- `hasSolutions` (optional): Filter by solutions availability (true/false)
- `sortBy` (optional): Sort by relevance, newest, popular, solutions
- `page` (optional): Pagination page (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

Response:
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "id": "uuid",
        "code": "E123",
        "application": {
          "id": "uuid",
          "name": "React",
          "category": {
            "id": "uuid",
            "name": "Frameworks"
          }
        },
        "title": "Invalid hook call",
        "description": "Hooks can only be called inside...",
        "severity": "high",
        "viewCount": 1500,
        "_count": {
          "solutions": 8
        },
        "solutions": [...]
      }
    ],
    "totalCount": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Get Search Suggestions
**GET** `/search/suggestions`

Query parameters:
- `query` (required): Search query (min 2 characters)
- `limit` (optional): Number of suggestions (default: 5, max: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "type": "error",
      "value": "React: E123",
      "label": "Invalid hook call"
    },
    {
      "type": "popular",
      "value": "react hooks",
      "label": "Popular search: react hooks"
    }
  ]
}
```

### Get Search History
**GET** `/search/history`

Query parameters:
- `limit` (optional): Number of history items (default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "query": "react hooks",
      "filters": {
        "severity": "high"
      },
      "resultCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Clear Search History
**DELETE** `/search/history`

Response:
```json
{
  "success": true,
  "message": "Search history cleared"
}
```

### Delete Search History Item
**DELETE** `/search/history/{id}`

Response:
```json
{
  "success": true,
  "message": "Search history deleted"
}
```

### Get Search Trends (Admin)
**GET** `/search/trends`

Query parameters:
- `days` (optional): Number of days (default: 7, max: 90)

Response:
```json
{
  "success": true,
  "data": [
    {
      "query": "react hooks",
      "count": 150
    },
    {
      "query": "typescript errors",
      "count": 89
    }
  ]
}
```

---

## Bookmarks Endpoints

### Get User Bookmarks
**GET** `/bookmarks`

Query parameters:
- `page` (optional): Pagination page (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

Response:
```json
{
  "success": true,
  "data": {
    "bookmarks": [
      {
        "id": "uuid",
        "userId": "uuid",
        "solutionId": "uuid",
        "note": "Helpful for debugging",
        "solution": {
          "id": "uuid",
          "solutionText": "Solution text...",
          "score": 43,
          "error": {
            "code": "E123",
            "application": {
              "name": "React"
            }
          }
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalCount": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### Create Bookmark
**POST** `/bookmarks`

Request body:
```json
{
  "solutionId": "uuid",
  "note": "Optional note about the solution"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "bookmark": {
      "id": "uuid",
      "userId": "uuid",
      "solutionId": "uuid",
      "note": "Optional note",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Delete Bookmark
**DELETE** `/bookmarks/{id}`

Response:
```json
{
  "success": true,
  "message": "Bookmark deleted"
}
```

### Update Bookmark Note
**PATCH** `/bookmarks/{id}`

Request body:
```json
{
  "note": "Updated note text"
}
```

### Check Bookmark Status
**GET** `/bookmarks/check/{solutionId}`

Response:
```json
{
  "success": true,
  "data": {
    "isBookmarked": true
  }
}
```

---

## Notifications Endpoints

### Get User Notifications
**GET** `/notifications`

Query parameters:
- `unread` (optional): Filter by unread only (true/false)
- `page` (optional): Pagination page (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

Response:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "solution_verified",
        "title": "Solution Verified",
        "message": "Your solution for React: E123 has been verified",
        "resourceType": "solution",
        "resourceId": "uuid",
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalCount": 50,
    "unreadCount": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Unread Count
**GET** `/notifications/unread-count`

Response:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### Mark Notification as Read
**PATCH** `/notifications/{id}/read`

Response:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
**PATCH** `/notifications/read-all`

Response:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Delete Notification
**DELETE** `/notifications/{id}`

Response:
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Categories Endpoints

### Get All Categories
**GET** `/categories`

Query parameters:
- `parentId` (optional): Filter by parent category
- `includeChildren` (optional): Include child categories

Response:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Programming Languages",
        "slug": "programming-languages",
        "description": "Programming language errors",
        "icon": "code",
        "parentId": null,
        "children": [...]
      }
    ]
  }
}
```

### Get Category by Slug
**GET** `/categories/{slug}`

Response: Single category object with applications

---

## Applications Endpoints

### Get Applications
**GET** `/applications`

Query parameters:
- `categoryId` (optional): Filter by category
- `search` (optional): Search by name
- `page` (optional): Pagination page
- `limit` (optional): Items per page

Response:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid",
        "name": "React",
        "slug": "react",
        "description": "React JavaScript library",
        "logoUrl": "/logos/react.png",
        "categoryId": "uuid",
        "websiteUrl": "https://reactjs.org",
        "errorCount": 150
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### Get Application by Slug
**GET** `/applications/{slug}`

Response: Single application with error codes count

---

## Error Codes Endpoints

### Search Error Codes
**GET** `/errors`

Query parameters:
- `applicationId` (optional): Filter by application
- `search` (optional): Search by code or title
- `severity` (optional): Filter by severity
- `page` (optional): Pagination page
- `limit` (optional): Items per page

Response:
```json
{
  "success": true,
  "data": {
    "errors": [
      {
        "id": "uuid",
        "code": "E123",
        "application": {
          "id": "uuid",
          "name": "React",
          "slug": "react"
        },
        "title": "Invalid hook call",
        "description": "Hooks can only be called inside...",
        "severity": "high",
        "viewCount": 1500,
        "solutionCount": 8,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Get Error Code Detail
**GET** `/errors/{id}`

Response:
```json
{
  "success": true,
  "data": {
    "error": {
      "id": "uuid",
      "code": "E123",
      "application": {
        "id": "uuid",
        "name": "React",
        "slug": "react"
      },
      "title": "Invalid hook call",
      "description": "Hooks can only be called inside...",
      "severity": "high",
      "metadata": {
        "commonCauses": ["..."]
      },
      "viewCount": 1501,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "solutions": [
      {
        "id": "uuid",
        "solutionText": "Make sure you're not calling...",
        "author": {
          "id": "uuid",
          "username": "expertuser",
          "displayName": "Expert User"
        },
        "upvotes": 45,
        "downvotes": 2,
        "score": 43,
        "isVerified": true,
        "userVote": "upvote",
        "createdAt": "2024-01-02T00:00:00Z"
      }
    ]
  }
}
```

### Create Error Code (Admin)
**POST** `/errors`

Request body:
```json
{
  "code": "E123",
  "applicationId": "uuid",
  "title": "Error title",
  "description": "Error description",
  "severity": "high",
  "metadata": {}
}
```

---

## Solutions Endpoints

### Add Solution
**POST** `/errors/{errorId}/solutions`

Request body:
```json
{
  "solutionText": "Step by step solution..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "solution": {
      "id": "uuid",
      "solutionText": "Step by step solution...",
      "author": {
        "id": "uuid",
        "username": "currentuser",
        "displayName": "Current User"
      },
      "upvotes": 0,
      "downvotes": 0,
      "score": 0,
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Vote on Solution
**POST** `/solutions/{solutionId}/vote`

Request body:
```json
{
  "voteType": "upvote"
}
```

Response: Updated solution with new vote counts

### Update Solution (Owner/Admin)
**PUT** `/solutions/{solutionId}`

Request body:
```json
{
  "solutionText": "Updated solution text..."
}
```

### Delete Solution (Owner/Admin)
**DELETE** `/solutions/{solutionId}`

---

## Users Endpoints

### Get User Profile
**GET** `/users/{userId}`

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "username",
      "displayName": "User Display Name",
      "avatarUrl": null,
      "bio": "Software developer...",
      "reputation": 150,
      "solutionCount": 15,
      "verifiedSolutionCount": 3,
      "joinedAt": "2024-01-01T00:00:00Z"
    },
    "recentSolutions": [...],
    "topSolutions": [...]
  }
}
```

### Get User Stats
**GET** `/users/{userId}/stats`

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "username",
      "displayName": "User Display Name",
      "avatarUrl": null,
      "reputation": 150,
      "solutionCount": 15,
      "verifiedSolutionCount": 3,
      "upvoteReceivedCount": 120
    },
    "achievements": [
      {
        "id": "uuid",
        "badge": {
          "name": "Solution Expert",
          "description": "Submitted 50 solutions",
          "icon": "🏆",
          "tier": "silver",
          "points": 100
        },
        "earnedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalPoints": 350,
    "badgeCount": 5
  }
}
```

### Update User Profile
**PUT** `/users/me`

Request body:
```json
{
  "displayName": "New Display Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Software developer..."
}
```

---

## Webhooks Endpoints

### Get User Webhooks
**GET** `/webhooks`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "url": "https://example.com/webhook",
      "events": ["solution.created", "error.created"],
      "isActive": true,
      "lastDeliveryAt": "2024-01-01T00:00:00Z",
      "lastDeliveryStatus": "success",
      "failureCount": 0,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Webhook
**POST** `/webhooks`

Request body:
```json
{
  "url": "https://example.com/webhook",
  "events": ["solution.created", "error.created", "solution.verified"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "uuid",
      "url": "https://example.com/webhook",
      "events": ["solution.created", "error.created", "solution.verified"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "secret": "webhook_secret_for_signature_verification"
  }
}
```

### Update Webhook
**PATCH** `/webhooks/{id}`

Request body:
```json
{
  "url": "https://example.com/new-webhook",
  "events": ["solution.created"],
  "isActive": true
}
```

### Delete Webhook
**DELETE** `/webhooks/{id}`

Response:
```json
{
  "success": true,
  "message": "Webhook deleted"
}
```

### Regenerate Webhook Secret
**POST** `/webhooks/{id}/regenerate-secret`

Response:
```json
{
  "success": true,
  "data": {
    "secret": "new_webhook_secret"
  }
}
```

### Get Webhook Delivery History
**GET** `/webhooks/{id}/deliveries`

Query parameters:
- `limit` (optional): Number of deliveries (default: 50, max: 100)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event": "solution.created",
      "payload": {...},
      "responseStatus": 200,
      "deliveredAt": "2024-01-01T00:00:00Z",
      "success": true
    }
  ]
}
```

### Get Webhook Event Types
**GET** `/webhooks/events/types`

Response:
```json
{
  "success": true,
  "data": [
    {
      "key": "ERROR_CREATED",
      "value": "error.created",
      "description": "Triggered when a new error code is created"
    },
    {
      "key": "SOLUTION_CREATED",
      "value": "solution.created",
      "description": "Triggered when a new solution is submitted"
    }
  ]
}
```

**Available Events:**
- `error.created` - New error code created
- `error.updated` - Error code updated
- `solution.created` - New solution submitted
- `solution.verified` - Solution verified
- `solution.upvoted` - Solution upvoted
- `user.registered` - New user registered
- `category.created` - New category created
- `application.created` - New application created

---

## Export Endpoints

### Get Export Statistics
**GET** `/export/stats`

Response:
```json
{
  "success": true,
  "data": {
    "totalErrors": 1500,
    "totalSolutions": 4500,
    "totalUsers": 850,
    "totalApplications": 45,
    "totalCategories": 12,
    "dateRange": {
      "earliest": "2024-01-01T00:00:00Z",
      "latest": "2024-12-31T23:59:59Z"
    }
  }
}
```

### Export Errors (Admin)
**GET** `/export/errors`

Query parameters:
- `format` (optional): json or csv (default: json)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

Response: File download (JSON or CSV)

### Export Solutions (Admin)
**GET** `/export/solutions`

Query parameters:
- `format` (optional): json or csv (default: json)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

Response: File download (JSON or CSV)

### Export User Data
**GET** `/export/user-data`

Response: User data export in JSON format

### Export Analytics (Admin)
**GET** `/export/analytics`

Query parameters:
- `format` (optional): json or csv (default: json)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

Response: Analytics data export

---

## Admin Endpoints

### Verify Solution
**POST** `/admin/solutions/{solutionId}/verify`

Response: Solution with verified status

### Manage Users
- **GET** `/admin/users` - List all users
- **PUT** `/admin/users/{userId}` - Update user role
- **DELETE** `/admin/users/{userId}` - Delete user

### Manage Error Codes
- **POST** `/admin/errors` - Create error code
- **PUT** `/admin/errors/{errorId}` - Update error code
- **DELETE** `/admin/errors/{errorId}` - Delete error code

### Content Moderation
- **GET** `/admin/solutions/moderation` - Get solutions for moderation
- **POST** `/admin/solutions/bulk-moderation` - Bulk moderate solutions

### System Logs
- **GET** `/admin/system/logs` - Get system logs

---

## Rate Limiting

- **Public endpoints**: 100 requests per hour per IP
- **Authenticated endpoints**: 1000 requests per hour per user
- **Authentication endpoints**: 5 requests per minute per IP
- **Critical endpoints**: Additional rate limiting as needed

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

---

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3010/api-docs`
- **OpenAPI Spec**: `http://localhost:3010/openapi.yaml`

This API specification provides a comprehensive set of endpoints for the error database application with proper authentication, pagination, and error handling.
