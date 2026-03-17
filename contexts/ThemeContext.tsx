import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    primaryLight: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    cardElevated: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    notification: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    overlay: string;
    shimmer: string;
    gradient: {
      primary: string[];
      secondary: string[];
      accent: string[];
      home: string[];
      journal: string[];
      chat: string[];
      insights: string[];
      card: string[];
      button: string[];
    };
  };
}

const lightColors = {
  primary: '#6C63FF',
  primaryLight: '#EEE8FF',
  secondary: '#FF6B6B',
  secondaryLight: '#FFE8E8',
  accent: '#00D2FF',
  background: '#F8F9FE',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#1A1D2E',
  textSecondary: '#6E7191',
  textMuted: '#A0A3BD',
  border: '#EFF0F6',
  borderLight: '#F7F7FC',
  notification: '#FF6B6B',
  success: '#00C48C',
  successLight: '#E6FAF2',
  warning: '#FFB020',
  warningLight: '#FFF5E0',
  danger: '#FF6B6B',
  dangerLight: '#FFE8E8',
  overlay: 'rgba(26, 29, 46, 0.5)',
  shimmer: 'rgba(108, 99, 255, 0.05)',
  gradient: {
    primary: ['#6C63FF', '#8B5CF6'],
    secondary: ['#FF6B6B', '#FF8E8E'],
    accent: ['#00D2FF', '#7B68EE'],
    home: ['#F0EDFF', '#F8F9FE'],
    journal: ['#FFF0F0', '#FFF8F8'],
    chat: ['#E8F4FF', '#F0EDFF'],
    insights: ['#E8FFF0', '#F0EDFF'],
    card: ['#FFFFFF', '#F8F9FE'],
    button: ['#6C63FF', '#8B5CF6'],
  },
};

const darkColors = {
  primary: '#8B7DFF',
  primaryLight: '#2A2640',
  secondary: '#FF8E8E',
  secondaryLight: '#3D2020',
  accent: '#5DDFFF',
  background: '#0F1123',
  surface: '#1A1D35',
  card: '#1E2140',
  cardElevated: '#252850',
  text: '#F0F0FF',
  textSecondary: '#A0A3C4',
  textMuted: '#6E7191',
  border: '#2A2D4A',
  borderLight: '#1E2140',
  notification: '#FF8E8E',
  success: '#5DFFC3',
  successLight: '#1A3D2E',
  warning: '#FFD166',
  warningLight: '#3D3020',
  danger: '#FF8E8E',
  dangerLight: '#3D2020',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: 'rgba(139, 125, 255, 0.08)',
  gradient: {
    primary: ['#6C63FF', '#8B5CF6'],
    secondary: ['#FF6B6B', '#FF8E8E'],
    accent: ['#00D2FF', '#7B68EE'],
    home: ['#0F1123', '#1A1D35'],
    journal: ['#1A1025', '#1A1D35'],
    chat: ['#101530', '#1A1D35'],
    insights: ['#0F1A23', '#1A1D35'],
    card: ['#1E2140', '#252850'],
    button: ['#6C63FF', '#8B5CF6'],
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
