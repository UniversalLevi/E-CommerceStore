import { ThemeConfig } from '../base/types';

export const sunsetGlowThemeConfig: ThemeConfig = {
  name: 'sunset-glow',
  displayName: 'Sunset Glow',
  description: 'Warm sunset theme with orange and pink gradients',
  category: 'bold',
  defaultColors: {
    primary: '#f97316',
    secondary: '#fff7ed',
    background: '#ffffff',
    text: '#7c2d12',
    accent: '#ec4899',
    border: '#fed7aa',
    hover: '#ea580c',
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
