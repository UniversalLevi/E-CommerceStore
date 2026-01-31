import { ThemeConfig, ThemeColors, ThemeTypography } from './types';
import { modernThemeConfig } from '../modern/config';
import { classicThemeConfig } from '../classic/config';
import { minimalV2ThemeConfig } from '../minimal-v2/config';
import { premiumThemeConfig } from '../premium/config';
import { neonThemeConfig } from '../neon/config';
import { elegantThemeConfig } from '../elegant/config';
import { boldThemeConfig } from '../bold/config';
import { minimalistThemeConfig } from '../minimalist/config';
import { vintageThemeConfig } from '../vintage/config';
import { darkShadeThemeConfig } from '../dark-shade/config';
import { darkPremiumThemeConfig } from '../dark-premium/config';
import { royalLuxuryThemeConfig } from '../royal-luxury/config';
import { oceanBreezeThemeConfig } from '../ocean-breeze/config';
import { sunsetGlowThemeConfig } from '../sunset-glow/config';
import { forestNatureThemeConfig } from '../forest-nature/config';
import { cosmicSpaceThemeConfig } from '../cosmic-space/config';

export const AVAILABLE_THEMES: ThemeConfig[] = [
  // New internal store themes
  modernThemeConfig,
  classicThemeConfig,
  minimalV2ThemeConfig,
  premiumThemeConfig,
  // New e-commerce themes
  neonThemeConfig,
  elegantThemeConfig,
  boldThemeConfig,
  minimalistThemeConfig,
  vintageThemeConfig,
  // Premium internal store themes
  darkShadeThemeConfig,
  darkPremiumThemeConfig,
  royalLuxuryThemeConfig,
  oceanBreezeThemeConfig,
  sunsetGlowThemeConfig,
  forestNatureThemeConfig,
  cosmicSpaceThemeConfig,
  // Legacy themes (deprecated, kept for backward compatibility)
  {
    name: 'minimal',
    displayName: 'Minimal (Legacy)',
    description: 'Clean and simple design with focus on content',
    category: 'minimal',
    defaultColors: {
      primary: '#000000',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#4a90d9',
    },
    defaultTypography: {
      fontFamily: 'system-ui, sans-serif',
      headingFont: 'system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'dark-theme',
    displayName: 'Dark Theme (Legacy)',
    description: 'Modern dark mode aesthetic with elegant design',
    category: 'dark',
    defaultColors: {
      primary: '#ffffff',
      secondary: '#1a1a1a',
      background: '#0a0a0a',
      text: '#e0e0e0',
      accent: '#6366f1',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'fashion-luxury',
    displayName: 'Fashion Luxury (Legacy)',
    description: 'Premium and elegant design for luxury brands',
    category: 'luxury',
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#f5f5f5',
      background: '#ffffff',
      text: '#2c2c2c',
      accent: '#d4af37',
    },
    defaultTypography: {
      fontFamily: 'Playfair Display, serif',
      headingFont: 'Playfair Display, serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'techy',
    displayName: 'Techy (Legacy)',
    description: 'Modern tech-focused design with bold elements',
    category: 'tech',
    defaultColors: {
      primary: '#000000',
      secondary: '#00ff88',
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#00ff88',
    },
    defaultTypography: {
      fontFamily: 'JetBrains Mono, monospace',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  // Note: black-premium, 3d-theme, white, r765r786ry8r are deprecated Shopify themes
  // They are kept for backward compatibility but will fallback to minimal theme
];

export function getThemeConfig(name: string): ThemeConfig | null {
  return AVAILABLE_THEMES.find((theme) => theme.name === name) || null;
}

export function getAvailableThemes(): ThemeConfig[] {
  return AVAILABLE_THEMES;
}
