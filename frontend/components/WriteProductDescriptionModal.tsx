'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Button from './Button';

interface WriteProductDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle?: string;
  onSave?: (description: ProductDescription) => void;
}

interface ProductDescription {
  title: string;
  shortDescription: string;
  longDescription: string;
  bullets: string[];
  seoMeta: {
    title: string;
    description: string;
  };
  fallback?: boolean;
}

export default function WriteProductDescriptionModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  onSave,
}: WriteProductDescriptionModalProps) {
  const [tone, setTone] = useState<'persuasive' | 'informative' | 'seo'>('persuasive');
  const [length, setLength] = useState<'short' | 'long'>('short');
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<ProductDescription | null>(null);
  const [editedDescription, setEditedDescription] = useState<ProductDescription | null>(null);
  const [error, setError] = useState('');

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isOpen && productId) {
      const draftKey = `draft-desc-${productId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setEditedDescription(parsed);
          setDescription(parsed);
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [isOpen, productId]);

  // Save draft to localStorage whenever editedDescription changes
  useEffect(() => {
    if (editedDescription && productId) {
      const draftKey = `draft-desc-${productId}`;
      localStorage.setItem(draftKey, JSON.stringify(editedDescription));
    }
  }, [editedDescription, productId]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      setDescription(null);
      setEditedDescription(null);

      const response = await api.post<{ success: boolean; data: ProductDescription }>(
        '/api/ai/write-product-description',
        {
          productId,
          tone,
          length,
        }
      );

      setDescription(response.data);
      setEditedDescription(response.data);
    } catch (error: any) {
      console.error('Failed to generate description:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate description';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!editedDescription) return;

    const text = `${editedDescription.title}\n\n${editedDescription.shortDescription}\n\n${editedDescription.longDescription}\n\n${editedDescription.bullets.map(b => `• ${b}`).join('\n')}\n\nSEO Title: ${editedDescription.seoMeta.title}\nSEO Description: ${editedDescription.seoMeta.description}`;
    
    navigator.clipboard.writeText(text);
    notify.success('Copied to clipboard!');
  };

  const handleSave = () => {
    if (!editedDescription) return;
    
    if (onSave) {
      onSave(editedDescription);
    }
    
    // Clear draft after saving
    const draftKey = `draft-desc-${productId}`;
    localStorage.removeItem(draftKey);
    
    notify.success('Description saved!');
    onClose();
  };

  const updateField = (field: keyof ProductDescription, value: any) => {
    if (!editedDescription) return;
    
    setEditedDescription({
      ...editedDescription,
      [field]: value,
    });
  };

  const updateBullet = (index: number, value: string) => {
    if (!editedDescription) return;
    
    const newBullets = [...editedDescription.bullets];
    newBullets[index] = value;
    setEditedDescription({
      ...editedDescription,
      bullets: newBullets,
    });
  };

  const updateSeoMeta = (field: 'title' | 'description', value: string) => {
    if (!editedDescription) return;
    
    setEditedDescription({
      ...editedDescription,
      seoMeta: {
        ...editedDescription.seoMeta,
        [field]: value,
      },
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-surface-raised border border-border-default p-8 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-text-primary">
                    Write Product Description (AI)
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {productTitle && (
                  <p className="text-text-secondary mb-6">For: {productTitle}</p>
                )}

                {!description && !loading && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Tone
                      </label>
                      <div className="flex gap-3">
                        {(['persuasive', 'informative', 'seo'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              tone === t
                                ? 'bg-primary-500 text-black border-primary-500'
                                : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                            }`}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Length
                      </label>
                      <div className="flex gap-3">
                        {(['short', 'long'] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => setLength(l)}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              length === l
                                ? 'bg-primary-500 text-black border-primary-500'
                                : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                            }`}
                          >
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleGenerate} className="w-full">
                      Generate Description
                    </Button>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-text-secondary">Generating product description...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
                    <p className="font-semibold mb-2">Failed to generate description</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {editedDescription && (
                  <div className="space-y-6">
                    <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                      <p className="text-sm text-text-secondary">
                        <strong>Note:</strong> AI-generated copy — review before publishing. Edit as needed.
                        {editedDescription.fallback && (
                          <span className="block mt-1 text-yellow-400">
                            Using fallback description (AI service unavailable).
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Product Title
                      </label>
                      <input
                        type="text"
                        value={editedDescription.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Short Description
                      </label>
                      <textarea
                        value={editedDescription.shortDescription}
                        onChange={(e) => updateField('shortDescription', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Long Description
                      </label>
                      <textarea
                        value={editedDescription.longDescription}
                        onChange={(e) => updateField('longDescription', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Benefit Bullets (5)
                      </label>
                      <div className="space-y-2">
                        {editedDescription.bullets.map((bullet, index) => (
                          <input
                            key={index}
                            type="text"
                            value={bullet}
                            onChange={(e) => updateBullet(index, e.target.value)}
                            placeholder={`Benefit ${index + 1}`}
                            className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          SEO Meta Title (60 chars)
                        </label>
                        <input
                          type="text"
                          value={editedDescription.seoMeta.title}
                          onChange={(e) => updateSeoMeta('title', e.target.value)}
                          maxLength={60}
                          className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-text-muted mt-1">
                          {editedDescription.seoMeta.title.length}/60
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          SEO Meta Description (150 chars)
                        </label>
                        <textarea
                          value={editedDescription.seoMeta.description}
                          onChange={(e) => updateSeoMeta('description', e.target.value)}
                          maxLength={150}
                          rows={2}
                          className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-text-muted mt-1">
                          {editedDescription.seoMeta.description.length}/150
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border-default">
                      <Button onClick={handleCopyAll} variant="secondary" className="flex-1">
                        Copy All
                      </Button>
                      <Button onClick={handleSave} className="flex-1">
                        Save to Product
                      </Button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

