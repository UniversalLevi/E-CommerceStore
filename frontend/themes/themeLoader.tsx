'use client';

import { StoreTheme } from './base/types';
import { getThemeConfig } from './base/ThemeConfig';

// Lazy load theme components
const themeComponents: Record<string, any> = {};

export async function loadTheme(themeName: string) {
  if (themeComponents[themeName]) {
    return themeComponents[themeName];
  }

  try {
    // Check if it's a template-based theme (format: template-{slug})
    if (themeName.startsWith('template-')) {
      // For now, template-based themes use the modern theme as a base
      // TODO: In the future, we can convert templates to React components or create a template renderer
      console.log(`Loading template-based theme: ${themeName}. Using modern theme as base.`);
      themeComponents[themeName] = await import('./modern');
      return themeComponents[themeName];
    }

    switch (themeName) {
      // New internal store themes
      case 'modern':
        themeComponents[themeName] = await import('./modern');
        break;
      case 'classic':
        themeComponents[themeName] = await import('./classic');
        break;
      case 'minimal-v2':
        themeComponents[themeName] = await import('./minimal-v2');
        break;
      case 'premium':
        themeComponents[themeName] = await import('./premium');
        break;
      // New e-commerce themes
      case 'neon':
        themeComponents[themeName] = await import('./neon');
        break;
      case 'elegant':
        themeComponents[themeName] = await import('./elegant');
        break;
      case 'bold':
        themeComponents[themeName] = await import('./bold');
        break;
      case 'minimalist':
        themeComponents[themeName] = await import('./minimalist');
        break;
      case 'vintage':
        themeComponents[themeName] = await import('./vintage');
        break;
      // Premium internal store themes
      case 'dark-shade':
        themeComponents[themeName] = await import('./dark-shade');
        break;
      case 'dark-premium':
        themeComponents[themeName] = await import('./dark-premium');
        break;
      case 'royal-luxury':
        themeComponents[themeName] = await import('./royal-luxury');
        break;
      case 'ocean-breeze':
        themeComponents[themeName] = await import('./ocean-breeze');
        break;
      case 'sunset-glow':
        themeComponents[themeName] = await import('./sunset-glow');
        break;
      case 'forest-nature':
        themeComponents[themeName] = await import('./forest-nature');
        break;
      case 'cosmic-space':
        themeComponents[themeName] = await import('./cosmic-space');
        break;
      // Legacy themes (deprecated)
      case 'minimal':
        themeComponents[themeName] = await import('./minimal');
        break;
      case 'dark-theme':
        themeComponents[themeName] = await import('./dark-theme');
        break;
      case 'fashion-luxury':
        themeComponents[themeName] = await import('./fashion-luxury');
        break;
      case 'techy':
        themeComponents[themeName] = await import('./techy');
        break;
      // Deprecated Shopify themes - fallback to modern
      case 'black-premium':
      case '3d-theme':
      case 'white':
      case 'r765r786ry8r':
        console.warn(`Theme "${themeName}" is deprecated. Falling back to modern.`);
        themeComponents[themeName] = await import('./modern');
        break;
      default:
        // Fallback to modern theme
        themeComponents[themeName] = await import('./modern');
    }
    return themeComponents[themeName];
  } catch (error) {
    console.error(`Failed to load theme ${themeName}:`, error);
    // Fallback to modern
    if (!themeComponents['modern']) {
      themeComponents['modern'] = await import('./modern');
    }
    return themeComponents['modern'];
  }
}

export function getThemeComponent(themeName: string) {
  return themeComponents[themeName];
}
