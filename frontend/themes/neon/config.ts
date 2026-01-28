import { ThemeConfig } from '../base/types';

export const neonThemeConfig: ThemeConfig = {
  name: 'neon',
  displayName: 'Neon',
  description: 'Dark cyberpunk aesthetic with neon accents and futuristic design',
  category: 'tech',
  defaultColors: {
    primary: '#00ffff',
    secondary: '#1a1a1a',
    background: '#0a0a0a',
    text: '#ffffff',
    accent: '#ff00ff',
    border: '#0066ff',
    hover: '#00ffff',
  },
  defaultTypography: {
    fontFamily: 'Orbitron, Rajdhani, system-ui, sans-serif',
    headingFont: 'Orbitron, system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    headingWeight: '700',
  },
  customizableProperties: ['colors', 'typography', 'logo', 'layout'],
};
