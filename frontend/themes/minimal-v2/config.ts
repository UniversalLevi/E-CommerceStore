import { ThemeConfig } from '../base/types';

export const minimalV2ThemeConfig: ThemeConfig = {
  name: 'minimal-v2',
  displayName: 'Minimal V2',
  description: 'Ultra-clean minimal design with maximum focus on content',
  category: 'minimal',
  defaultColors: {
    primary: '#000000',
    secondary: '#fafafa',
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#000000',
    border: '#e5e5e5',
    hover: '#333333',
  },
  defaultTypography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headingFont: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '500',
  },
  customizableProperties: ['colors', 'typography', 'logo'],
};
