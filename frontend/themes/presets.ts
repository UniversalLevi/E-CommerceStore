export interface ThemePreset {
  id: string;
  baseTheme: string;
  displayName: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography?: {
    fontFamily?: string;
    headingFont?: string;
    fontSize?: string;
  };
  previewGradient: [string, string];
}

const THEME_PRESETS: ThemePreset[] = [
  // ─── Modern (8 presets) ───────────────────────────────────────────
  { id: 'modern-ocean', baseTheme: 'modern', displayName: 'Modern Ocean', category: 'Modern', colors: { primary: '#0077b6', secondary: '#caf0f8', background: '#ffffff', text: '#023e8a', accent: '#00b4d8' }, previewGradient: ['#0077b6', '#00b4d8'] },
  { id: 'modern-rose', baseTheme: 'modern', displayName: 'Modern Rose', category: 'Modern', colors: { primary: '#be185d', secondary: '#fce7f3', background: '#ffffff', text: '#831843', accent: '#ec4899' }, previewGradient: ['#be185d', '#ec4899'] },
  { id: 'modern-slate', baseTheme: 'modern', displayName: 'Modern Slate', category: 'Modern', colors: { primary: '#334155', secondary: '#f1f5f9', background: '#ffffff', text: '#1e293b', accent: '#6366f1' }, previewGradient: ['#334155', '#6366f1'] },
  { id: 'modern-emerald', baseTheme: 'modern', displayName: 'Modern Emerald', category: 'Modern', colors: { primary: '#059669', secondary: '#ecfdf5', background: '#ffffff', text: '#064e3b', accent: '#10b981' }, previewGradient: ['#059669', '#10b981'] },
  { id: 'modern-amber', baseTheme: 'modern', displayName: 'Modern Amber', category: 'Modern', colors: { primary: '#d97706', secondary: '#fffbeb', background: '#ffffff', text: '#78350f', accent: '#f59e0b' }, previewGradient: ['#d97706', '#f59e0b'] },
  { id: 'modern-violet', baseTheme: 'modern', displayName: 'Modern Violet', category: 'Modern', colors: { primary: '#7c3aed', secondary: '#ede9fe', background: '#ffffff', text: '#4c1d95', accent: '#8b5cf6' }, previewGradient: ['#7c3aed', '#8b5cf6'] },
  { id: 'modern-teal', baseTheme: 'modern', displayName: 'Modern Teal', category: 'Modern', colors: { primary: '#0d9488', secondary: '#f0fdfa', background: '#ffffff', text: '#134e4a', accent: '#14b8a6' }, previewGradient: ['#0d9488', '#14b8a6'] },
  { id: 'modern-crimson', baseTheme: 'modern', displayName: 'Modern Crimson', category: 'Modern', colors: { primary: '#dc2626', secondary: '#fef2f2', background: '#ffffff', text: '#7f1d1d', accent: '#ef4444' }, previewGradient: ['#dc2626', '#ef4444'] },

  // ─── Classic (7 presets) ──────────────────────────────────────────
  { id: 'classic-warm', baseTheme: 'classic', displayName: 'Classic Warm', category: 'Modern', colors: { primary: '#92400e', secondary: '#fef3c7', background: '#fffbeb', text: '#451a03', accent: '#b45309' }, typography: { fontFamily: 'Georgia, serif', headingFont: 'Georgia, serif' }, previewGradient: ['#92400e', '#b45309'] },
  { id: 'classic-navy', baseTheme: 'classic', displayName: 'Classic Navy', category: 'Modern', colors: { primary: '#1e3a5f', secondary: '#e8edf2', background: '#ffffff', text: '#1e293b', accent: '#2563eb' }, typography: { fontFamily: 'Georgia, serif', headingFont: 'Georgia, serif' }, previewGradient: ['#1e3a5f', '#2563eb'] },
  { id: 'classic-burgundy', baseTheme: 'classic', displayName: 'Classic Burgundy', category: 'Luxury', colors: { primary: '#7f1d1d', secondary: '#fef2f2', background: '#fffafa', text: '#450a0a', accent: '#991b1b' }, typography: { fontFamily: 'Georgia, serif', headingFont: 'Georgia, serif' }, previewGradient: ['#7f1d1d', '#991b1b'] },
  { id: 'classic-forest', baseTheme: 'classic', displayName: 'Classic Forest', category: 'Nature', colors: { primary: '#14532d', secondary: '#f0fdf4', background: '#fafff7', text: '#052e16', accent: '#166534' }, typography: { fontFamily: 'Lora, serif', headingFont: 'Lora, serif' }, previewGradient: ['#14532d', '#166534'] },
  { id: 'classic-charcoal', baseTheme: 'classic', displayName: 'Classic Charcoal', category: 'Minimal', colors: { primary: '#374151', secondary: '#f3f4f6', background: '#ffffff', text: '#111827', accent: '#6b7280' }, typography: { fontFamily: 'Georgia, serif', headingFont: 'Georgia, serif' }, previewGradient: ['#374151', '#6b7280'] },
  { id: 'classic-plum', baseTheme: 'classic', displayName: 'Classic Plum', category: 'Luxury', colors: { primary: '#581c87', secondary: '#faf5ff', background: '#ffffff', text: '#3b0764', accent: '#7e22ce' }, typography: { fontFamily: 'Lora, serif', headingFont: 'Lora, serif' }, previewGradient: ['#581c87', '#7e22ce'] },
  { id: 'classic-sage', baseTheme: 'classic', displayName: 'Classic Sage', category: 'Nature', colors: { primary: '#4d7c0f', secondary: '#f7fee7', background: '#fefce8', text: '#365314', accent: '#65a30d' }, typography: { fontFamily: 'Georgia, serif', headingFont: 'Georgia, serif' }, previewGradient: ['#4d7c0f', '#65a30d'] },

  // ─── Minimal V2 (7 presets) ───────────────────────────────────────
  { id: 'minv2-pure', baseTheme: 'minimal-v2', displayName: 'Pure White', category: 'Minimal', colors: { primary: '#111827', secondary: '#f9fafb', background: '#ffffff', text: '#1f2937', accent: '#111827' }, previewGradient: ['#111827', '#374151'] },
  { id: 'minv2-sand', baseTheme: 'minimal-v2', displayName: 'Sand Minimal', category: 'Minimal', colors: { primary: '#78716c', secondary: '#fafaf9', background: '#fffbf5', text: '#44403c', accent: '#a8a29e' }, previewGradient: ['#78716c', '#a8a29e'] },
  { id: 'minv2-ink', baseTheme: 'minimal-v2', displayName: 'Ink', category: 'Minimal', colors: { primary: '#0f172a', secondary: '#f8fafc', background: '#ffffff', text: '#0f172a', accent: '#475569' }, previewGradient: ['#0f172a', '#475569'] },
  { id: 'minv2-cloud', baseTheme: 'minimal-v2', displayName: 'Cloud', category: 'Minimal', colors: { primary: '#64748b', secondary: '#f1f5f9', background: '#f8fafc', text: '#334155', accent: '#94a3b8' }, previewGradient: ['#64748b', '#94a3b8'] },
  { id: 'minv2-mono', baseTheme: 'minimal-v2', displayName: 'Monochrome', category: 'Monochrome', colors: { primary: '#000000', secondary: '#e5e5e5', background: '#ffffff', text: '#171717', accent: '#525252' }, previewGradient: ['#000000', '#525252'] },
  { id: 'minv2-blush', baseTheme: 'minimal-v2', displayName: 'Blush Minimal', category: 'Pastel', colors: { primary: '#9f1239', secondary: '#fff1f2', background: '#ffffff', text: '#4c0519', accent: '#e11d48' }, previewGradient: ['#9f1239', '#e11d48'] },
  { id: 'minv2-stone', baseTheme: 'minimal-v2', displayName: 'Stone', category: 'Minimal', colors: { primary: '#57534e', secondary: '#f5f5f4', background: '#fafaf9', text: '#292524', accent: '#78716c' }, previewGradient: ['#57534e', '#78716c'] },

  // ─── Premium (7 presets) ──────────────────────────────────────────
  { id: 'premium-gold', baseTheme: 'premium', displayName: 'Premium Gold', category: 'Luxury', colors: { primary: '#1a1a1a', secondary: '#fdf6e3', background: '#ffffff', text: '#2c2c2c', accent: '#c8a951' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#1a1a1a', '#c8a951'] },
  { id: 'premium-silver', baseTheme: 'premium', displayName: 'Premium Silver', category: 'Luxury', colors: { primary: '#1e293b', secondary: '#f1f5f9', background: '#ffffff', text: '#0f172a', accent: '#94a3b8' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#1e293b', '#94a3b8'] },
  { id: 'premium-rose-gold', baseTheme: 'premium', displayName: 'Rose Gold', category: 'Luxury', colors: { primary: '#4a2021', secondary: '#fdf2f8', background: '#fff5f7', text: '#3b0a0a', accent: '#b76e79' }, typography: { fontFamily: 'Cormorant Garamond, serif', headingFont: 'Cormorant Garamond, serif' }, previewGradient: ['#4a2021', '#b76e79'] },
  { id: 'premium-onyx', baseTheme: 'premium', displayName: 'Onyx', category: 'Dark', colors: { primary: '#f5f5f5', secondary: '#1c1c1c', background: '#0d0d0d', text: '#e5e5e5', accent: '#a78bfa' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#0d0d0d', '#a78bfa'] },
  { id: 'premium-champagne', baseTheme: 'premium', displayName: 'Champagne', category: 'Luxury', colors: { primary: '#6b5b3e', secondary: '#fef9ef', background: '#fffdf7', text: '#3d3422', accent: '#c9b896' }, typography: { fontFamily: 'Cormorant Garamond, serif', headingFont: 'Cormorant Garamond, serif' }, previewGradient: ['#6b5b3e', '#c9b896'] },
  { id: 'premium-emerald-lux', baseTheme: 'premium', displayName: 'Emerald Luxury', category: 'Luxury', colors: { primary: '#064e3b', secondary: '#ecfdf5', background: '#ffffff', text: '#022c22', accent: '#059669' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#064e3b', '#059669'] },
  { id: 'premium-midnight', baseTheme: 'premium', displayName: 'Midnight', category: 'Dark', colors: { primary: '#e2e8f0', secondary: '#1e293b', background: '#0f172a', text: '#cbd5e1', accent: '#818cf8' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#0f172a', '#818cf8'] },

  // ─── Neon (7 presets) ─────────────────────────────────────────────
  { id: 'neon-cyber', baseTheme: 'neon', displayName: 'Cyber Neon', category: 'Neon', colors: { primary: '#00ffff', secondary: '#0a0a2e', background: '#050520', text: '#e0e0ff', accent: '#ff00ff' }, previewGradient: ['#00ffff', '#ff00ff'] },
  { id: 'neon-matrix', baseTheme: 'neon', displayName: 'Matrix', category: 'Neon', colors: { primary: '#00ff41', secondary: '#0a1a0a', background: '#000000', text: '#00ff41', accent: '#00cc33' }, previewGradient: ['#00ff41', '#00cc33'] },
  { id: 'neon-synthwave', baseTheme: 'neon', displayName: 'Synthwave', category: 'Neon', colors: { primary: '#f72585', secondary: '#1a0033', background: '#0d001a', text: '#e0c3fc', accent: '#7209b7' }, previewGradient: ['#f72585', '#7209b7'] },
  { id: 'neon-electric', baseTheme: 'neon', displayName: 'Electric Blue', category: 'Neon', colors: { primary: '#00d4ff', secondary: '#001a2e', background: '#000d1a', text: '#b3ecff', accent: '#0080ff' }, previewGradient: ['#00d4ff', '#0080ff'] },
  { id: 'neon-fire', baseTheme: 'neon', displayName: 'Neon Fire', category: 'Neon', colors: { primary: '#ff6600', secondary: '#1a0a00', background: '#0a0500', text: '#ffcc99', accent: '#ff3300' }, previewGradient: ['#ff6600', '#ff3300'] },
  { id: 'neon-toxic', baseTheme: 'neon', displayName: 'Toxic Green', category: 'Neon', colors: { primary: '#39ff14', secondary: '#0a1a05', background: '#050d03', text: '#ccffcc', accent: '#7fff00' }, previewGradient: ['#39ff14', '#7fff00'] },
  { id: 'neon-vapor', baseTheme: 'neon', displayName: 'Vaporwave', category: 'Neon', colors: { primary: '#ff71ce', secondary: '#1a0026', background: '#0d001a', text: '#ffd1eb', accent: '#01cdfe' }, previewGradient: ['#ff71ce', '#01cdfe'] },

  // ─── Elegant (7 presets) ──────────────────────────────────────────
  { id: 'elegant-ivory', baseTheme: 'elegant', displayName: 'Ivory Elegance', category: 'Luxury', colors: { primary: '#1a1a2e', secondary: '#fffff0', background: '#fffef5', text: '#2c2c2c', accent: '#b8860b' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#1a1a2e', '#b8860b'] },
  { id: 'elegant-noir', baseTheme: 'elegant', displayName: 'Noir', category: 'Dark', colors: { primary: '#e8d5b7', secondary: '#1a1a1a', background: '#0a0a0a', text: '#d4c5a9', accent: '#c9a961' }, typography: { fontFamily: 'Cormorant Garamond, serif', headingFont: 'Cormorant Garamond, serif' }, previewGradient: ['#0a0a0a', '#c9a961'] },
  { id: 'elegant-pearl', baseTheme: 'elegant', displayName: 'Pearl', category: 'Luxury', colors: { primary: '#4a4a4a', secondary: '#faf8f5', background: '#ffffff', text: '#333333', accent: '#c4a882' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#4a4a4a', '#c4a882'] },
  { id: 'elegant-wine', baseTheme: 'elegant', displayName: 'Wine', category: 'Luxury', colors: { primary: '#5b2333', secondary: '#fdf2f4', background: '#fff8fa', text: '#3d1520', accent: '#8b2252' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#5b2333', '#8b2252'] },
  { id: 'elegant-sapphire', baseTheme: 'elegant', displayName: 'Sapphire', category: 'Luxury', colors: { primary: '#1e3a5f', secondary: '#eef2ff', background: '#ffffff', text: '#1e293b', accent: '#2563eb' }, typography: { fontFamily: 'Cormorant Garamond, serif', headingFont: 'Cormorant Garamond, serif' }, previewGradient: ['#1e3a5f', '#2563eb'] },
  { id: 'elegant-mauve', baseTheme: 'elegant', displayName: 'Mauve', category: 'Pastel', colors: { primary: '#6b21a8', secondary: '#faf5ff', background: '#fefcff', text: '#4a044e', accent: '#a855f7' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#6b21a8', '#a855f7'] },
  { id: 'elegant-bronze', baseTheme: 'elegant', displayName: 'Bronze', category: 'Luxury', colors: { primary: '#5c4033', secondary: '#fdf6ef', background: '#fffbf5', text: '#3e2723', accent: '#cd7f32' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#5c4033', '#cd7f32'] },

  // ─── Bold (7 presets) ─────────────────────────────────────────────
  { id: 'bold-electric', baseTheme: 'bold', displayName: 'Bold Electric', category: 'Bold', colors: { primary: '#7c3aed', secondary: '#f5f3ff', background: '#ffffff', text: '#1e1b4b', accent: '#f43f5e' }, typography: { fontFamily: 'Montserrat, sans-serif', headingFont: 'Montserrat, sans-serif' }, previewGradient: ['#7c3aed', '#f43f5e'] },
  { id: 'bold-tropical', baseTheme: 'bold', displayName: 'Tropical', category: 'Bold', colors: { primary: '#059669', secondary: '#f0fdf4', background: '#ffffff', text: '#052e16', accent: '#f97316' }, typography: { fontFamily: 'Poppins, sans-serif', headingFont: 'Poppins, sans-serif' }, previewGradient: ['#059669', '#f97316'] },
  { id: 'bold-candy', baseTheme: 'bold', displayName: 'Candy Pop', category: 'Bold', colors: { primary: '#db2777', secondary: '#fdf2f8', background: '#ffffff', text: '#831843', accent: '#8b5cf6' }, typography: { fontFamily: 'Montserrat, sans-serif', headingFont: 'Montserrat, sans-serif' }, previewGradient: ['#db2777', '#8b5cf6'] },
  { id: 'bold-solar', baseTheme: 'bold', displayName: 'Solar', category: 'Bold', colors: { primary: '#ea580c', secondary: '#fff7ed', background: '#ffffff', text: '#431407', accent: '#eab308' }, typography: { fontFamily: 'Poppins, sans-serif', headingFont: 'Poppins, sans-serif' }, previewGradient: ['#ea580c', '#eab308'] },
  { id: 'bold-arctic', baseTheme: 'bold', displayName: 'Arctic', category: 'Bold', colors: { primary: '#0284c7', secondary: '#f0f9ff', background: '#ffffff', text: '#0c4a6e', accent: '#06b6d4' }, typography: { fontFamily: 'Montserrat, sans-serif', headingFont: 'Montserrat, sans-serif' }, previewGradient: ['#0284c7', '#06b6d4'] },
  { id: 'bold-magma', baseTheme: 'bold', displayName: 'Magma', category: 'Bold', colors: { primary: '#b91c1c', secondary: '#fef2f2', background: '#ffffff', text: '#450a0a', accent: '#f97316' }, typography: { fontFamily: 'Montserrat, sans-serif', headingFont: 'Montserrat, sans-serif' }, previewGradient: ['#b91c1c', '#f97316'] },
  { id: 'bold-jungle', baseTheme: 'bold', displayName: 'Jungle', category: 'Nature', colors: { primary: '#15803d', secondary: '#f0fdf4', background: '#ffffff', text: '#052e16', accent: '#ca8a04' }, typography: { fontFamily: 'Poppins, sans-serif', headingFont: 'Poppins, sans-serif' }, previewGradient: ['#15803d', '#ca8a04'] },

  // ─── Minimalist (6 presets) ───────────────────────────────────────
  { id: 'minimalist-winter', baseTheme: 'minimalist', displayName: 'Winter', category: 'Minimal', colors: { primary: '#1e40af', secondary: '#eff6ff', background: '#ffffff', text: '#1e3a5f', accent: '#3b82f6' }, previewGradient: ['#1e40af', '#3b82f6'] },
  { id: 'minimalist-warm', baseTheme: 'minimalist', displayName: 'Warm Minimal', category: 'Minimal', colors: { primary: '#92400e', secondary: '#fffbeb', background: '#ffffff', text: '#78350f', accent: '#d97706' }, previewGradient: ['#92400e', '#d97706'] },
  { id: 'minimalist-zen', baseTheme: 'minimalist', displayName: 'Zen', category: 'Minimal', colors: { primary: '#365314', secondary: '#f7fee7', background: '#ffffff', text: '#1a2e05', accent: '#84cc16' }, previewGradient: ['#365314', '#84cc16'] },
  { id: 'minimalist-steel', baseTheme: 'minimalist', displayName: 'Steel', category: 'Monochrome', colors: { primary: '#475569', secondary: '#f1f5f9', background: '#ffffff', text: '#1e293b', accent: '#64748b' }, previewGradient: ['#475569', '#64748b'] },
  { id: 'minimalist-lavender', baseTheme: 'minimalist', displayName: 'Lavender', category: 'Pastel', colors: { primary: '#6d28d9', secondary: '#f5f3ff', background: '#fefcff', text: '#4c1d95', accent: '#8b5cf6' }, previewGradient: ['#6d28d9', '#8b5cf6'] },
  { id: 'minimalist-coral', baseTheme: 'minimalist', displayName: 'Coral', category: 'Pastel', colors: { primary: '#e11d48', secondary: '#fff1f2', background: '#ffffff', text: '#881337', accent: '#fb7185' }, previewGradient: ['#e11d48', '#fb7185'] },

  // ─── Vintage (6 presets) ──────────────────────────────────────────
  { id: 'vintage-retro', baseTheme: 'vintage', displayName: 'Retro', category: 'Seasonal', colors: { primary: '#b45309', secondary: '#fef3c7', background: '#fffbeb', text: '#78350f', accent: '#92400e' }, typography: { fontFamily: 'Merriweather, serif', headingFont: 'Merriweather, serif' }, previewGradient: ['#b45309', '#92400e'] },
  { id: 'vintage-sepia', baseTheme: 'vintage', displayName: 'Sepia', category: 'Monochrome', colors: { primary: '#704214', secondary: '#fdf6e3', background: '#faf3e0', text: '#5c3310', accent: '#8b6914' }, typography: { fontFamily: 'Lora, serif', headingFont: 'Lora, serif' }, previewGradient: ['#704214', '#8b6914'] },
  { id: 'vintage-colonial', baseTheme: 'vintage', displayName: 'Colonial', category: 'Seasonal', colors: { primary: '#7f1d1d', secondary: '#fef2f2', background: '#fefae0', text: '#450a0a', accent: '#a16207' }, typography: { fontFamily: 'Merriweather, serif', headingFont: 'Merriweather, serif' }, previewGradient: ['#7f1d1d', '#a16207'] },
  { id: 'vintage-rustic', baseTheme: 'vintage', displayName: 'Rustic', category: 'Nature', colors: { primary: '#713f12', secondary: '#fef9c3', background: '#fefce8', text: '#422006', accent: '#a16207' }, typography: { fontFamily: 'Lora, serif', headingFont: 'Lora, serif' }, previewGradient: ['#713f12', '#a16207'] },
  { id: 'vintage-parchment', baseTheme: 'vintage', displayName: 'Parchment', category: 'Minimal', colors: { primary: '#57534e', secondary: '#fafaf9', background: '#f5f0e8', text: '#292524', accent: '#a8a29e' }, typography: { fontFamily: 'Merriweather, serif', headingFont: 'Merriweather, serif' }, previewGradient: ['#57534e', '#a8a29e'] },
  { id: 'vintage-antique', baseTheme: 'vintage', displayName: 'Antique', category: 'Luxury', colors: { primary: '#5c4033', secondary: '#faebd7', background: '#faf0e6', text: '#3e2723', accent: '#8b7355' }, typography: { fontFamily: 'Lora, serif', headingFont: 'Lora, serif' }, previewGradient: ['#5c4033', '#8b7355'] },

  // ─── Dark Shade (7 presets) ───────────────────────────────────────
  { id: 'darkshade-charcoal', baseTheme: 'dark-shade', displayName: 'Charcoal', category: 'Dark', colors: { primary: '#e5e7eb', secondary: '#1f2937', background: '#111827', text: '#d1d5db', accent: '#6b7280' }, previewGradient: ['#111827', '#6b7280'] },
  { id: 'darkshade-midnight-blue', baseTheme: 'dark-shade', displayName: 'Midnight Blue', category: 'Dark', colors: { primary: '#93c5fd', secondary: '#1e3a5f', background: '#0f172a', text: '#bfdbfe', accent: '#3b82f6' }, previewGradient: ['#0f172a', '#3b82f6'] },
  { id: 'darkshade-obsidian', baseTheme: 'dark-shade', displayName: 'Obsidian', category: 'Dark', colors: { primary: '#c084fc', secondary: '#1e1b4b', background: '#0c0a1d', text: '#ddd6fe', accent: '#7c3aed' }, previewGradient: ['#0c0a1d', '#7c3aed'] },
  { id: 'darkshade-graphite', baseTheme: 'dark-shade', displayName: 'Graphite', category: 'Dark', colors: { primary: '#d4d4d8', secondary: '#27272a', background: '#18181b', text: '#a1a1aa', accent: '#71717a' }, previewGradient: ['#18181b', '#71717a'] },
  { id: 'darkshade-forest-night', baseTheme: 'dark-shade', displayName: 'Forest Night', category: 'Dark', colors: { primary: '#86efac', secondary: '#14532d', background: '#052e16', text: '#bbf7d0', accent: '#22c55e' }, previewGradient: ['#052e16', '#22c55e'] },
  { id: 'darkshade-arctic-night', baseTheme: 'dark-shade', displayName: 'Arctic Night', category: 'Dark', colors: { primary: '#67e8f9', secondary: '#164e63', background: '#083344', text: '#a5f3fc', accent: '#06b6d4' }, previewGradient: ['#083344', '#06b6d4'] },
  { id: 'darkshade-blood', baseTheme: 'dark-shade', displayName: 'Blood Moon', category: 'Dark', colors: { primary: '#fca5a5', secondary: '#450a0a', background: '#1c0505', text: '#fecaca', accent: '#ef4444' }, previewGradient: ['#1c0505', '#ef4444'] },

  // ─── Dark Premium (6 presets) ─────────────────────────────────────
  { id: 'darkprem-gold', baseTheme: 'dark-premium', displayName: 'Dark Gold', category: 'Dark', colors: { primary: '#fbbf24', secondary: '#1f2937', background: '#000000', text: '#fef3c7', accent: '#f59e0b' }, previewGradient: ['#000000', '#f59e0b'] },
  { id: 'darkprem-platinum', baseTheme: 'dark-premium', displayName: 'Platinum', category: 'Dark', colors: { primary: '#e2e8f0', secondary: '#1e293b', background: '#0a0a0a', text: '#f1f5f9', accent: '#94a3b8' }, previewGradient: ['#0a0a0a', '#94a3b8'] },
  { id: 'darkprem-ruby', baseTheme: 'dark-premium', displayName: 'Ruby', category: 'Dark', colors: { primary: '#fda4af', secondary: '#4c0519', background: '#0c0000', text: '#ffe4e6', accent: '#e11d48' }, previewGradient: ['#0c0000', '#e11d48'] },
  { id: 'darkprem-emerald', baseTheme: 'dark-premium', displayName: 'Dark Emerald', category: 'Dark', colors: { primary: '#6ee7b7', secondary: '#064e3b', background: '#021c13', text: '#a7f3d0', accent: '#10b981' }, previewGradient: ['#021c13', '#10b981'] },
  { id: 'darkprem-sapphire', baseTheme: 'dark-premium', displayName: 'Dark Sapphire', category: 'Dark', colors: { primary: '#93c5fd', secondary: '#1e3a8a', background: '#0a0f2e', text: '#bfdbfe', accent: '#3b82f6' }, previewGradient: ['#0a0f2e', '#3b82f6'] },
  { id: 'darkprem-copper', baseTheme: 'dark-premium', displayName: 'Copper', category: 'Dark', colors: { primary: '#fdba74', secondary: '#431407', background: '#0c0500', text: '#fed7aa', accent: '#ea580c' }, previewGradient: ['#0c0500', '#ea580c'] },

  // ─── Royal Luxury (6 presets) ─────────────────────────────────────
  { id: 'royal-amethyst', baseTheme: 'royal-luxury', displayName: 'Amethyst', category: 'Luxury', colors: { primary: '#a855f7', secondary: '#faf5ff', background: '#ffffff', text: '#3b0764', accent: '#c084fc' }, previewGradient: ['#a855f7', '#c084fc'] },
  { id: 'royal-ruby', baseTheme: 'royal-luxury', displayName: 'Royal Ruby', category: 'Luxury', colors: { primary: '#e11d48', secondary: '#fff1f2', background: '#ffffff', text: '#4c0519', accent: '#fbbf24' }, previewGradient: ['#e11d48', '#fbbf24'] },
  { id: 'royal-imperial', baseTheme: 'royal-luxury', displayName: 'Imperial', category: 'Luxury', colors: { primary: '#1e3a8a', secondary: '#eff6ff', background: '#ffffff', text: '#1e1b4b', accent: '#c9a961' }, previewGradient: ['#1e3a8a', '#c9a961'] },
  { id: 'royal-crown', baseTheme: 'royal-luxury', displayName: 'Crown', category: 'Luxury', colors: { primary: '#92400e', secondary: '#fffbeb', background: '#fffef5', text: '#451a03', accent: '#d4af37' }, previewGradient: ['#92400e', '#d4af37'] },
  { id: 'royal-velvet', baseTheme: 'royal-luxury', displayName: 'Velvet', category: 'Luxury', colors: { primary: '#701a75', secondary: '#fdf4ff', background: '#ffffff', text: '#4a044e', accent: '#d946ef' }, previewGradient: ['#701a75', '#d946ef'] },
  { id: 'royal-jade', baseTheme: 'royal-luxury', displayName: 'Royal Jade', category: 'Luxury', colors: { primary: '#065f46', secondary: '#ecfdf5', background: '#ffffff', text: '#022c22', accent: '#d4af37' }, previewGradient: ['#065f46', '#d4af37'] },

  // ─── Ocean Breeze (6 presets) ─────────────────────────────────────
  { id: 'ocean-pacific', baseTheme: 'ocean-breeze', displayName: 'Pacific', category: 'Nature', colors: { primary: '#0369a1', secondary: '#e0f2fe', background: '#f0f9ff', text: '#0c4a6e', accent: '#0ea5e9' }, previewGradient: ['#0369a1', '#0ea5e9'] },
  { id: 'ocean-coral-reef', baseTheme: 'ocean-breeze', displayName: 'Coral Reef', category: 'Nature', colors: { primary: '#0891b2', secondary: '#ecfeff', background: '#ffffff', text: '#155e75', accent: '#f43f5e' }, previewGradient: ['#0891b2', '#f43f5e'] },
  { id: 'ocean-lagoon', baseTheme: 'ocean-breeze', displayName: 'Lagoon', category: 'Nature', colors: { primary: '#0d9488', secondary: '#f0fdfa', background: '#ffffff', text: '#134e4a', accent: '#2dd4bf' }, previewGradient: ['#0d9488', '#2dd4bf'] },
  { id: 'ocean-deep-sea', baseTheme: 'ocean-breeze', displayName: 'Deep Sea', category: 'Dark', colors: { primary: '#7dd3fc', secondary: '#0c4a6e', background: '#082f49', text: '#bae6fd', accent: '#0ea5e9' }, previewGradient: ['#082f49', '#0ea5e9'] },
  { id: 'ocean-mist', baseTheme: 'ocean-breeze', displayName: 'Sea Mist', category: 'Pastel', colors: { primary: '#06b6d4', secondary: '#f0fdfa', background: '#f8ffff', text: '#164e63', accent: '#67e8f9' }, previewGradient: ['#06b6d4', '#67e8f9'] },
  { id: 'ocean-navy', baseTheme: 'ocean-breeze', displayName: 'Ocean Navy', category: 'Modern', colors: { primary: '#1d4ed8', secondary: '#eff6ff', background: '#ffffff', text: '#1e3a8a', accent: '#60a5fa' }, previewGradient: ['#1d4ed8', '#60a5fa'] },

  // ─── Sunset Glow (6 presets) ──────────────────────────────────────
  { id: 'sunset-golden', baseTheme: 'sunset-glow', displayName: 'Golden Hour', category: 'Bold', colors: { primary: '#ea580c', secondary: '#fff7ed', background: '#ffffff', text: '#431407', accent: '#fbbf24' }, previewGradient: ['#ea580c', '#fbbf24'] },
  { id: 'sunset-dusk', baseTheme: 'sunset-glow', displayName: 'Dusk', category: 'Bold', colors: { primary: '#be185d', secondary: '#fdf2f8', background: '#ffffff', text: '#831843', accent: '#f97316' }, previewGradient: ['#be185d', '#f97316'] },
  { id: 'sunset-dawn', baseTheme: 'sunset-glow', displayName: 'Dawn', category: 'Pastel', colors: { primary: '#c2410c', secondary: '#fff7ed', background: '#fffbf5', text: '#7c2d12', accent: '#fb923c' }, previewGradient: ['#c2410c', '#fb923c'] },
  { id: 'sunset-desert', baseTheme: 'sunset-glow', displayName: 'Desert', category: 'Nature', colors: { primary: '#a16207', secondary: '#fef9c3', background: '#fffff0', text: '#713f12', accent: '#ca8a04' }, previewGradient: ['#a16207', '#ca8a04'] },
  { id: 'sunset-cherry', baseTheme: 'sunset-glow', displayName: 'Cherry Blossom', category: 'Pastel', colors: { primary: '#ec4899', secondary: '#fdf2f8', background: '#fff5f9', text: '#831843', accent: '#f9a8d4' }, previewGradient: ['#ec4899', '#f9a8d4'] },
  { id: 'sunset-flame', baseTheme: 'sunset-glow', displayName: 'Flame', category: 'Bold', colors: { primary: '#dc2626', secondary: '#fef2f2', background: '#ffffff', text: '#7f1d1d', accent: '#fb923c' }, previewGradient: ['#dc2626', '#fb923c'] },

  // ─── Forest Nature (6 presets) ────────────────────────────────────
  { id: 'forest-moss', baseTheme: 'forest-nature', displayName: 'Moss', category: 'Nature', colors: { primary: '#166534', secondary: '#f0fdf4', background: '#ffffff', text: '#14532d', accent: '#4ade80' }, previewGradient: ['#166534', '#4ade80'] },
  { id: 'forest-autumn', baseTheme: 'forest-nature', displayName: 'Autumn', category: 'Seasonal', colors: { primary: '#b45309', secondary: '#fffbeb', background: '#ffffff', text: '#78350f', accent: '#f59e0b' }, previewGradient: ['#b45309', '#f59e0b'] },
  { id: 'forest-spring', baseTheme: 'forest-nature', displayName: 'Spring', category: 'Seasonal', colors: { primary: '#15803d', secondary: '#ecfdf5', background: '#ffffff', text: '#052e16', accent: '#a3e635' }, previewGradient: ['#15803d', '#a3e635'] },
  { id: 'forest-rain', baseTheme: 'forest-nature', displayName: 'Rainforest', category: 'Nature', colors: { primary: '#047857', secondary: '#ecfdf5', background: '#f0fdf4', text: '#064e3b', accent: '#34d399' }, previewGradient: ['#047857', '#34d399'] },
  { id: 'forest-earth', baseTheme: 'forest-nature', displayName: 'Earth', category: 'Nature', colors: { primary: '#5c4033', secondary: '#fdf6ef', background: '#fffbf5', text: '#3e2723', accent: '#84cc16' }, previewGradient: ['#5c4033', '#84cc16'] },
  { id: 'forest-pine', baseTheme: 'forest-nature', displayName: 'Pine', category: 'Nature', colors: { primary: '#064e3b', secondary: '#ecfdf5', background: '#ffffff', text: '#022c22', accent: '#059669' }, previewGradient: ['#064e3b', '#059669'] },

  // ─── Cosmic Space (6 presets) ─────────────────────────────────────
  { id: 'cosmic-nebula', baseTheme: 'cosmic-space', displayName: 'Nebula', category: 'Dark', colors: { primary: '#c084fc', secondary: '#2e1065', background: '#0c0015', text: '#e9d5ff', accent: '#a855f7' }, previewGradient: ['#0c0015', '#a855f7'] },
  { id: 'cosmic-aurora', baseTheme: 'cosmic-space', displayName: 'Aurora', category: 'Dark', colors: { primary: '#34d399', secondary: '#064e3b', background: '#050d1a', text: '#a7f3d0', accent: '#818cf8' }, previewGradient: ['#050d1a', '#34d399'] },
  { id: 'cosmic-galaxy', baseTheme: 'cosmic-space', displayName: 'Galaxy', category: 'Dark', colors: { primary: '#818cf8', secondary: '#1e1b4b', background: '#0a0a1f', text: '#c7d2fe', accent: '#f472b6' }, previewGradient: ['#0a0a1f', '#f472b6'] },
  { id: 'cosmic-mars', baseTheme: 'cosmic-space', displayName: 'Mars', category: 'Dark', colors: { primary: '#fca5a5', secondary: '#450a0a', background: '#0d0000', text: '#fecaca', accent: '#dc2626' }, previewGradient: ['#0d0000', '#dc2626'] },
  { id: 'cosmic-saturn', baseTheme: 'cosmic-space', displayName: 'Saturn', category: 'Dark', colors: { primary: '#fcd34d', secondary: '#422006', background: '#0a0800', text: '#fef3c7', accent: '#f59e0b' }, previewGradient: ['#0a0800', '#f59e0b'] },
  { id: 'cosmic-void', baseTheme: 'cosmic-space', displayName: 'Void', category: 'Dark', colors: { primary: '#a78bfa', secondary: '#1e1b4b', background: '#000000', text: '#ddd6fe', accent: '#4f46e5' }, previewGradient: ['#000000', '#4f46e5'] },

  // ─── Extra Pastel Presets ─────────────────────────────────────────
  { id: 'pastel-peach', baseTheme: 'modern', displayName: 'Peach', category: 'Pastel', colors: { primary: '#f97316', secondary: '#fff7ed', background: '#fffaf5', text: '#7c2d12', accent: '#fb923c' }, previewGradient: ['#f97316', '#fb923c'] },
  { id: 'pastel-mint', baseTheme: 'minimalist', displayName: 'Mint', category: 'Pastel', colors: { primary: '#0d9488', secondary: '#f0fdfa', background: '#f0fffe', text: '#134e4a', accent: '#5eead4' }, previewGradient: ['#0d9488', '#5eead4'] },
  { id: 'pastel-sky', baseTheme: 'modern', displayName: 'Sky Blue', category: 'Pastel', colors: { primary: '#0284c7', secondary: '#e0f2fe', background: '#f0f9ff', text: '#075985', accent: '#38bdf8' }, previewGradient: ['#0284c7', '#38bdf8'] },
  { id: 'pastel-lilac', baseTheme: 'elegant', displayName: 'Lilac', category: 'Pastel', colors: { primary: '#7c3aed', secondary: '#f5f3ff', background: '#faf8ff', text: '#5b21b6', accent: '#a78bfa' }, typography: { fontFamily: 'Playfair Display, serif', headingFont: 'Playfair Display, serif' }, previewGradient: ['#7c3aed', '#a78bfa'] },
  { id: 'pastel-butter', baseTheme: 'minimalist', displayName: 'Butter', category: 'Pastel', colors: { primary: '#ca8a04', secondary: '#fefce8', background: '#fffff5', text: '#713f12', accent: '#facc15' }, previewGradient: ['#ca8a04', '#facc15'] },

  // ─── Extra Tech Presets ───────────────────────────────────────────
  { id: 'tech-terminal', baseTheme: 'neon', displayName: 'Terminal', category: 'Tech', colors: { primary: '#22c55e', secondary: '#0a1a0a', background: '#000000', text: '#4ade80', accent: '#16a34a' }, previewGradient: ['#000000', '#22c55e'] },
  { id: 'tech-hacker', baseTheme: 'neon', displayName: 'Hacker', category: 'Tech', colors: { primary: '#00ff00', secondary: '#001100', background: '#000800', text: '#33ff33', accent: '#009900' }, previewGradient: ['#000800', '#00ff00'] },
  { id: 'tech-circuit', baseTheme: 'dark-shade', displayName: 'Circuit', category: 'Tech', colors: { primary: '#22d3ee', secondary: '#164e63', background: '#0a1929', text: '#a5f3fc', accent: '#06b6d4' }, previewGradient: ['#0a1929', '#06b6d4'] },
];

export default THEME_PRESETS;

export const PRESET_CATEGORIES = [
  'All', 'Modern', 'Minimal', 'Dark', 'Bold', 'Luxury', 'Nature',
  'Tech', 'Neon', 'Pastel', 'Monochrome', 'Seasonal',
] as const;

export type PresetCategory = typeof PRESET_CATEGORIES[number];
