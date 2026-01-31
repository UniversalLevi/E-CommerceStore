import { ThemeConfig } from '../base/types';

export const royalLuxuryThemeConfig: ThemeConfig = {
  name: 'royal-luxury',
  displayName: 'Royal Luxury',
  description: 'Regal theme with purple and gold luxury accents',
  category: 'luxury',
  defaultColors: {
    primary: '#a855f7',
    secondary: '#f3e8ff',
    background: '#ffffff',
    text: '#1e1b4b',
    accent: '#fbbf24',
    border: '#e9d5ff',
    hover: '#9333ea',
  },
  defaultTypography: {
    fontFamily: 'Playfair Display, serif',
    headingFont: 'Playfair Display, serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
