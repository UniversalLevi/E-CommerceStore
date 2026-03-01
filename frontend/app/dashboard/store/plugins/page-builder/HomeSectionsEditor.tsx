'use client';

import { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Image, LayoutGrid, Code, Type } from 'lucide-react';

export type SectionType = 'hero' | 'featured_products' | 'custom_html' | 'text';

export interface HomeSection {
  id: string;
  type: SectionType;
  order: number;
  props: Record<string, string | number>;
}

const SECTION_DEFAULTS: Record<SectionType, Record<string, string | number>> = {
  hero: { imageUrl: '', heading: 'Welcome', subheading: 'Discover our collection', ctaText: 'Shop Now', ctaLink: '' },
  featured_products: { title: 'Featured Products', limit: 8 },
  custom_html: { html: '<p>Your custom content here.</p>' },
  text: { heading: 'Section Title', body: 'Add your text content here.' },
};

const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero banner',
  featured_products: 'Featured products',
  custom_html: 'Custom HTML',
  text: 'Text block',
};

export default function HomeSectionsEditor({
  sections,
  onChange,
  onSave,
  saving,
}: {
  sections: HomeSection[];
  onChange: (s: HomeSection[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addType, setAddType] = useState<SectionType | null>(null);

  const move = (index: number, dir: 'up' | 'down') => {
    const next = [...sections];
    const j = dir === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    next.forEach((s, i) => (s.order = i));
    onChange(next);
  };

  const remove = (id: string) => {
    const next = sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    onChange(next);
    if (editingId === id) setEditingId(null);
  };

  const add = (type: SectionType) => {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newSection: HomeSection = {
      id,
      type,
      order: sections.length,
      props: { ...SECTION_DEFAULTS[type] },
    };
    onChange([...sections, newSection].map((s, i) => ({ ...s, order: i })));
    setEditingId(id);
    setAddType(null);
  };

  const updateProps = (id: string, props: Record<string, string | number>) => {
    onChange(
      sections.map((s) => (s.id === id ? { ...s, props } : s))
    );
  };

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Home page sections</h3>
        {addType === null ? (
          <div className="flex gap-2 flex-wrap">
            {(['hero', 'featured_products', 'text', 'custom_html'] as SectionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-sm"
              >
                {type === 'hero' && <Image className="h-4 w-4" />}
                {type === 'featured_products' && <LayoutGrid className="h-4 w-4" />}
                {type === 'text' && <Type className="h-4 w-4" />}
                {type === 'custom_html' && <Code className="h-4 w-4" />}
                {SECTION_LABELS[type]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ul className="space-y-2">
        {sorted.map((section, index) => (
          <li
            key={section.id}
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-[#0d0d1a]"
          >
            <div className="flex flex-col gap-0">
              <button type="button" onClick={() => move(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(index, 'down')} disabled={index === sorted.length - 1} className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <GripVertical className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-white flex-1">{SECTION_LABELS[section.type]}</span>
            <button type="button" onClick={() => setEditingId(editingId === section.id ? null : section.id)} className="text-sm text-purple-400 hover:text-purple-300">
              {editingId === section.id ? 'Done' : 'Edit'}
            </button>
            <button type="button" onClick={() => remove(section.id)} className="p-1.5 rounded text-red-400 hover:bg-red-500/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {editingId && (() => {
        const section = sections.find((s) => s.id === editingId);
        if (!section) return null;
        return (
          <div className="p-4 rounded-xl border border-gray-600 bg-[#1a1a2e] space-y-3">
            <h4 className="text-white font-medium">Edit: {SECTION_LABELS[section.type]}</h4>
            {section.type === 'hero' && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                  <input
                    value={section.props.imageUrl as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Heading</label>
                  <input
                    value={section.props.heading as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, heading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Subheading</label>
                  <input
                    value={section.props.subheading as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, subheading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Button text</label>
                    <input
                      value={section.props.ctaText as string || ''}
                      onChange={(e) => updateProps(section.id, { ...section.props, ctaText: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Button link</label>
                    <input
                      value={section.props.ctaLink as string || ''}
                      onChange={(e) => updateProps(section.id, { ...section.props, ctaLink: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                      placeholder="/storefront/your-slug"
                    />
                  </div>
                </div>
              </>
            )}
            {section.type === 'featured_products' && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Section title</label>
                  <input
                    value={section.props.title as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max products to show</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={section.props.limit as number ?? 8}
                    onChange={(e) => updateProps(section.id, { ...section.props, limit: parseInt(e.target.value, 10) || 8 })}
                    className="w-24 px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </>
            )}
            {section.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Heading</label>
                  <input
                    value={section.props.heading as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, heading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Body (HTML allowed)</label>
                  <textarea
                    value={section.props.body as string || ''}
                    onChange={(e) => updateProps(section.id, { ...section.props, body: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm min-h-[80px]"
                  />
                </div>
              </>
            )}
            {section.type === 'custom_html' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">HTML content</label>
                <textarea
                  value={section.props.html as string || ''}
                  onChange={(e) => updateProps(section.id, { ...section.props, html: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded text-white text-sm font-mono min-h-[120px]"
                />
              </div>
            )}
          </div>
        );
      })()}

      {sections.length > 0 && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save home layout'}
        </button>
      )}

      {sections.length === 0 && (
        <p className="text-sm text-gray-500">Add sections above to build your home page. Reorder with the arrows. If no sections are set, the default hero + product grid is shown.</p>
      )}
    </div>
  );
}
