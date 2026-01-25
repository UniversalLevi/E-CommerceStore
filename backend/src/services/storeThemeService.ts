import * as fs from 'fs/promises';
import * as path from 'path';

export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'dark' | 'tech' | 'custom';
  previewImage?: string;
  defaultColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  defaultTypography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
  };
  customizableProperties: string[];
}

export interface ThemeCustomization {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  layout?: Record<string, any>;
  logo?: string;
}

// Available themes metadata
const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    name: 'minimal',
    displayName: 'Minimal',
    description: 'Clean and simple design with focus on content',
    category: 'minimal',
    defaultColors: {
      primary: '#000000',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#4a90d9',
    },
    defaultTypography: {
      fontFamily: 'system-ui, sans-serif',
      headingFont: 'system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'dark-theme',
    displayName: 'Dark Theme',
    description: 'Modern dark mode aesthetic with elegant design',
    category: 'dark',
    defaultColors: {
      primary: '#ffffff',
      secondary: '#1a1a1a',
      background: '#0a0a0a',
      text: '#e0e0e0',
      accent: '#6366f1',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'fashion-luxury',
    displayName: 'Fashion Luxury',
    description: 'Premium and elegant design for luxury brands',
    category: 'luxury',
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#f5f5f5',
      background: '#ffffff',
      text: '#2c2c2c',
      accent: '#d4af37',
    },
    defaultTypography: {
      fontFamily: 'Playfair Display, serif',
      headingFont: 'Playfair Display, serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'techy',
    displayName: 'Techy',
    description: 'Modern tech-focused design with bold elements',
    category: 'tech',
    defaultColors: {
      primary: '#000000',
      secondary: '#00ff88',
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#00ff88',
    },
    defaultTypography: {
      fontFamily: 'JetBrains Mono, monospace',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'black-premium',
    displayName: 'Black Premium',
    description: 'Sophisticated dark theme with premium feel',
    category: 'dark',
    defaultColors: {
      primary: '#ffffff',
      secondary: '#000000',
      background: '#000000',
      text: '#ffffff',
      accent: '#ffd700',
    },
    defaultTypography: {
      fontFamily: 'Montserrat, sans-serif',
      headingFont: 'Montserrat, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: '3d-theme',
    displayName: '3D Theme',
    description: 'Modern design with 3D elements and effects',
    category: 'modern',
    defaultColors: {
      primary: '#6366f1',
      secondary: '#ffffff',
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#8b5cf6',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'white',
    displayName: 'White',
    description: 'Light and airy design with spacious layout',
    category: 'minimal',
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#333333',
      accent: '#3b82f6',
    },
    defaultTypography: {
      fontFamily: 'system-ui, sans-serif',
      headingFont: 'system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'r765r786ry8r',
    displayName: 'Modern Gradient',
    description: 'Contemporary design with gradient accents',
    category: 'modern',
    defaultColors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#667eea',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
];

/**
 * Get all available themes
 */
export function getAvailableThemes(): ThemeConfig[] {
  return AVAILABLE_THEMES;
}

/**
 * Get theme configuration by name
 */
export function getThemeConfig(themeName: string): ThemeConfig | null {
  return AVAILABLE_THEMES.find((theme) => theme.name === themeName) || null;
}

/**
 * Validate theme customization values
 */
export function validateThemeCustomization(
  themeName: string,
  customizations: ThemeCustomization
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const theme = getThemeConfig(themeName);

  if (!theme) {
    errors.push(`Theme "${themeName}" does not exist`);
    return { valid: false, errors };
  }

  // Validate colors
  if (customizations.colors) {
    for (const [key, value] of Object.entries(customizations.colors)) {
      if (typeof value !== 'string') {
        errors.push(`Color "${key}" must be a string`);
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        errors.push(`Color "${key}" must be a valid hex color (e.g., #FF0000)`);
      }
    }
  }

  // Validate typography
  if (customizations.typography) {
    const requiredTypographyKeys = ['fontFamily', 'headingFont', 'fontSize'];
    for (const key of requiredTypographyKeys) {
      if (customizations.typography[key] && typeof customizations.typography[key] !== 'string') {
        errors.push(`Typography "${key}" must be a string`);
      }
    }
  }

  // Validate layout
  if (customizations.layout) {
    if (typeof customizations.layout !== 'object' || Array.isArray(customizations.layout)) {
      errors.push('Layout must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply theme to store (returns theme configuration with customizations merged)
 */
export function applyThemeToStore(
  themeName: string,
  customizations?: ThemeCustomization
): {
  name: string;
  customizations: ThemeCustomization;
} {
  const theme = getThemeConfig(themeName);
  if (!theme) {
    throw new Error(`Theme "${themeName}" does not exist`);
  }

  const defaultCustomizations: ThemeCustomization = {
    colors: { ...theme.defaultColors },
    typography: { ...theme.defaultTypography },
    layout: {},
  };

  // Merge customizations with defaults
  const mergedCustomizations: ThemeCustomization = {
    colors: {
      ...defaultCustomizations.colors,
      ...(customizations?.colors || {}),
    },
    typography: {
      ...defaultCustomizations.typography,
      ...(customizations?.typography || {}),
    },
    layout: {
      ...defaultCustomizations.layout,
      ...(customizations?.layout || {}),
    },
    logo: customizations?.logo,
  };

  return {
    name: themeName,
    customizations: mergedCustomizations,
  };
}
