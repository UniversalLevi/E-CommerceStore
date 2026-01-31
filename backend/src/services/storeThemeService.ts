import * as fs from 'fs/promises';
import * as path from 'path';

export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'dark' | 'tech' | 'custom';
  previewImage?: string;
  defaultColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    border?: string;
    hover?: string;
  };
  defaultTypography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
  };
  customizableProperties: string[];
}

export interface ThemeCustomization {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  layout?: Record<string, any>;
  logo?: string;
}

// Available themes metadata
const AVAILABLE_THEMES: ThemeConfig[] = [
  // New internal store themes
  {
    name: 'modern',
    displayName: 'Modern',
    description: 'Contemporary design with clean lines and modern aesthetics',
    category: 'modern',
    defaultColors: {
      primary: '#2563eb',
      secondary: '#f8fafc',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#3b82f6',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'classic',
    displayName: 'Classic',
    description: 'Traditional e-commerce design with timeless elegance',
    category: 'modern',
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#f5f5f5',
      background: '#ffffff',
      text: '#333333',
      accent: '#c9a961',
    },
    defaultTypography: {
      fontFamily: 'Georgia, serif',
      headingFont: 'Georgia, serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      headingFont: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Playfair Display, serif',
      headingFont: 'Playfair Display, serif',
      fontSize: '17px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Orbitron, Rajdhani, system-ui, sans-serif',
      headingFont: 'Orbitron, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Playfair Display, Cormorant, serif',
      headingFont: 'Playfair Display, serif',
      fontSize: '18px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Montserrat, Poppins, system-ui, sans-serif',
      headingFont: 'Montserrat, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'minimalist',
    displayName: 'Minimalist',
    description: 'Clean, white space focused design with simple elegance',
    category: 'minimal',
    defaultColors: {
      primary: '#2c3e50',
      secondary: '#f8f9fa',
      background: '#ffffff',
      text: '#2c3e50',
      accent: '#3498db',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Merriweather, Lora, serif',
      headingFont: 'Merriweather, serif',
      fontSize: '17px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  // Premium internal store themes
  {
    name: 'dark-shade',
    displayName: 'Dark Shade',
    description: 'Premium dark theme with elegant design and modern aesthetics',
    category: 'luxury',
    defaultColors: {
      primary: '#ffffff',
      secondary: '#1a1a1a',
      background: '#000000',
      text: '#e0e0e0',
      accent: '#64748b',
      border: '#334155',
      hover: '#475569',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'dark-premium',
    displayName: 'Dark Premium',
    description: 'Ultra-premium dark theme with deep black and gold accents',
    category: 'luxury',
    defaultColors: {
      primary: '#fbbf24',
      secondary: '#1f2937',
      background: '#000000',
      text: '#ffffff',
      accent: '#f59e0b',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
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
    },
    defaultTypography: {
      fontFamily: 'Playfair Display, serif',
      headingFont: 'Playfair Display, serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'ocean-breeze',
    displayName: 'Ocean Breeze',
    description: 'Fresh ocean theme with blue and teal tones',
    category: 'modern',
    defaultColors: {
      primary: '#0ea5e9',
      secondary: '#e0f2fe',
      background: '#ffffff',
      text: '#0c4a6e',
      accent: '#06b6d4',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'sunset-glow',
    displayName: 'Sunset Glow',
    description: 'Warm sunset theme with orange and pink gradients',
    category: 'bold',
    defaultColors: {
      primary: '#f97316',
      secondary: '#fff7ed',
      background: '#ffffff',
      text: '#7c2d12',
      accent: '#ec4899',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'forest-nature',
    displayName: 'Forest Nature',
    description: 'Natural green theme inspired by nature',
    category: 'modern',
    defaultColors: {
      primary: '#16a34a',
      secondary: '#f0fdf4',
      background: '#ffffff',
      text: '#14532d',
      accent: '#22c55e',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
  {
    name: 'cosmic-space',
    displayName: 'Cosmic Space',
    description: 'Premium futuristic space theme with stunning purple-blue gradients and modern aesthetics',
    category: 'luxury',
    defaultColors: {
      primary: '#a78bfa',
      secondary: '#1e1b4b',
      background: '#0a0a0f',
      text: '#e9d5ff',
      accent: '#6366f1',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo', 'layout'],
  },
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
    displayName: 'Dark Theme',
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
    displayName: 'Fashion Luxury',
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
    displayName: 'Techy',
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
  {
    name: 'black-premium',
    displayName: 'Black Premium',
    description: 'Sophisticated dark theme with premium feel',
    category: 'dark',
    defaultColors: {
      primary: '#ffffff',
      secondary: '#000000',
      background: '#000000',
      text: '#ffffff',
      accent: '#ffd700',
    },
    defaultTypography: {
      fontFamily: 'Montserrat, sans-serif',
      headingFont: 'Montserrat, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: '3d-theme',
    displayName: '3D Theme',
    description: 'Modern design with 3D elements and effects',
    category: 'modern',
    defaultColors: {
      primary: '#6366f1',
      secondary: '#ffffff',
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#8b5cf6',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'white',
    displayName: 'White',
    description: 'Light and airy design with spacious layout',
    category: 'minimal',
    defaultColors: {
      primary: '#1a1a1a',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#333333',
      accent: '#3b82f6',
    },
    defaultTypography: {
      fontFamily: 'system-ui, sans-serif',
      headingFont: 'system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
  {
    name: 'r765r786ry8r',
    displayName: 'Modern Gradient',
    description: 'Contemporary design with gradient accents',
    category: 'modern',
    defaultColors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      text: '#1a1a1a',
      accent: '#667eea',
    },
    defaultTypography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
    },
    customizableProperties: ['colors', 'typography', 'logo'],
  },
];

/**
 * Get all available themes (built-in themes + active templates from database)
 */
export async function getAvailableThemes(): Promise<ThemeConfig[]> {
  try {
    // Get built-in themes (including the new 5 e-commerce themes)
    const builtInThemes: ThemeConfig[] = AVAILABLE_THEMES.filter(theme => {
      // Include new e-commerce themes and modern internal store themes
      // Exclude legacy/deprecated themes
      const excludedThemes = ['minimal', 'dark-theme', 'fashion-luxury', 'techy', 'black-premium', '3d-theme', 'white', 'r765r786ry8r'];
      return !excludedThemes.includes(theme.name);
    });

    // Get templates from database
    const { Template } = await import('../models/Template');
    const templates = await Template.find({ 
      isActive: true, 
      isDeleted: false 
    })
    .select('name slug description previewImage category')
    .sort({ appliedCount: -1, createdAt: -1 })
    .lean();
    
    const templateThemes: ThemeConfig[] = templates.map((template) => {
      return {
        name: `template-${template.slug}`,
        displayName: template.name,
        description: template.description,
        category: template.category as any,
        previewImage: template.previewImage,
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
      };
    });
    
    // Return built-in themes first, then templates
    return [...builtInThemes, ...templateThemes];
  } catch (error) {
    console.error('Error loading themes:', error);
    // Fallback to built-in themes if templates fail
    return AVAILABLE_THEMES.filter(theme => {
      const excludedThemes = ['minimal', 'dark-theme', 'fashion-luxury', 'techy', 'black-premium', '3d-theme', 'white', 'r765r786ry8r'];
      return !excludedThemes.includes(theme.name);
    });
  }
}

/**
 * Get theme configuration by name
 * Supports both built-in themes and templates from database
 */
export async function getThemeConfig(themeName: string): Promise<ThemeConfig | null> {
  // Check if it's a template-based theme (format: template-{slug})
  if (themeName.startsWith('template-')) {
    const templateSlug = themeName.replace('template-', '');
    try {
      const { Template } = await import('../models/Template');
      const template = await Template.findOne({ 
        slug: templateSlug, 
        isActive: true, 
        isDeleted: false 
      }).lean();
      
      if (template) {
        // Get template metadata from filesystem
        const fs = await import('fs/promises');
        const path = await import('path');
        const templatePath = path.join(process.cwd(), 'backend', 'templates', template.slug, 'meta.json');
        
        try {
          const metaContent = await fs.readFile(templatePath, 'utf-8');
          const meta = JSON.parse(metaContent);
          
          return {
            name: themeName,
            displayName: template.name,
            description: template.description,
            category: template.category as any,
            previewImage: template.previewImage,
            defaultColors: meta.colors || {
              primary: '#000000',
              secondary: '#ffffff',
              background: '#ffffff',
              text: '#1a1a1a',
              accent: '#4a90d9',
            },
            defaultTypography: meta.typography || {
              fontFamily: 'system-ui, sans-serif',
              headingFont: 'system-ui, sans-serif',
              fontSize: '16px',
            },
            customizableProperties: ['colors', 'typography', 'logo'],
          };
        } catch (error) {
          // If meta.json doesn't exist, return default config
          return {
            name: themeName,
            displayName: template.name,
            description: template.description,
            category: template.category as any,
            previewImage: template.previewImage,
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
          };
        }
      }
    } catch (error) {
      console.error('Error loading template theme:', error);
      return null;
    }
  }
  
  // Check built-in themes
  return AVAILABLE_THEMES.find((theme) => theme.name === themeName) || null;
}

/**
 * Validate theme customization values
 */
export async function validateThemeCustomization(
  themeName: string,
  customizations: ThemeCustomization
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const theme = await getThemeConfig(themeName);

  if (!theme) {
    errors.push(`Theme "${themeName}" does not exist`);
    return { valid: false, errors };
  }

  // Validate colors
  if (customizations.colors) {
    for (const [key, value] of Object.entries(customizations.colors)) {
      if (typeof value !== 'string') {
        errors.push(`Color "${key}" must be a string`);
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        errors.push(`Color "${key}" must be a valid hex color (e.g., #FF0000)`);
      }
    }
  }

  // Validate typography
  if (customizations.typography) {
    const requiredTypographyKeys = ['fontFamily', 'headingFont', 'fontSize'];
    for (const key of requiredTypographyKeys) {
      if (customizations.typography[key] && typeof customizations.typography[key] !== 'string') {
        errors.push(`Typography "${key}" must be a string`);
      }
    }
  }

  // Validate layout
  if (customizations.layout) {
    if (typeof customizations.layout !== 'object' || Array.isArray(customizations.layout)) {
      errors.push('Layout must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply theme to store (returns theme configuration with customizations merged)
 */
export async function applyThemeToStore(
  themeName: string,
  customizations?: ThemeCustomization
): Promise<{
  name: string;
  customizations: ThemeCustomization;
}> {
  const theme = await getThemeConfig(themeName);
  if (!theme) {
    throw new Error(`Theme "${themeName}" does not exist`);
  }

  const defaultCustomizations: ThemeCustomization = {
    colors: theme.defaultColors ? { ...theme.defaultColors } : {},
    typography: theme.defaultTypography ? { ...theme.defaultTypography } : {},
    layout: {},
  };

  // Merge customizations with defaults
  const mergedCustomizations: ThemeCustomization = {
    colors: {
      ...defaultCustomizations.colors,
      ...(customizations?.colors || {}),
    },
    typography: {
      ...defaultCustomizations.typography,
      ...(customizations?.typography || {}),
    },
    layout: {
      ...defaultCustomizations.layout,
      ...(customizations?.layout || {}),
    },
    logo: customizations?.logo,
  };

  return {
    name: themeName,
    customizations: mergedCustomizations,
  };
}
