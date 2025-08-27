# Error Database - API Endpoints Specification

## Base URL
```
https://api.errdb.example.com/v1
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
    "token": "jwt_token"
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
      "isAdmin": false
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
        "userVote": "upvote", // null if not voted
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
  "voteType": "upvote" // or "downvote"
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

## User Endpoints

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
      "joinedAt": "2024-01-01T00:00:00Z",
      "stats": {
        "solutionsSubmitted": 15,
        "solutionsVerified": 3,
        "totalUpvotes": 120,
        "totalDownvotes": 5
      }
    },
    "recentSolutions": [...],
    "topSolutions": [...]
  }
}
```

### Update User Profile
**PUT** `/users/me`

Request body:
```json
{
  "displayName": "New Display Name",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

## Admin Endpoints

### Verify Solution
**POST** `/admin/solutions/{solutionId}/verify`

Response: Solution with verified status

### Manage Users
**GET** `/admin/users` - List all users
**PUT** `/admin/users/{userId}` - Update user role
**DELETE** `/admin/users/{userId}` - Delete user

### Manage Error Codes
**POST** `/admin/errors` - Create error code
**PUT** `/admin/errors/{errorId}` - Update error code
**DELETE** `/admin/errors/{errorId}` - Delete error code

## Search Endpoint

### Global Search
**GET** `/search`

Query parameters:
- `q`: Search query
- `type`: Filter by type (errors, applications, categories)
- `page`: Pagination page
- `limit`: Items per page

Response:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "error",
        "id": "uuid",
        "code": "E123",
        "title": "Invalid hook call",
        "application": "React",
        "score": 0.95
      },
      {
        "type": "application",
        "id": "uuid",
        "name": "React",
        "description": "JavaScript library",
        "score": 0.85
      }
    ]
  }
}
```

## Rate Limiting
- Public endpoints: 100 requests per hour per IP
- Authenticated endpoints: 1000 requests per hour per user
- Critical endpoints: Additional rate limiting as needed

This API specification provides a comprehensive set of endpoints for the error database application with proper authentication, pagination, and error handling.