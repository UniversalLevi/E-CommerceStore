import { ThemeConfig } from '../base/types';

export const boldThemeConfig: ThemeConfig = {
  name: 'bold',
  displayName: 'Bold',
  description: 'Vibrant, energetic design with bright colors and bold typography',
  category: 'bold',
  defaultColors: {
    primary: '#ff6b35',
    secondary: '#ffffff',
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#004e89',
    border: '#ffc107',
    hover: '#ff4500',
  },
  defaultTypography: {
    fontFamily: 'Montserrat, Poppins, system-ui, sans-serif',
    headingFont: 'Montserrat, system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: '600',
    headingWeight: '800',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
