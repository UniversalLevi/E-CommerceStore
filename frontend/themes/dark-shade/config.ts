import { ThemeConfig } from '../base/types';

export const darkShadeThemeConfig: ThemeConfig = {
  name: 'dark-shade',
  displayName: 'Dark Shade',
  description: 'Premium dark theme with elegant design and modern aesthetics',
  category: 'luxury',
  defaultColors: {
    primary: '#ffffff',
    secondary: '#1a1a1a',
    background: '#000000',
    text: '#e0e0e0',
    accent: '#64748b',
    border: '#334155',
    hover: '#475569',
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
