import { ThemeConfig } from '../base/types';

export const darkPremiumThemeConfig: ThemeConfig = {
  name: 'dark-premium',
  displayName: 'Dark Premium',
  description: 'Ultra-premium dark theme with deep black and gold accents',
  category: 'luxury',
  defaultColors: {
    primary: '#fbbf24',
    secondary: '#1f2937',
    background: '#000000',
    text: '#ffffff',
    accent: '#f59e0b',
    border: '#374151',
    hover: '#d97706',
  },
  defaultTypography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headingFont: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
