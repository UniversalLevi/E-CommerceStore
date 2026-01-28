import { ThemeConfig } from '../base/types';

export const minimalistThemeConfig: ThemeConfig = {
  name: 'minimalist',
  displayName: 'Minimalist',
  description: 'Clean, white space focused design with simple elegance',
  category: 'minimal',
  defaultColors: {
    primary: '#2c3e50',
    secondary: '#f8f9fa',
    background: '#ffffff',
    text: '#2c3e50',
    accent: '#3498db',
    border: '#e0e0e0',
    hover: '#1a252f',
  },
  defaultTypography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '500',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
