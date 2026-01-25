import { ThemeConfig, ThemeColors, ThemeTypography } from './types';

export const AVAILABLE_THEMES: ThemeConfig[] = [
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

export function getThemeConfig(name: string): ThemeConfig | null {
  return AVAILABLE_THEMES.find((theme) => theme.name === name) || null;
}

export function getAvailableThemes(): ThemeConfig[] {
  return AVAILABLE_THEMES;
}
