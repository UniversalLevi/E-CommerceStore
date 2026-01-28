import { ThemeConfig } from '../base/types';

export const elegantThemeConfig: ThemeConfig = {
  name: 'elegant',
  displayName: 'Elegant',
  description: 'Luxury premium design with gold accents and sophisticated aesthetics',
  category: 'luxury',
  defaultColors: {
    primary: '#1a1a2e',
    secondary: '#f5f5dc',
    background: '#ffffff',
    text: '#2c2c2c',
    accent: '#d4af37',
    border: '#d4af37',
    hover: '#b8941f',
  },
  defaultTypography: {
    fontFamily: 'Playfair Display, Cormorant, serif',
    headingFont: 'Playfair Display, serif',
    fontSize: '18px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
