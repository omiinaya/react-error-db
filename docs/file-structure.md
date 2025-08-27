# Error Database - File Structure Organization

## Project Root Structure
```
error-database/
├── 📁 backend/                 # Node.js backend application
├── 📁 frontend/                # React frontend application
├── 📁 docs/                    # Project documentation
├── 📁 scripts/                 # Utility scripts
├── 📁 docker/                  # Docker configuration
├── 📄 docker-compose.yml       # Docker compose for development
├── 📄 package.json             # Root package.json for scripts
├── 📄 README.md               # Project overview
├── 📄 .gitignore              # Git ignore rules
└── 📄 .env.example            # Environment variables template
```

## Backend Structure
```
backend/
├── 📁 src/
│   ├── 📁 controllers/         # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── error.controller.ts
│   │   ├── solution.controller.ts
│   │   ├── category.controller.ts
│   │   ├── application.controller.ts
│   │   └── user.controller.ts
│   ├── 📁 services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── error.service.ts
│   │   ├── solution.service.ts
│   │   ├── category.service.ts
│   │   ├── application.service.ts
│   │   └── user.service.ts
│   ├── 📁 middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── 📁 utils/               # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── apiResponse.ts
│   │   └── helpers.ts
│   ├── 📁 types/               # TypeScript type definitions
│   │   ├── express.d.ts
│   │   ├── user.types.ts
│   │   ├── error.types.ts
│   │   └── index.ts
│   ├── 📁 config/              # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── cors.ts
│   │   └── index.ts
│   ├── 📁 routes/              # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── error.routes.ts
│   │   ├── solution.routes.ts
│   │   ├── category.routes.ts
│   │   ├── application.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── 📁 prisma/              # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── 📁 migrations/
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
├── 📁 tests/                   # Test files
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 __mocks__/
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 .env
├── 📄 Dockerfile
└── 📄 nodemon.json
```

## Frontend Structure
```
frontend/
├── 📁 src/
│   ├── 📁 components/          # Reusable UI components
│   │   ├── 📁 ui/              # shadcn/ui components
│   │   ├── 📁 layout/          # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Layout.tsx
│   │   ├── 📁 auth/            # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── 📁 error/           # Error-related components
│   │   │   ├── ErrorCard.tsx
│   │   │   ├── ErrorDetail.tsx
│   │   │   ├── ErrorSearch.tsx
│   │   │   └── SolutionList.tsx
│   │   ├── 📁 common/          # Common components
│   │   │   ├── Loading.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── 📁 icons/           # Icon components
│   ├── 📁 pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── ErrorDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Admin.tsx
│   ├── 📁 hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── 📁 contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── AppContext.tsx
│   ├── 📁 services/            # API service functions
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── error.service.ts
│   │   ├── solution.service.ts
│   │   └── user.service.ts
│   ├── 📁 utils/               # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   ├── 📁 types/               # TypeScript types
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── error.types.ts
│   │   └── index.ts
│   ├── 📁 styles/              # Global styles
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── 📁 components/      # Component-specific styles
│   ├── 📁 assets/              # Static assets
│   │   ├── 📁 images/
│   │   ├── 📁 icons/
│   │   └── 📁 fonts/
│   ├── App.tsx                 # Main App component
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts          # Vite type definitions
├── 📁 public/                  # Public assets
│   ├── favicon.ico
│   ├── index.html
│   └── 📁 assets/
├── 📁 tests/                   # Test files
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 __mocks__/
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 tsconfig.json
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
└── 📄 index.html
```

## Documentation Structure
```
docs/
├── 📄 architecture-overview.md
├── 📄 technology-stack.md
├── 📄 database-schema.md
├── 📄 api-endpoints.md
├── 📄 development-roadmap.md
├── 📄 file-structure.md
├── 📄 deployment-guide.md
├── 📄 contributing.md
└── 📄 api-reference.md
```

## Configuration Files

### Backend package.json Highlights
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

### Frontend package.json Highlights
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/errdb"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:3001/api"
VITE_APP_NAME="Error Database"
```

## Naming Conventions

### File Naming
- **Components**: PascalCase (e.g., `ErrorCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: camelCase with .types.ts (e.g., `user.types.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_CONSTANTS.ts`)

### Folder Naming
- Use kebab-case for folder names
- Group related functionality together
- Keep folder structure flat when possible

This file structure provides a scalable and organized foundation for the error database application, making it easy to maintain and extend as the project grows.