import { ThemeConfig } from '../base/types';

export const oceanBreezeThemeConfig: ThemeConfig = {
  name: 'ocean-breeze',
  displayName: 'Ocean Breeze',
  description: 'Fresh ocean theme with blue and teal tones',
  category: 'modern',
  defaultColors: {
    primary: '#0ea5e9',
    secondary: '#e0f2fe',
    background: '#ffffff',
    text: '#0c4a6e',
    accent: '#06b6d4',
    border: '#bae6fd',
    hover: '#0284c7',
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
