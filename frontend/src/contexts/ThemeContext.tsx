import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage first, then fallback to 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // For authenticated users, get theme from backend
        if (isAuthenticated && user) {
          try {
            const response = await api.getThemePreference();
            const backendTheme = response.themePreference;
            
            // Only update theme if backend has a valid preference
            // Don't overwrite localStorage if backend returns null/undefined
            if (backendTheme && (backendTheme === 'light' || backendTheme === 'dark')) {
              setTheme(backendTheme);
              localStorage.setItem('theme', backendTheme);
            } else {
              // If backend has no preference, use existing localStorage value
              const savedTheme = localStorage.getItem('theme') as Theme;
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              
              if (savedTheme) {
                setTheme(savedTheme);
              } else if (systemPrefersDark) {
                setTheme('dark');
              }
            }
          } catch (error) {
            console.error('Failed to fetch theme preference:', error);
            // Fallback to localStorage if backend fetch fails
            const savedTheme = localStorage.getItem('theme') as Theme;
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme) {
              setTheme(savedTheme);
            } else if (systemPrefersDark) {
              setTheme('dark');
            }
          }
        } else {
          // For unauthenticated users, use localStorage or system preference
          const savedTheme = localStorage.getItem('theme') as Theme;
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          if (savedTheme) {
            setTheme(savedTheme);
          } else if (systemPrefersDark) {
            setTheme('dark');
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme preference:', error);
        // Fallback to localStorage if backend fetch fails
        const savedTheme = localStorage.getItem('theme') as Theme;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
          setTheme(savedTheme);
        } else if (systemPrefersDark) {
          setTheme('dark');
        }
      }
    };

    initializeTheme();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Update document class and localStorage when theme changes
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Update backend if user is authenticated
    const updateBackendTheme = async () => {
      if (isAuthenticated && user) {
        try {
          await api.updateThemePreference({ themePreference: theme });
        } catch (error) {
          console.error('Failed to update theme preference on backend:', error);
        }
      }
    };

    updateBackendTheme();
  }, [theme, isAuthenticated, user]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};