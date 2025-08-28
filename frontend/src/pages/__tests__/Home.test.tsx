import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../Home';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API service
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('Home Page', () => {
  const mockUseAuthStore = useAuthStore as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API response
    const { api } = require('@/services/api');
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          totalErrors: 100,
          totalSolutions: 250,
          totalUsers: 50,
          recentErrors: [
            {
              id: 1,
              code: 'ERR001',
              message: 'Test Error 1',
              application: { name: 'Test App' },
              _count: { solutions: 5 },
            },
            {
              id: 2,
              code: 'ERR002',
              message: 'Test Error 2',
              application: { name: 'Test App 2' },
              _count: { solutions: 3 },
            },
          ],
        },
      },
    });
  });

  it('renders loading state initially', () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders statistics when data is loaded', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // totalErrors
      expect(screen.getByText('250')).toBeInTheDocument(); // totalSolutions
      expect(screen.getByText('50')).toBeInTheDocument(); // totalUsers
    });
  });

  it('renders recent errors section', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Errors')).toBeInTheDocument();
      expect(screen.getByText('ERR001')).toBeInTheDocument();
      expect(screen.getByText('Test Error 1')).toBeInTheDocument();
      expect(screen.getByText('ERR002')).toBeInTheDocument();
      expect(screen.getByText('Test Error 2')).toBeInTheDocument();
    });
  });

  it('shows welcome message for authenticated users', async () => {
    const mockUser = { username: 'testuser', email: 'test@example.com' };
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText(`Welcome back, ${mockUser.username}!`)).toBeInTheDocument();
    });
  });

  it('shows general welcome message for unauthenticated users', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Error Database')).toBeInTheDocument();
      expect(screen.getByText('Discover and share solutions to common errors')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    const { api } = require('@/services/api');
    api.get.mockRejectedValue(new Error('API Error'));
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
    });
  });

  it('renders search functionality', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search error codes or messages...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });
  });

  it('renders call-to-action buttons', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Browse Errors' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contribute Solution' })).toBeInTheDocument();
    });
  });
});