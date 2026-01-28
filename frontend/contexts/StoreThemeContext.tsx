'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeContextValue, StoreTheme, ThemeConfig, ThemeColors, ThemeTypography, ThemeLayout } from '@/themes/base/types';
import { getThemeConfig } from '@/themes/base/ThemeConfig';

interface StoreThemeContextType extends ThemeContextValue {
  setTheme: (theme: StoreTheme | null) => void;
}

const StoreThemeContext = createContext<StoreThemeContextType | undefined>(undefined);

export function useStoreTheme() {
  const context = useContext(StoreThemeContext);
  if (!context) {
    throw new Error('useStoreTheme must be used within a StoreThemeProvider');
  }
  return context;
}

interface StoreThemeProviderProps {
  children: ReactNode;
  storeTheme: StoreTheme | null;
  isLoading?: boolean;
}

export function StoreThemeProvider({ children, storeTheme, isLoading = false }: StoreThemeProviderProps) {
  // Default to minimal theme if no theme is provided
  const defaultTheme: StoreTheme = {
    name: 'minimal',
    customizations: {},
  };
  
  const [theme, setTheme] = useState<StoreTheme>(storeTheme || defaultTheme);

  useEffect(() => {
    if (storeTheme && storeTheme.name) {
      setTheme(storeTheme);
    } else {
      setTheme(defaultTheme);
    }
  }, [storeTheme]);

  // Get theme configuration - always use a valid theme
  const themeConfig: ThemeConfig | null = getThemeConfig(theme.name) || getThemeConfig('minimal');

  // Merge default colors with customizations
  const defaultColors = themeConfig?.defaultColors || {
    primary: '#000000',
    secondary: '#ffffff',
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#4a90d9',
  };
  const colors: ThemeColors = {
    ...defaultColors,
    ...(theme.customizations?.colors || {}),
  } as ThemeColors;

  // Merge default typography with customizations
  const defaultTypography = themeConfig?.defaultTypography || {
    fontFamily: 'system-ui, sans-serif',
    headingFont: 'system-ui, sans-serif',
    fontSize: '16px',
  };
  const typography: ThemeTypography = {
    ...defaultTypography,
    ...(theme.customizations?.typography || {}),
  } as ThemeTypography;

  // Get layout customizations or defaults
  const layout: ThemeLayout = theme?.customizations?.layout || {
    containerWidth: '1280px',
    spacing: '1rem',
    borderRadius: '0.5rem',
  };

  const logo = theme?.customizations?.logo;

  const handleSetTheme = (newTheme: StoreTheme | null) => {
    if (newTheme) {
      setTheme(newTheme);
    } else {
      setTheme(defaultTheme);
    }
  };

  const value: StoreThemeContextType = {
    theme,
    themeConfig,
    colors,
    typography,
    layout,
    logo,
    isLoading,
    setTheme: handleSetTheme,
  };

  // Apply CSS variables for theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-secondary', colors.secondary);
      root.style.setProperty('--theme-background', colors.background);
      root.style.setProperty('--theme-text', colors.text);
      root.style.setProperty('--theme-accent', colors.accent);
      root.style.setProperty('--theme-font-family', typography.fontFamily);
      root.style.setProperty('--theme-heading-font', typography.headingFont);
      root.style.setProperty('--theme-font-size', typography.fontSize);
      root.style.setProperty('--theme-container-width', layout.containerWidth || '1280px');
      root.style.setProperty('--theme-spacing', layout.spacing || '1rem');
      root.style.setProperty('--theme-border-radius', layout.borderRadius || '0.5rem');
    }
  }, [colors, typography, layout]);

  return <StoreThemeContext.Provider value={value}>{children}</StoreThemeContext.Provider>;
}
