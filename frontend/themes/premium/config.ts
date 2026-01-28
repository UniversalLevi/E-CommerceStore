import { ThemeConfig } from '../base/types';

export const premiumThemeConfig: ThemeConfig = {
  name: 'premium',
  displayName: 'Premium',
  description: 'Luxury design with sophisticated aesthetics and premium feel',
  category: 'luxury',
  defaultColors: {
    primary: '#1a1a1a',
    secondary: '#f8f8f8',
    background: '#ffffff',
    text: '#2c2c2c',
    accent: '#d4af37',
    border: '#e0e0e0',
    hover: '#000000',
  },
  defaultTypography: {
    fontFamily: 'Playfair Display, serif',
    headingFont: 'Playfair Display, serif',
    fontSize: '17px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
