# Error Database

A comprehensive error code database with community-driven solutions for developers. This project provides a platform where developers can search for error codes, find solutions, and contribute their own insights.

## 🚀 Features

- **Error Code Search**: Search across multiple applications and programming languages
- **Community Solutions**: User-contributed solutions with voting system
- **Categorization**: Organized by applications, frameworks, and programming languages
- **Authentication**: User registration and login with JWT
- **Modern Stack**: Built with React 18, TypeScript, Node.js, and PostgreSQL

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible components
- **React Router** for navigation
- **TanStack Query** for server state management
- **Zustand** for client state management

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **JWT** for authentication
- **Zod** for validation

### Development & Deployment
- **Docker** and **Docker Compose** for containerization
- **ESLint** and **Prettier** for code quality
- **Vitest** and **Jest** for testing

## 📦 Project Structure

```
error-database/
├── 📁 backend/                 # Node.js backend application
├── 📁 frontend/                # React frontend application
├── 📁 docs/                    # Project documentation
├── 📁 docker/                  # Docker configuration
├── 📄 docker-compose.yml       # Docker compose for development
├── 📄 package.json             # Root package.json for scripts
└── 📄 README.md               # Project overview
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (optional, can use Docker)
- Redis (optional, can use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd error-database
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Update the values in each .env file as needed
   ```

4. **Start with Docker (recommended)**
   ```bash
   docker-compose up -d
   ```
   
   This will start:
   - PostgreSQL database on port 5432
   - Redis on port 6379
   - Backend API on port 3001
   - Frontend app on port 3000
   - pgAdmin on port 5050 (optional)

5. **Or start manually**
   ```bash
   # Start backend
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   
   # Start frontend (in another terminal)
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - pgAdmin: http://localhost:5050 (admin/admin)

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build both frontend and backend
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Lint both frontend and backend

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code

## 🗄️ Database

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **categories** - Application categories (Programming Languages, Frameworks, etc.)
- **applications** - Specific applications (React, Node.js, Python, etc.)
- **error_codes** - Error codes with metadata
- **solutions** - User-contributed solutions
- **votes** - Solution voting system

### Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# View database in browser
npx prisma studio
```

## 🔧 Configuration

### Environment Variables

See `.env.example`, `backend/.env.example`, and `frontend/.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `REDIS_URL` - Redis connection string
- `VITE_API_BASE_URL` - Frontend API base URL

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Frontend Testing
```bash
cd frontend
npm test          # Run tests once
npm run test:ui   # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please:

1. Check the [documentation](docs/)
2. Search existing issues
3. Create a new issue with details about your problem

## 🙏 Acknowledgments

- Inspired by the need for better error code documentation
- Built with modern web technologies and best practices
- Community-driven approach to problem solving

---

**Happy coding! 🚀**