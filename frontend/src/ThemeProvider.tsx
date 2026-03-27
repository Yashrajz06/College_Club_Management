import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from './lib/api';

interface ThemeConfig {
  collegeId: string;
  collegeName: string;
  brandingColor: string;
  brandingLogo: string | null;
}

const ThemeContext = createContext<{ 
  theme: ThemeConfig | null; 
  updateTheme: (config: Partial<ThemeConfig>) => void;
  loading: boolean;
}>({
  theme: null,
  updateTheme: () => {},
  loading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTheme = async (collegeId: string) => {
    try {
      const config = await apiFetch(`/theming/${collegeId}`);
      setTheme(config);
      
      // Apply CSS variables for dynamic theming
      if (config.brandingColor) {
        document.documentElement.style.setProperty('--brand-primary', config.brandingColor);
        // Create a semi-transparent version for overlays
        const r = parseInt(config.brandingColor.slice(1, 3), 16);
        const g = parseInt(config.brandingColor.slice(3, 5), 16);
        const b = parseInt(config.brandingColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);
      }
    } catch (err) {
      console.error('Failed to fetch college theme', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const collegeId = localStorage.getItem('collegeId');
    if (collegeId) {
      fetchTheme(collegeId);
    } else {
      setLoading(false);
    }

    // Listener for college switcher
    const handleCollegeChange = () => {
      const newId = localStorage.getItem('collegeId');
      if (newId) fetchTheme(newId);
    };

    window.addEventListener('storage', handleCollegeChange);
    return () => window.removeEventListener('storage', handleCollegeChange);
  }, []);

  const updateTheme = (config: Partial<ThemeConfig>) => {
    setTheme(prev => prev ? { ...prev, ...config } : null);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
