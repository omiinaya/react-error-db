# Error Database - Contributing Guidelines

Thank you for your interest in contributing to the Error Database project! This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for caching)
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   # Clone your fork
   git clone https://github.com/your-username/error-database.git
   cd error-database
   ```

2. **Set up development environment**
   ```bash
   # Backend setup
   cd backend
   npm install
   
   # Frontend setup
   cd ../frontend
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   
   # Update with your local database credentials
   DATABASE_URL="postgresql://user:password@localhost:5432/errdb"
   REDIS_URL="redis://localhost:6379"
   ```

4. **Database setup**
   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # Generate Prisma client
   npx prisma generate
   
   # Seed data
   npx prisma db seed
   ```

## 📝 Development Workflow

### Branch Naming Convention
Use the following prefix conventions for branches:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Examples:
- `feature/user-authentication`
- `fix/search-performance`
- `docs/api-documentation`

### Commit Message Guidelines

Use conventional commit messages:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add Google OAuth authentication

fix(search): resolve case-sensitive search issue

docs(api): update endpoint documentation
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear, focused commits
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass**
6. **Submit a pull request** to the `main` branch

### PR Description Template
```markdown
## Description
<!-- Describe your changes in detail -->

## Related Issues
<!-- Link to any related issues (e.g., Fixes #123) -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Testing
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Manual testing performed

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->
```

## 🧪 Testing

### Running Tests

**Backend tests:**
```bash
cd backend
npm test          # Run all tests
npm test:unit    # Run unit tests only
npm test:integration # Run integration tests
```

**Frontend tests:**
```bash
cd frontend
npm test          # Run all tests
npm test:unit    # Run unit tests only
npm test:e2e     # Run end-to-end tests
```

### Test Coverage
- Aim for 80%+ test coverage
- Write tests for new features
- Ensure edge cases are covered
- Mock external dependencies appropriately

### Writing Tests

**Backend example:**
```typescript
describe('AuthService', () => {
  it('should register a new user', async () => {
    const user = await authService.register({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(user).toHaveProperty('id');
  });
});
```

**Frontend example:**
```typescript
describe('LoginForm', () => {
  it('should validate email format', () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

## 🎨 Code Style

### TypeScript/JavaScript
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use async/await over promises
- Avoid `any` type - use proper type definitions

### Naming Conventions
- **Variables**: camelCase (`userData`, `isLoading`)
- **Components**: PascalCase (`UserProfile`, `ErrorCard`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: kebab-case (`user-service.ts`, `error-card.tsx`)

### Import Order
```typescript
// 1. External dependencies
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal dependencies
import { api } from '@/services/api';
import { User } from '@/types';

// 3. Relative imports
import { UserCard } from './UserCard';
import styles from './UserList.module.css';
```

## 📚 Documentation

### Code Documentation
- Use JSDoc for functions and components
- Document complex algorithms
- Explain non-obvious code decisions

**Example:**
```typescript
/**
 * Calculates the score for a solution based on votes
 * @param upvotes - Number of upvotes
 * @param downvotes - Number of downvotes
 * @returns The calculated score (upvotes - downvotes)
 */
function calculateScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
}
```

### Update Documentation
When making changes that affect:
- API endpoints → Update `docs/api-endpoints.md`
- Database schema → Update `docs/database-schema.md`
- Architecture → Update relevant architecture docs
- User-facing features → Update README and UI documentation

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Step-by-step reproduction guide
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Environment**: OS, Browser, Node.js version, etc.

## 💡 Feature Requests

When suggesting new features:

1. **Problem**: Describe the problem you're solving
2. **Solution**: Describe your proposed solution
3. **Alternatives**: Any alternative solutions considered
4. **Additional Context**: Any other relevant information

## 🔧 Development Tips

### Debugging
```bash
# Backend debugging
npm run dev        # Development with auto-reload
DEBUG=* npm start  # Enable debug logging

# Frontend debugging
npm run dev        # Development server
# Use React DevTools and browser dev tools
```

### Database Operations
```bash
# View database schema
npx prisma studio

# Create migration
npx prisma migrate dev --name add_user_profile

# Reset database
npx prisma migrate reset
```

### Code Quality
```bash
# Run linter
npm run lint

# Format code
npm run format

# Check types
npm run type-check
```

## 📊 Performance Considerations

- Optimize database queries with proper indexing
- Use pagination for large datasets
- Implement caching where appropriate
- Minimize bundle size with code splitting
- Use React.memo and useCallback for performance

## 🤝 Community

- Join our Discord/Slack channel
- Participate in code reviews
- Help answer questions
- Share your use cases and experiences

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making the Error Database better! 🎉