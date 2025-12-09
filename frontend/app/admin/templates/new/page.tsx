'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Palette, Loader2 } from 'lucide-react';

const categories = [
  { value: 'minimal', label: 'Minimal', description: 'Clean, simple designs' },
  { value: 'modern', label: 'Modern', description: 'Contemporary and sleek' },
  { value: 'luxury', label: 'Luxury', description: 'Premium and elegant' },
  { value: 'bold', label: 'Bold', description: 'Eye-catching and vibrant' },
  { value: 'custom', label: 'Custom', description: 'Unique and custom designs' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'custom',
    previewImage: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{ success: boolean; data: { _id: string } }>(
        '/api/admin/templates',
        formData
      );
      notify.success('Template created successfully');
      router.push(`/admin/templates/${response.data._id}/edit`);
    } catch (error: any) {
      if (error.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        error.response.data.details.forEach((msg: string) => {
          if (msg.toLowerCase().includes('name')) apiErrors.name = msg;
          else if (msg.toLowerCase().includes('slug')) apiErrors.slug = msg;
          else if (msg.toLowerCase().includes('description')) apiErrors.description = msg;
          else apiErrors.general = msg;
        });
        setErrors(apiErrors);
      } else {
        notify.error(error.response?.data?.error || 'Failed to create template');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/templates"
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Palette className="h-7 w-7 text-purple-500" />
            Create New Template
          </h1>
          <p className="text-text-secondary mt-1">
            Set up a new template for your Shopify stores
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g., Modern Dark Theme"
              className={`w-full px-4 py-3 bg-surface-base border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-border-default'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                })
              }
              placeholder="modern-dark-theme"
              className={`w-full px-4 py-3 bg-surface-base border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.slug ? 'border-red-500' : 'border-border-default'
              }`}
            />
            <p className="mt-1 text-xs text-text-secondary">
              Used as the folder name. Only lowercase letters, numbers, and hyphens.
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="A modern dark theme with clean layouts and stunning animations..."
              rows={3}
              className={`w-full px-4 py-3 bg-surface-base border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-border-default'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: cat.value })
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.category === cat.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border-default hover:border-purple-500/50'
                  }`}
                >
                  <p className="font-medium text-text-primary">{cat.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {cat.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Image URL */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Preview Image URL (optional)
            </label>
            <input
              type="text"
              value={formData.previewImage}
              onChange={(e) =>
                setFormData({ ...formData, previewImage: e.target.value })
              }
              placeholder="https://example.com/preview.png"
              className="w-full px-4 py-3 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-text-secondary">
              You can add this later in the template editor
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/templates"
            className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Template
          </button>
        </div>

        {errors.general && (
          <p className="text-center text-sm text-red-500">{errors.general}</p>
        )}
      </form>
    </div>
  );
}

