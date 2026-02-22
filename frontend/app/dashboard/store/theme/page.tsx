'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Loader2, ExternalLink, CheckCircle2, Palette, Eye, Search, SlidersHorizontal } from 'lucide-react';
import THEME_PRESETS from '@/themes/presets';

const CATEGORIES = ['All', 'Modern', 'Minimal', 'Dark', 'Bold', 'Luxury', 'Nature', 'Tech', 'Neon', 'Pastel', 'Monochrome', 'Seasonal'];

function mergePresets(apiThemes: any[]): any[] {
  const presetThemes = THEME_PRESETS.map((p) => ({
    name: p.baseTheme,
    displayName: p.displayName,
    description: `${p.displayName} preset based on ${p.baseTheme}`,
    category: p.category,
    defaultColors: p.colors,
    defaultTypography: {
      fontFamily: p.typography?.fontFamily || 'Inter, system-ui, sans-serif',
      headingFont: p.typography?.headingFont || 'Inter, system-ui, sans-serif',
      fontSize: p.typography?.fontSize || '16px',
    },
    isPreset: true,
    presetId: p.id,
    baseTheme: p.baseTheme,
    previewGradient: p.previewGradient,
  }));
  return [...apiThemes, ...presetThemes];
}

export default function StoreThemePage() {
  const { store, refreshStore } = useStore();
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [updatingTheme, setUpdatingTheme] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAvailableThemes = useCallback(async () => {
    if (!store) return;
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/store-dashboard/themes');
      if (response.success) {
        const apiThemes = response.data || [];
        const themes = mergePresets(apiThemes);
        setAvailableThemes(themes);
        if (store?.settings?.theme?.name) {
          const currentThemeExists = themes.some((t: any) => t.name === store.settings.theme.name && !t.isPreset);
          if (currentThemeExists) setSelectedTheme(store.settings.theme.name);
        }
      } else {
        setAvailableThemes([]);
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      setAvailableThemes([]);
    }
  }, [store]);

  useEffect(() => {
    if (store) fetchAvailableThemes();
  }, [store, fetchAvailableThemes]);

  const filteredThemes = useMemo(() => {
    let themes = availableThemes;
    if (activeCategory !== 'All') {
      themes = themes.filter((t) => (t.category || '').toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      themes = themes.filter((t) =>
        t.displayName?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    return themes;
  }, [availableThemes, activeCategory, searchQuery]);

  const handleSelectTheme = (theme: any) => {
    setPreviewTheme(theme.isPreset ? theme.presetId : theme.name);
    setSelectedTheme(theme.isPreset ? theme.baseTheme : theme.name);
    setSelectedPresetId(theme.isPreset ? theme.presetId : null);
  };

  const isSelected = (theme: any) => {
    if (theme.isPreset) return selectedPresetId === theme.presetId;
    return !selectedPresetId && selectedTheme === theme.name;
  };

  const handleApply = async () => {
    if (!store) return;
    try {
      setUpdatingTheme(true);
      const themeToApply = selectedPresetId
        ? availableThemes.find((t: any) => t.presetId === selectedPresetId)
        : availableThemes.find((t: any) => t.name === selectedTheme && !t.isPreset);

      if (!themeToApply) return;

      const payload: any = {
        name: themeToApply.isPreset ? themeToApply.baseTheme : themeToApply.name,
        customizations: {
          colors: themeToApply.defaultColors,
          typography: themeToApply.defaultTypography,
        },
      };

      const response = await api.updateStoreTheme(store._id, payload);
      if (response.success) {
        await refreshStore();
        notify.success('Theme applied successfully!');
        setPreviewTheme(null);
        setTimeout(() => window.open(`/storefront/${store.slug}`, '_blank'), 300);
      } else {
        notify.error('Failed to apply theme');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to apply theme');
    } finally {
      setUpdatingTheme(false);
    }
  };

  if (!store) return null;

  const hasUnappliedSelection =
    selectedTheme &&
    (selectedTheme !== store.settings?.theme?.name || selectedPresetId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Theme & Appearance</h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose from {availableThemes.length}+ themes and presets
          </p>
        </div>
        <Link
          href="/dashboard/store/theme/customize"
          className="px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all flex items-center gap-2 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Customize
        </Link>
      </div>

      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Select Theme</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-surface-base border border-border-default text-text-secondary hover:text-text-primary hover:border-purple-500/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Theme Grid */}
        {filteredThemes.length === 0 ? (
          <div className="text-center py-12 text-text-secondary text-sm">
            No themes found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredThemes.map((theme, idx) => {
              const key = theme.isPreset ? theme.presetId : `${theme.name}-${idx}`;
              const selected = isSelected(theme);
              const gradient = theme.previewGradient
                ? `linear-gradient(135deg, ${theme.previewGradient[0]} 0%, ${theme.previewGradient[1]} 100%)`
                : `linear-gradient(135deg, ${theme.defaultColors?.primary || '#333'} 0%, ${theme.defaultColors?.accent || '#666'} 100%)`;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectTheme(theme)}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                      : 'border-border-default hover:border-purple-500/50'
                  }`}
                >
                  {selected && (
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1 z-10">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className="w-full h-20 rounded-lg mb-2 flex items-center justify-center"
                    style={{ background: gradient }}
                  >
                    <span className="text-white text-xs font-semibold drop-shadow-lg px-2 text-center leading-tight">
                      {theme.displayName}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-text-primary truncate">{theme.displayName}</p>
                  <p className="text-[10px] text-text-secondary capitalize">{theme.category}</p>
                  {theme.isPreset && (
                    <span className="absolute top-2 left-2 bg-purple-600/80 text-white text-[9px] px-1.5 py-0.5 rounded-full">Preset</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Apply button */}
        {hasUnappliedSelection && (
          <div className="flex gap-3">
            <button
              onClick={handleApply}
              disabled={updatingTheme}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updatingTheme ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Applying...</>
              ) : (
                <><Eye className="h-5 w-5" />Apply Theme</>
              )}
            </button>
            {previewTheme && (
              <a
                href={`/storefront/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium flex items-center gap-2"
              >
                <ExternalLink className="h-5 w-5" />Preview Store
              </a>
            )}
          </div>
        )}

        {store.settings?.theme && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <strong>Current Theme:</strong>{' '}
              {availableThemes.find((t) => t.name === store.settings.theme.name && !t.isPreset)?.displayName || store.settings.theme.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
