import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    success: string;
    warning: string;
    danger: string;
    gradient: {
      primary: string[];
      secondary: string[];
      home: string[];
      journal: string[];
      chat: string[];
      insights: string[];
    };
  };
}

const lightColors = {
  primary: '#7C3AED',
  secondary: '#F97316',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  notification: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gradient: {
    primary: ['#7C3AED', '#5B21B6'],
    secondary: ['#F97316', '#EA580C'],
    home: ['#F0F4FF', '#FFFFFF'],
    journal: ['#FFF7ED', '#FFFFFF'],
    chat: ['#F3E8FF', '#FFFFFF'],
    insights: ['#EDE9FE', '#FFFFFF'],
  },
};

const darkColors = {
  primary: '#A78BFA',
  secondary: '#FDBA74',
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  notification: '#FECACA',
  success: '#6EE7B7',
  warning: '#FDE68A',
  danger: '#FECACA',
  gradient: {
    primary: ['#5B21B6', '#7C3AED'],
    secondary: ['#EA580C', '#F97316'],
    home: ['#1E1B4B', '#1F2937'],
    journal: ['#4C1D95', '#1F2937'],
    chat: ['#5B21B6', '#1F2937'],
    insights: ['#7C3AED', '#1F2937'],
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};