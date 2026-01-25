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
    switch (themeName) {
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
      case 'black-premium':
        themeComponents[themeName] = await import('./dark-theme');
        break;
      case '3d-theme':
        themeComponents[themeName] = await import('./minimal');
        break;
      case 'white':
        themeComponents[themeName] = await import('./minimal');
        break;
      case 'r765r786ry8r':
        themeComponents[themeName] = await import('./minimal');
        break;
      default:
        // Fallback to minimal
        themeComponents[themeName] = await import('./minimal');
    }
    return themeComponents[themeName];
  } catch (error) {
    console.error(`Failed to load theme ${themeName}:`, error);
    // Fallback to minimal
    if (!themeComponents['minimal']) {
      themeComponents['minimal'] = await import('./minimal');
    }
    return themeComponents['minimal'];
  }
}

export function getThemeComponent(themeName: string) {
  return themeComponents[themeName];
}
