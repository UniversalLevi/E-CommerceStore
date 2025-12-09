'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import {
  Palette,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  Layers,
  CheckCircle,
  XCircle,
  Archive,
} from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'custom';
  isActive: boolean;
  isDeleted: boolean;
  appliedCount: number;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  minimal: 'bg-slate-600',
  modern: 'bg-blue-600',
  luxury: 'bg-amber-600',
  bold: 'bg-rose-600',
  custom: 'bg-purple-600',
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    template: Template | null;
    permanent: boolean;
  }>({
    isOpen: false,
    template: null,
    permanent: false,
  });
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    template: Template | null;
    newSlug: string;
    newName: string;
  }>({
    isOpen: false,
    template: null,
    newSlug: '',
    newName: '',
  });
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showDeleted) params.append('includeDeleted', 'true');
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await api.get<{ success: boolean; data: Template[] }>(
        `/api/admin/templates?${params.toString()}`
      );
      setTemplates(response.data);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [showDeleted, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside all menu containers
      const isOutside = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(target)
      );
      if (isOutside) {
        setActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleActive = async (template: Template) => {
    try {
      await api.put(`/api/admin/templates/${template._id}`, {
        isActive: !template.isActive,
      });
      notify.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`);
      fetchTemplates();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to update template');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.template) return;
    
    try {
      const params = deleteModal.permanent ? '?permanent=true' : '';
      await api.delete(`/api/admin/templates/${deleteModal.template._id}${params}`);
      notify.success(
        deleteModal.permanent
          ? 'Template permanently deleted'
          : 'Template moved to trash'
      );
      setDeleteModal({ isOpen: false, template: null, permanent: false });
      fetchTemplates();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateModal.template) return;
    
    try {
      await api.post(`/api/admin/templates/${duplicateModal.template._id}/duplicate`, {
        newSlug: duplicateModal.newSlug,
        newName: duplicateModal.newName,
      });
      notify.success('Template duplicated successfully');
      setDuplicateModal({ isOpen: false, template: null, newSlug: '', newName: '' });
      fetchTemplates();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to duplicate template');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.slug.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Palette className="h-7 w-7 text-purple-500" />
            Template Manager
          </h1>
          <p className="text-text-secondary mt-1">
            Create and manage Shopify store templates
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-secondary" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-base border border-border-default rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              <option value="minimal">Minimal</option>
              <option value="modern">Modern</option>
              <option value="luxury">Luxury</option>
              <option value="bold">Bold</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Show Deleted Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 rounded border-border-default text-purple-600 focus:ring-purple-500"
            />
            <span className="text-text-secondary text-sm">Show deleted</span>
          </label>

          {/* Refresh */}
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2.5 bg-surface-base border border-border-default rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center">
          <Layers className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No templates found
          </h3>
          <p className="text-text-secondary mb-4">
            {searchQuery || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create your first template to get started'}
          </p>
          {!searchQuery && !categoryFilter && (
            <Link
              href="/admin/templates/new"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template._id}
              className={`bg-surface-raised border rounded-xl overflow-hidden transition-all hover:shadow-lg group ${
                template.isDeleted
                  ? 'border-red-500/50 opacity-60'
                  : 'border-border-default'
              }`}
            >
              {/* Preview Image */}
              <div className="relative aspect-video bg-surface-base">
                {template.previewImage ? (
                  <Image
                    src={template.previewImage}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Palette className="h-16 w-16 text-text-secondary/30" />
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                      categoryColors[template.category]
                    }`}
                  >
                    {template.category.charAt(0).toUpperCase() +
                      template.category.slice(1)}
                  </span>
                  {template.isDeleted ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white flex items-center gap-1">
                      <Archive className="h-3 w-3" />
                      Deleted
                    </span>
                  ) : template.isActive ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-600 text-white flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-600 text-white flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Action Menu */}
                <div className="absolute top-3 right-3">
                  <div
                    className="relative"
                    ref={(el) => {
                      menuRefs.current[template._id] = el;
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActionMenu(
                          actionMenu === template._id ? null : template._id
                        );
                      }}
                      className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {actionMenu === template._id && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-surface-raised border border-border-default rounded-lg shadow-lg py-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/admin/templates/${template._id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Template
                        </Link>
                        <button
                          onClick={() => handleToggleActive(template)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                          {template.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setDuplicateModal({
                              isOpen: true,
                              template,
                              newSlug: `${template.slug}-copy`,
                              newName: `${template.name} (Copy)`,
                            })
                          }
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </button>
                        <hr className="my-1 border-border-default" />
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              template,
                              permanent: template.isDeleted,
                            })
                          }
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-surface-hover"
                        >
                          <Trash2 className="h-4 w-4" />
                          {template.isDeleted ? 'Delete Permanently' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Slug: {template.slug}</span>
                  <span>{template.appliedCount} applied</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-surface-base border-t border-border-default flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {new Date(template.updatedAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/templates/${template._id}/edit`}
                  className="text-sm text-purple-500 hover:text-purple-400 font-medium"
                >
                  Edit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={
          deleteModal.permanent ? 'Permanently Delete Template' : 'Delete Template'
        }
        message={
          deleteModal.permanent
            ? `Are you sure you want to permanently delete "${deleteModal.template?.name}"? This action cannot be undone and will remove all template files.`
            : `Are you sure you want to delete "${deleteModal.template?.name}"? The template will be moved to trash.`
        }
        confirmText={deleteModal.permanent ? 'Delete Permanently' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, template: null, permanent: false })
        }
      />

      {/* Duplicate Modal */}
      {duplicateModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Duplicate Template
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    New Name
                  </label>
                  <input
                    type="text"
                    value={duplicateModal.newName}
                    onChange={(e) =>
                      setDuplicateModal({ ...duplicateModal, newName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    New Slug
                  </label>
                  <input
                    type="text"
                    value={duplicateModal.newSlug}
                    onChange={(e) =>
                      setDuplicateModal({
                        ...duplicateModal,
                        newSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() =>
                  setDuplicateModal({
                    isOpen: false,
                    template: null,
                    newSlug: '',
                    newName: '',
                  })
                }
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!duplicateModal.newSlug || !duplicateModal.newName}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

