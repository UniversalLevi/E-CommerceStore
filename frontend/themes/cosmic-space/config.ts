import { ThemeConfig } from '../base/types';

export const cosmicSpaceThemeConfig: ThemeConfig = {
  name: 'cosmic-space',
  displayName: 'Cosmic Space',
  description: 'Premium futuristic space theme with stunning purple-blue gradients and modern aesthetics',
  category: 'luxury',
  defaultColors: {
    primary: '#a78bfa',
    secondary: '#1e1b4b',
    background: '#0a0a0f',
    text: '#e9d5ff',
    accent: '#6366f1',
    border: '#4c1d95',
    hover: '#8b5cf6',
  },
  defaultTypography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '600',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
