import { ThemeConfig } from '../base/types';

export const forestNatureThemeConfig: ThemeConfig = {
  name: 'forest-nature',
  displayName: 'Forest Nature',
  description: 'Natural green theme inspired by nature',
  category: 'modern',
  defaultColors: {
    primary: '#16a34a',
    secondary: '#f0fdf4',
    background: '#ffffff',
    text: '#14532d',
    accent: '#22c55e',
    border: '#bbf7d0',
    hover: '#15803d',
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
