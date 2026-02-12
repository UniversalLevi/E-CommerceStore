'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Loader2, ExternalLink, CheckCircle2, Palette, Eye } from 'lucide-react';

export default function StoreThemePage() {
  const { store, refreshStore } = useStore();
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [updatingTheme, setUpdatingTheme] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const fetchAvailableThemes = useCallback(async () => {
    if (!store) return;
    
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/store-dashboard/themes');
      if (response.success) {
        const themes = response.data || [];
        setAvailableThemes(themes);
        
        if (store?.settings?.theme?.name) {
          const currentThemeExists = themes.some(t => t.name === store.settings.theme.name);
          if (currentThemeExists) {
            setSelectedTheme(store.settings.theme.name);
          } else {
            setSelectedTheme('');
          }
        } else {
          setSelectedTheme('');
        }
      } else {
        setAvailableThemes([]);
        setSelectedTheme('');
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      setAvailableThemes([]);
      setSelectedTheme('');
    }
  }, [store]);

  useEffect(() => {
    if (store) {
      fetchAvailableThemes();
    }
  }, [store, fetchAvailableThemes]);

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Theme & Appearance</h1>
        <p className="text-sm text-text-secondary mt-1">Customize your store's look and feel</p>
      </div>

      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Theme & Appearance</h2>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-text-primary mb-4">Select Store Theme</p>
            {availableThemes.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
                <p className="text-yellow-400 mb-2">No themes available</p>
                <p className="text-sm text-text-secondary">
                  Please create and activate templates in the{' '}
                  <Link href="/admin/templates" className="text-primary-500 hover:underline">
                    Templates section
                  </Link>
                  {' '}to use them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setPreviewTheme(theme.name);
                    setSelectedTheme(theme.name);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedTheme === theme.name
                      ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                      : 'border-border-default hover:border-purple-500/50'
                  }`}
                >
                  {selectedTheme === theme.name && (
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className="w-full h-24 rounded-lg mb-3 flex items-center justify-center text-white font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${theme.defaultColors.primary} 0%, ${theme.defaultColors.accent} 100%)`,
                    }}
                  >
                    {theme.displayName}
                  </div>
                  <p className="text-xs font-medium text-text-primary text-center">{theme.displayName}</p>
                  <p className="text-xs text-text-secondary text-center mt-1">{theme.category}</p>
                </button>
              ))}
              </div>
            )}
          </div>

          {selectedTheme && selectedTheme !== store.settings?.theme?.name && availableThemes.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    setUpdatingTheme(true);
                    const response = await api.updateStoreTheme(store._id, {
                      name: selectedTheme,
                      customizations: {},
                    });
                    if (response.success) {
                      await refreshStore();
                      notify.success('Theme applied successfully! Please refresh the storefront page to see changes.');
                      setPreviewTheme(null);
                      setTimeout(() => {
                        window.open(`/storefront/${store.slug}`, '_blank');
                      }, 300);
                    } else {
                      notify.error('Failed to apply theme');
                    }
                  } catch (error: any) {
                    console.error('Theme update error:', error);
                    notify.error(error.response?.data?.message || 'Failed to apply theme');
                  } finally {
                    setUpdatingTheme(false);
                  }
                }}
                disabled={updatingTheme}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingTheme ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Apply Theme
                  </>
                )}
              </button>
              {previewTheme && (
                <a
                  href={`/storefront/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium flex items-center gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  Preview Store
                </a>
              )}
            </div>
          )}

          {store.settings?.theme && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Current Theme:</strong> {availableThemes.find((t) => t.name === store.settings.theme.name)?.displayName || store.settings.theme.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
