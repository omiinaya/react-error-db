# Error Database

A comprehensive error code database with community-driven solutions for developers. This project provides a platform where developers can search for error codes, find solutions, contribute their own insights, and engage with the community.

## 🚀 Features

### Core Features
- **Error Code Search**: Search across multiple applications and programming languages
- **Advanced Search**: Full-text search with filters (severity, application, category)
- **Community Solutions**: User-contributed solutions with voting system
- **Solution Verification**: Verified solutions by trusted users
- **Categorization**: Organized by applications, frameworks, and programming languages
- **Authentication**: User registration and login with JWT

### Phase 2 - Enhanced Features
- **Search Suggestions**: Autocomplete with popular searches
- **Search History**: Track and revisit previous searches
- **Search Analytics**: Insights into popular searches (admin)
- **Advanced Filtering**: Filter by severity, application, category, has solutions
- **Sorting Options**: Sort by relevance, newest, popular, most solutions

### Phase 3 - Advanced Features
- **Bookmarks**: Save solutions with personal notes
- **Notifications**: Real-time in-app notifications for events
- **Achievements/Badges**: Gamification with bronze, silver, gold, platinum tiers
- **User Stats**: Track reputation, solutions, upvotes
- **Webhooks**: External integrations with event subscriptions
- **Data Export**: Export errors, solutions, analytics in JSON/CSV

### Additional Features
- **Markdown Support**: Rich text formatting for solutions
- **Internationalization**: Multi-language support (English/Spanish)
- **Dark Mode**: Theme switching support
- **Admin Panel**: Content moderation and system management
- **API Documentation**: Interactive Swagger UI

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible components
- **React Router** for navigation
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Hot Toast** for notifications
- **i18next** for internationalization

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **JWT** for authentication with refresh tokens
- **Zod** for validation
- **Winston** for logging
- **Prometheus** for metrics

### Development & Deployment
- **Docker** and **Docker Compose** for containerization
- **ESLint** and **Prettier** for code quality
- **Vitest** and **Jest** for testing
- **GitHub Actions** for CI/CD

## 📦 Project Structure

```
error-database/
├── 📁 backend/                 # Node.js backend application
│   ├── 📁 src/
│   │   ├── 📁 routes/         # API route handlers
│   │   ├── 📁 services/       # Business logic services
│   │   ├── 📁 middleware/     # Express middleware
│   │   ├── 📁 prisma/         # Database schema
│   │   └── 📁 types/          # TypeScript types
│   ├── 📁 prisma/migrations/  # Database migrations
│   └── 📄 openapi.yaml          # API specification
├── 📁 frontend/               # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/     # React components
│   │   ├── 📁 pages/          # Page components
│   │   ├── 📁 services/       # API services
│   │   ├── 📁 store/          # State management
│   │   └── 📁 hooks/          # Custom hooks
│   └── 📁 public/             # Static assets
├── 📁 docs/                   # Project documentation
├── 📁 docker/                 # Docker configuration
├── 📄 docker-compose.yml      # Docker compose for development
└── 📄 README.md               # Project overview
```

## 📚 Documentation

- **OpenAPI spec**: See `openapi.json` for full API reference.

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (optional but recommended)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Development Setup

#### Option 1: Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd error-database
```

2. **Set up environment variables**
```bash
# Copy the example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update the values in each .env file as needed
# At minimum, set DATABASE_URL and JWT_SECRET
```

3. **Start with Docker**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5450
- Redis on port 6380
- Backend API on port 3010
- Frontend app on port 3005
- pgAdmin on port 5050 (optional)

4. **Run database migrations**
```bash
cd backend
npx prisma migrate dev
```

5. **Access the application**
- Frontend: http://localhost:3005
- Backend API: http://localhost:3010/api
- API Documentation: http://localhost:3010/api-docs
- pgAdmin: http://localhost:5050

#### Option 2: Manual Setup

1. **Start backend**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

2. **Start frontend (in another terminal)**
```bash
cd frontend
npm install
npm run dev
```

## 📋 Available Scripts

### Root Level
```bash
# Install dependencies for both frontend and backend
npm run install:all

# Start both in development mode
npm run dev

# Build both
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Backend
```bash
cd backend

# Development server with hot reload
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Testing
npm test
npm run test:coverage

# Backup operations
npm run backup:create
npm run backup:list
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build
npm run preview

# Testing
npm test

# Linting
npm run lint
```

## 🔌 API Endpoints

The API provides comprehensive endpoints for all features:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Search (Phase 2)
- `GET /api/search` - Advanced search with filters
- `GET /api/search/suggestions` - Autocomplete
- `GET /api/search/history` - Search history
- `DELETE /api/search/history` - Clear history
- `GET /api/search/trends` - Search trends (admin)

### Bookmarks (Phase 3)
- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark
- `GET /api/bookmarks/check/:solutionId` - Check status

### Notifications (Phase 3)
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Webhooks (Phase 3)
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/regenerate-secret` - Regenerate secret
- `GET /api/webhooks/:id/deliveries` - Get delivery history

### Export (Phase 3)
- `GET /api/export/stats` - Export statistics
- `GET /api/export/errors` - Export errors (admin)
- `GET /api/export/solutions` - Export solutions (admin)
- `GET /api/export/user-data` - Export user data
- `GET /api/export/analytics` - Export analytics (admin)

### And more...

**Full API documentation**: http://localhost:3010/api-docs

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

### Core Tables
- **users** - User accounts with extended profile fields
- **categories** - Hierarchical category system
- **applications** - Specific applications/frameworks
- **error_codes** - Error codes with metadata
- **solutions** - User-contributed solutions
- **votes** - Solution voting system

### Phase 2 & 3 Tables
- **search_history** - User search history
- **search_analytics** - Aggregated search data
- **bookmarks** - User bookmarks
- **notifications** - In-app notifications
- **badges** - Achievement badges
- **achievements** - User earned badges
- **follows** - User following relationships
- **webhooks** - Webhook configurations
- **webhook_deliveries** - Webhook delivery history
- **audit_logs** - System audit logs
- **category_requests** - Category creation requests

**Full schema documentation**: See `docs/database-schema.md`

## 🎯 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/errdb"

# Redis
REDIS_URL="redis://localhost:6380"

# JWT
JWT_SECRET="your-super-secret-jwt-key-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars"

# Server
PORT=3010
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:3005"

# Rate Limiting
RATE_LIMIT_MAX=1000
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3010/api
VITE_APP_NAME=Error Database
```

## 🔒 Security Features

- **Authentication**: JWT with refresh token rotation
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Tiered rate limiting per endpoint
- **Security Headers**: Helmet.js with custom CSP
- **CORS**: Configured for local network access
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📊 Monitoring & Analytics

- **Health Checks**: `/health` endpoint with detailed status
- **Metrics**: Prometheus metrics at `/metrics`
- **Logging**: Winston logger with daily rotation
- **Search Analytics**: Track popular searches and trends
- **Uptime Monitoring**: Automated uptime checks

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                 # Run all tests
npm run test:ui          # UI mode
```

### E2E Tests
```bash
npm run test:e2e         # Run Playwright tests
```

## 📚 Documentation

- **API Documentation**: Interactive Swagger UI at `/api-docs`
- **OpenAPI Spec**: Available at `/openapi.yaml`
- **Database Schema**: See `docs/database-schema.md`
- **API Endpoints**: See `docs/api-endpoints.md`
- **Architecture**: See `docs/architecture-overview.md`
- **Deployment Guide**: See `docs/deployment-guide.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Prisma](https://www.prisma.io/) for the excellent ORM
- [TanStack Query](https://tanstack.com/query) for data fetching

---

Built with ❤️ for the developer community
