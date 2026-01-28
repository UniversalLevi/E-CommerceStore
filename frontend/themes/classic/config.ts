import { ThemeConfig } from '../base/types';

export const classicThemeConfig: ThemeConfig = {
  name: 'classic',
  displayName: 'Classic',
  description: 'Traditional e-commerce design with timeless elegance',
  category: 'modern',
  defaultColors: {
    primary: '#1a1a1a',
    secondary: '#f5f5f5',
    background: '#ffffff',
    text: '#333333',
    accent: '#c9a961',
    border: '#d4d4d4',
    hover: '#000000',
  },
  defaultTypography: {
    fontFamily: 'Georgia, serif',
    headingFont: 'Georgia, serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
