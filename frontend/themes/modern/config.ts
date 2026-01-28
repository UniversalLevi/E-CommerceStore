import { ThemeConfig } from '../base/types';

export const modernThemeConfig: ThemeConfig = {
  name: 'modern',
  displayName: 'Modern',
  description: 'Contemporary design with clean lines and modern aesthetics',
  category: 'modern',
  defaultColors: {
    primary: '#2563eb',
    secondary: '#f8fafc',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#3b82f6',
    border: '#e2e8f0',
    hover: '#1e40af',
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
