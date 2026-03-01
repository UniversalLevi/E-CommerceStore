'use client';

import { useState, useCallback, useEffect } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Image, LayoutGrid, Code, Type, Plus, ChevronRight, Copy, Check, Loader2 } from 'lucide-react';
import MediaUploader from '@/components/MediaUploader';
import { api } from '@/lib/api';

export type SectionType = 'hero' | 'featured_products' | 'custom_html' | 'text';

export interface HomeSection {
  id: string;
  type: SectionType;
  order: number;
  props: Record<string, string | number | string[]>;
}

const SECTION_DEFAULTS: Record<SectionType, Record<string, string | number | string[]>> = {
  hero: { imageUrl: '', videoUrl: '', heading: 'Welcome', subheading: 'Discover our collection', ctaText: 'Shop Now', ctaLink: '' },
  featured_products: { title: 'Featured Products', limit: 8, productIds: [] },
  custom_html: { html: '<p>Your custom content here.</p>' },
  text: { heading: 'Section Title', body: 'Add your text content here.' },
};

const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero banner',
  featured_products: 'Featured products',
  custom_html: 'Custom HTML',
  text: 'Text block',
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  hero: 'Full-width banner with image, heading and CTA',
  featured_products: 'Grid of products from your catalog',
  custom_html: 'Embed custom HTML or widgets',
  text: 'Rich text heading and body',
};

const SECTION_ICONS: Record<SectionType, typeof Image> = {
  hero: Image,
  featured_products: LayoutGrid,
  custom_html: Code,
  text: Type,
};

export default function HomeSectionsEditor({
  sections,
  onChange,
  onSave,
  saving,
  storeId,
}: {
  sections: HomeSection[];
  onChange: (s: HomeSection[]) => void;
  onSave: () => void;
  saving: boolean;
  storeId?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [justDuplicated, setJustDuplicated] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<{ _id: string; title: string; images?: string[] }[]>([]);
  const [storeProductsLoading, setStoreProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (!storeId || !editingId) return;
    const section = sections.find((s) => s.id === editingId);
    if (section?.type !== 'featured_products') return;
    setStoreProductsLoading(true);
    api
      .getStoreProducts(storeId, { limit: 200 })
      .then((r) => {
        const list = (r as any)?.data?.products;
        setStoreProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setStoreProducts([]))
      .finally(() => setStoreProductsLoading(false));
  }, [storeId, editingId, sections]);

  const move = useCallback((index: number, dir: 'up' | 'down') => {
    const next = [...sorted];
    const j = dir === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    next.forEach((s, i) => (s.order = i));
    onChange(next);
  }, [sorted, onChange]);

  const remove = useCallback((id: string) => {
    const next = sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    onChange(next);
    if (editingId === id) setEditingId(null);
  }, [sections, onChange, editingId]);

  const add = useCallback((type: SectionType) => {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newSection: HomeSection = {
      id,
      type,
      order: sections.length,
      props: { ...SECTION_DEFAULTS[type] },
    };
    onChange([...sections, newSection].map((s, i) => ({ ...s, order: i })));
    setEditingId(id);
    setShowAddSection(false);
  }, [sections, onChange]);

  const duplicate = useCallback((section: HomeSection) => {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newSection: HomeSection = { ...section, id, order: section.order + 1, props: { ...section.props } };
    const sortedCopy = [...sections].sort((a, b) => a.order - b.order);
    const idx = sortedCopy.findIndex((s) => s.id === section.id);
    if (idx < 0) return;
    const next = [...sortedCopy.slice(0, idx + 1), newSection, ...sortedCopy.slice(idx + 1)].map((s, i) => ({ ...s, order: i }));
    onChange(next);
    setJustDuplicated(id);
    setTimeout(() => setJustDuplicated(null), 1200);
  }, [sections, onChange]);

  const updateProps = useCallback((id: string, props: Record<string, string | number | string[]>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, props } : s)));
  }, [sections, onChange]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverId(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const dragId = e.dataTransfer.getData('text/plain');
    if (!dragId || dragId === dropId) return;
    const fromIdx = sorted.findIndex((s) => s.id === dragId);
    const toIdx = sorted.findIndex((s) => s.id === dropId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...sorted];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    next.forEach((s, i) => (s.order = i));
    onChange(next);
  };

  const hasChanges = sections.length > 0;

  return (
    <div className="space-y-6">
      {/* Add section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowAddSection(!showAddSection)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors shadow-lg shadow-violet-500/25"
        >
          <Plus className="h-4 w-4" />
          Add section
          <ChevronRight className={`h-4 w-4 transition-transform ${showAddSection ? 'rotate-90' : ''}`} />
        </button>
        {hasChanges && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              'Save home layout'
            )}
          </button>
        )}
      </div>

      {showAddSection && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['hero', 'featured_products', 'text', 'custom_html'] as SectionType[]).map((type) => {
            const Icon = SECTION_ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 text-left transition-all duration-200 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30 group-hover:text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-white">{SECTION_LABELS[type]}</span>
                <span className="text-xs text-gray-400 leading-snug">{SECTION_DESCRIPTIONS[type]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Section list with drag & drop */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/15 bg-white/5 p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 text-gray-500 mb-4">
              <LayoutGrid className="h-7 w-7" />
            </div>
            <p className="text-gray-400 mb-1">No sections yet</p>
            <p className="text-sm text-gray-500">Add sections above to build your home page. If none are set, the default hero + product grid is shown on the storefront.</p>
            <button
              type="button"
              onClick={() => setShowAddSection(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add first section
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((section, index) => {
              const Icon = SECTION_ICONS[section.type];
              const isDragging = draggedId === section.id;
              const isDragOver = dragOverId === section.id;
              const isEditing = editingId === section.id;
              const justDup = justDuplicated === section.id;
              return (
                <li
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, section.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, section.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border bg-[#0d0d1a] transition-all
                    ${isDragging ? 'opacity-60 scale-[0.98]' : ''}
                    ${isDragOver ? 'border-violet-500/60 ring-2 ring-violet-500/30' : 'border-white/10 hover:border-white/20'}
                    ${justDup ? 'ring-2 ring-emerald-500/50' : ''}
                  `}
                >
                  <div className="flex flex-col gap-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/10"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 'down')}
                      disabled={index === sorted.length - 1}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/10"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div
                    className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-400 p-1.5 rounded hover:bg-white/10 shrink-0"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-white truncate">{SECTION_LABELS[section.type]}</span>
                    {justDup && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Duplicated</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => duplicate(section)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicate section"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : section.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: isEditing ? 'rgb(139 92 246 / 0.3)' : 'rgb(255 255 255 / 0.1)', color: isEditing ? '#c4b5fd' : '#e5e7eb' }}
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(section.id)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                      title="Remove section"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Edit panel */}
      {editingId && (() => {
        const section = sections.find((s) => s.id === editingId);
        if (!section) return null;
        return (
          <div className="rounded-xl border border-white/15 bg-[#1a1a2e] p-5 space-y-4 shadow-xl">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20">
                {(() => {
                  const Icon = SECTION_ICONS[section.type];
                  return <Icon className="h-4 w-4 text-violet-400" />;
                })()}
              </span>
              Edit: {SECTION_LABELS[section.type]}
            </h4>
            {section.type === 'hero' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Hero image</label>
                  <MediaUploader
                    type="image"
                    urls={(section.props.imageUrl as string) ? [section.props.imageUrl as string] : []}
                    onChange={(urls) => updateProps(section.id, { ...section.props, imageUrl: urls[0] || '' })}
                    maxFiles={1}
                  />
                  <input
                    value={(section.props.imageUrl as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, imageUrl: e.target.value })}
                    className="mt-2 w-full px-3 py-2 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 outline-none transition"
                    placeholder="Or paste image URL"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Hero video (optional)</label>
                  <MediaUploader
                    type="video"
                    urls={(section.props.videoUrl as string) ? [section.props.videoUrl as string] : []}
                    onChange={(urls) => updateProps(section.id, { ...section.props, videoUrl: urls[0] || '' })}
                    maxFiles={1}
                  />
                  <input
                    value={(section.props.videoUrl as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, videoUrl: e.target.value })}
                    className="mt-2 w-full px-3 py-2 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 outline-none transition"
                    placeholder="Or paste video URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Heading</label>
                  <input
                    value={(section.props.heading as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, heading: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    placeholder="Welcome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Subheading</label>
                  <input
                    value={(section.props.subheading as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, subheading: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    placeholder="Discover our collection"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Button text</label>
                  <input
                    value={(section.props.ctaText as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, ctaText: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Button link</label>
                  <input
                    value={(section.props.ctaLink as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, ctaLink: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    placeholder="/storefront/your-slug"
                  />
                </div>
              </div>
            )}
            {section.type === 'featured_products' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Section title</label>
                    <input
                      value={(section.props.title as string) || ''}
                      onChange={(e) => updateProps(section.id, { ...section.props, title: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                      placeholder="Featured Products"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Max products (when not selecting specific)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={(section.props.limit as number) ?? 8}
                      onChange={(e) => updateProps(section.id, { ...section.props, limit: parseInt(e.target.value, 10) || 8 })}
                      className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    />
                  </div>
                </div>
                {storeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Select products to feature (optional)</label>
                    <p className="text-xs text-gray-500 mb-2">If you select products, only these will show in this section. Otherwise the newest products are shown.</p>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full px-3 py-2 mb-2 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 outline-none"
                    />
                    {storeProductsLoading ? (
                      <div className="flex items-center gap-2 py-4 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading products...</div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0d0d1a] p-2 space-y-1">
                        {(productSearch.trim()
                          ? storeProducts.filter((p) => p.title?.toLowerCase().includes(productSearch.toLowerCase()))
                          : storeProducts
                        ).map((p) => {
                          const selected = Array.isArray(section.props.productIds) ? (section.props.productIds as string[]).includes(p._id) : false;
                          return (
                            <label
                              key={p._id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  const ids = (Array.isArray(section.props.productIds) ? [...(section.props.productIds as string[])] : []);
                                  const next = selected ? ids.filter((id) => id !== p._id) : [...ids, p._id];
                                  updateProps(section.id, { ...section.props, productIds: next });
                                }}
                                className="rounded"
                              />
                              {p.images?.[0] && (
                                <img src={typeof p.images[0] === 'string' ? p.images[0] : (p.images[0] as any)?.url} alt="" className="w-8 h-8 rounded object-cover" />
                              )}
                              <span className="text-sm text-white truncate">{p.title}</span>
                            </label>
                          );
                        })}
                        {storeProducts.length === 0 && !storeProductsLoading && (
                          <p className="text-sm text-gray-500 py-2">No products in this store yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {section.type === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Heading</label>
                  <input
                    value={(section.props.heading as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, heading: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                    placeholder="Section Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Body (HTML allowed)</label>
                  <textarea
                    value={(section.props.body as string) || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, body: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm min-h-[100px] focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition resize-y"
                    placeholder="Your text content…"
                  />
                </div>
              </div>
            )}
            {section.type === 'custom_html' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">HTML content</label>
                <textarea
                  value={(section.props.html as string) || ''}
                  onChange={(e) => updateProps(section.id, { ...section.props, html: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white text-sm font-mono min-h-[140px] focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition resize-y"
                  placeholder="<p>Your custom content here.</p>"
                />
              </div>
            )}
          </div>
        );
      })()}

      {hasChanges && sorted.length > 0 && (
        <p className="text-xs text-gray-500">
          Drag rows to reorder. Click Save home layout to publish changes to your storefront.
        </p>
      )}
    </div>
  );
}
