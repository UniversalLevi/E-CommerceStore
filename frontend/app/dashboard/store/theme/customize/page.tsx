'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Loader2, Save, RotateCcw } from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter, system-ui, sans-serif',
  'Poppins, sans-serif',
  'Montserrat, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Nunito, sans-serif',
  'Raleway, sans-serif',
  'Playfair Display, serif',
  'Cormorant Garamond, serif',
  'Merriweather, serif',
  'Lora, serif',
  'Georgia, serif',
  'DM Sans, sans-serif',
  'Space Grotesk, sans-serif',
  'JetBrains Mono, monospace',
  'Orbitron, sans-serif',
];

interface ThemeCustomizations {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
  };
  layout: {
    borderRadius: number;
    spacing: string;
  };
  logo?: string;
}

export default function ThemeCustomizePage() {
  const { store, refreshStore } = useStore();
  const [saving, setSaving] = useState(false);
  const [customizations, setCustomizations] = useState<ThemeCustomizations>({
    colors: { primary: '#2563eb', secondary: '#f8fafc', background: '#ffffff', text: '#1e293b', accent: '#3b82f6' },
    typography: { fontFamily: 'Inter, system-ui, sans-serif', headingFont: 'Inter, system-ui, sans-serif', fontSize: '16px' },
    layout: { borderRadius: 8, spacing: 'normal' },
  });
  const [originalCustomizations, setOriginalCustomizations] = useState<ThemeCustomizations | null>(null);

  useEffect(() => {
    if (store?.settings?.theme?.customizations) {
      const c = store.settings.theme.customizations;
      const merged: ThemeCustomizations = {
        colors: {
          primary: c.colors?.primary || '#2563eb',
          secondary: c.colors?.secondary || '#f8fafc',
          background: c.colors?.background || '#ffffff',
          text: c.colors?.text || '#1e293b',
          accent: c.colors?.accent || '#3b82f6',
        },
        typography: {
          fontFamily: c.typography?.fontFamily || 'Inter, system-ui, sans-serif',
          headingFont: c.typography?.headingFont || 'Inter, system-ui, sans-serif',
          fontSize: c.typography?.fontSize || '16px',
        },
        layout: {
          borderRadius: c.layout?.borderRadius ?? 8,
          spacing: c.layout?.spacing || 'normal',
        },
        logo: c.logo,
      };
      setCustomizations(merged);
      setOriginalCustomizations(merged);
    }
  }, [store]);

  const updateColor = (key: string, value: string) => {
    setCustomizations(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const handleSave = async () => {
    if (!store) return;
    try {
      setSaving(true);
      const response = await api.updateStoreTheme(store._id, {
        name: store.settings?.theme?.name || 'modern',
        customizations: {
          colors: customizations.colors,
          typography: customizations.typography,
          layout: customizations.layout,
          logo: customizations.logo,
        },
      });
      if (response.success) {
        await refreshStore();
        notify.success('Theme customizations saved!');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalCustomizations) setCustomizations(originalCustomizations);
  };

  if (!store) return null;

  const themeName = store.settings?.theme?.name || 'modern';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/store/theme" className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Customize Theme</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Base: <span className="font-medium capitalize">{themeName}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all text-sm flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Colors */}
          <div className="bg-surface-raised rounded-xl border border-border-default p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(['primary', 'secondary', 'background', 'text', 'accent'] as const).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-secondary mb-1 capitalize">{key}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customizations.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customizations.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="flex-1 px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-surface-raised rounded-xl border border-border-default p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Typography</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Body Font</label>
                <select
                  value={customizations.typography.fontFamily}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, typography: { ...prev.typography, fontFamily: e.target.value } }))}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Heading Font</label>
                <select
                  value={customizations.typography.headingFont}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, typography: { ...prev.typography, headingFont: e.target.value } }))}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Font Size</label>
                <select
                  value={customizations.typography.fontSize}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, typography: { ...prev.typography, fontSize: e.target.value } }))}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="14px">Small (14px)</option>
                  <option value="16px">Medium (16px)</option>
                  <option value="18px">Large (18px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="bg-surface-raised rounded-xl border border-border-default p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Layout</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Border Radius: {customizations.layout.borderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={customizations.layout.borderRadius}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, layout: { ...prev.layout, borderRadius: Number(e.target.value) } }))}
                  className="w-full accent-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Spacing</label>
                <select
                  value={customizations.layout.spacing}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, layout: { ...prev.layout, spacing: e.target.value } }))}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Live Preview</h3>
            <div
              className="rounded-xl border border-border-default overflow-hidden shadow-lg"
              style={{
                backgroundColor: customizations.colors.background,
                fontFamily: customizations.typography.fontFamily,
                fontSize: customizations.typography.fontSize,
              }}
            >
              {/* Mini header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: customizations.colors.primary }}>
                <span className="text-sm font-bold" style={{ color: customizations.colors.background }}>
                  {store.name}
                </span>
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customizations.colors.accent, opacity: 0.8 }} />
                </div>
              </div>

              {/* Hero */}
              <div className="px-4 py-6 text-center" style={{ backgroundColor: customizations.colors.secondary }}>
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: customizations.colors.text, fontFamily: customizations.typography.headingFont }}
                >
                  Welcome
                </h2>
                <p className="text-xs" style={{ color: customizations.colors.text + 'AA' }}>Discover amazing products</p>
              </div>

              {/* Product cards */}
              <div className="p-4 grid grid-cols-2 gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden"
                    style={{
                      backgroundColor: customizations.colors.secondary,
                      borderRadius: `${customizations.layout.borderRadius}px`,
                      border: `1px solid ${customizations.colors.text}15`,
                    }}
                  >
                    <div className="h-16" style={{ backgroundColor: customizations.colors.accent + '20' }} />
                    <div className="p-2">
                      <p className="text-[10px] font-medium truncate" style={{ color: customizations.colors.text }}>Product {i}</p>
                      <p className="text-[10px] font-bold" style={{ color: customizations.colors.accent }}>$29.99</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-4 pb-4">
                <div
                  className="w-full py-2 text-center text-xs font-medium"
                  style={{
                    backgroundColor: customizations.colors.accent,
                    color: customizations.colors.background,
                    borderRadius: `${customizations.layout.borderRadius}px`,
                  }}
                >
                  Shop Now
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
