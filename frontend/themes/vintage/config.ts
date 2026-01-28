import { ThemeConfig } from '../base/types';

export const vintageThemeConfig: ThemeConfig = {
  name: 'vintage',
  displayName: 'Vintage',
  description: 'Retro aesthetic with warm colors and classic design',
  category: 'custom',
  defaultColors: {
    primary: '#8b0000',
    secondary: '#fff8dc',
    background: '#f4e4c1',
    text: '#704214',
    accent: '#704214',
    border: '#8b0000',
    hover: '#a52a2a',
  },
  defaultTypography: {
    fontFamily: 'Merriweather, Lora, serif',
    headingFont: 'Merriweather, serif',
    fontSize: '17px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
