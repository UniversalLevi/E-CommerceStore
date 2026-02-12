'use client';

import { useStore } from '@/contexts/StoreContext';
import { Store as StoreIcon, ExternalLink } from 'lucide-react';

export default function StoreInformationPage() {
  const { store } = useStore();

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Store Information</h1>
        <p className="text-sm text-text-secondary mt-1">View your store details</p>
      </div>

      {/* Store Information */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <StoreIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Store Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Store Name</label>
            <input
              type="text"
              value={store.name}
              disabled
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Store Slug</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={store.slug}
                disabled
                className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
              />
              <div className="flex gap-2">
                <a
                  href={`/storefront/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Store (Path)
                </a>
                <a
                  href={`https://${store.slug}.eazyds.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Store (Subdomain)
                </a>
              </div>
            </div>
            <p className="mt-1 text-sm text-text-secondary">Slug cannot be changed after creation</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
            <input
              type="text"
              value={store.currency}
              disabled
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-text-secondary">Currency cannot be changed after creation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
