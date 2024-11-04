'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  themeStatus: string;
  setThemeStatus: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeStatus, setThemeStatus] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setThemeStatus(savedTheme);
    document.body.className = `${document.body.className.replace(/light|dark/g, '')} ${savedTheme}`.trim();
  }, []);

  const handleThemeChange = (theme: string) => {
    setThemeStatus(theme);
    localStorage.setItem('theme', theme);
    document.body.className = `${document.body.className.replace(/light|dark/g, '')} ${theme}`.trim();
  };

  return (
    <ThemeContext.Provider value={{ themeStatus, setThemeStatus: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
