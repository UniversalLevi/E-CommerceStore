'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Niche } from '@/types';
import { notify } from '@/lib/toast';
import AdminLayout from '@/components/AdminLayout';
import ConfirmModal from '@/components/ConfirmModal';
import Button from '@/components/Button';

export default function AdminNichesPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [formData, setFormData] = useState<Partial<Niche>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchNiches = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await api.get<{ success: boolean; data: Niche[] }>(
        `/api/admin/niches?${params.toString()}`
      );
      setNiches(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load niches');
      notify.error('Failed to load niches');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, search]);

  useEffect(() => {
    fetchNiches();
  }, [fetchNiches]);

  const handleCreate = async () => {
    try {
      await api.post('/api/admin/niches', formData);
      notify.success('Niche created successfully');
      setShowCreateModal(false);
      setFormData({});
      fetchNiches();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to create niche');
    }
  };

  const handleUpdate = async () => {
    if (!selectedNiche) return;

    try {
      await api.put(`/api/admin/niches/${selectedNiche._id}`, formData);
      notify.success('Niche updated successfully');
      setShowEditModal(false);
      setSelectedNiche(null);
      setFormData({});
      fetchNiches();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update niche');
    }
  };

  const handleDelete = async () => {
    if (!selectedNiche) return;

    try {
      await api.delete(`/api/admin/niches/${selectedNiche._id}`, {
        data: { reason: formData.deletedReason || 'Admin deletion' },
      });
      notify.success('Niche deleted successfully');
      setShowDeleteModal(false);
      setSelectedNiche(null);
      setFormData({});
      fetchNiches();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete niche');
    }
  };

  const handleRestore = async (nicheId: string) => {
    try {
      await api.post(`/api/admin/niches/${nicheId}/restore`);
      notify.success('Niche restored successfully');
      fetchNiches();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to restore niche');
    }
  };

  const openEditModal = (niche: Niche) => {
    setSelectedNiche(niche);
    setFormData({
      name: niche.name,
      slug: niche.slug,
      description: niche.description,
      richDescription: niche.richDescription,
      image: niche.image,
      icon: niche.icon,
      order: niche.order,
      priority: niche.priority,
      featured: niche.featured,
      showOnHomePage: niche.showOnHomePage,
      active: niche.active,
      synonyms: niche.synonyms,
      metaTitle: niche.metaTitle,
      metaDescription: niche.metaDescription,
      themeColor: niche.themeColor,
      textColor: niche.textColor,
      defaultSortMode: niche.defaultSortMode,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (niche: Niche) => {
    setSelectedNiche(niche);
    setFormData({ deletedReason: '' });
    setShowDeleteModal(true);
  };

  // Filter niches client-side (backend also supports search)
  const filteredNiches = niches.filter((niche) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      niche.name.toLowerCase().includes(searchLower) ||
      niche.slug.toLowerCase().includes(searchLower) ||
      niche.synonyms.some((syn) => syn.toLowerCase().includes(searchLower))
    );
  });

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Niche Management</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create New Niche
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search niches by name, slug, or synonyms..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Niches Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Homepage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNiches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {search ? 'No niches found matching your search' : 'No niches yet'}
                    </td>
                  </tr>
                ) : (
                  filteredNiches.map((niche) => (
                    <tr key={niche._id} className={niche.deleted ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {niche.icon && <span className="text-2xl">{niche.icon}</span>}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {niche.name}
                            </div>
                            {niche.isDefault && (
                              <span className="text-xs text-gray-500">(Default)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-600">{niche.slug}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {niche.featured ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {niche.showOnHomePage ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {niche.active ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {niche.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {niche.totalProductCount || niche.activeProductCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {niche.deleted ? (
                            <button
                              onClick={() => handleRestore(niche._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(niche)}
                                className="text-primary-600 hover:text-primary-900"
                                disabled={niche.isDefault}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(niche)}
                                className="text-red-600 hover:text-red-900"
                                disabled={niche.isDefault}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <NicheModal
            title="Create Niche"
            formData={formData}
            setFormData={setFormData}
            onSave={handleCreate}
            onClose={() => {
              setShowCreateModal(false);
              setFormData({});
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedNiche && (
          <NicheModal
            title="Edit Niche"
            formData={formData}
            setFormData={setFormData}
            onSave={handleUpdate}
            onClose={() => {
              setShowEditModal(false);
              setSelectedNiche(null);
              setFormData({});
            }}
            isDefault={selectedNiche.isDefault}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedNiche && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedNiche(null);
              setFormData({});
            }}
            onConfirm={handleDelete}
            title={`Delete Niche: ${selectedNiche.name}`}
            message={
              selectedNiche.totalProductCount && selectedNiche.totalProductCount > 0
                ? `This niche has ${selectedNiche.totalProductCount} products. You must move them to another niche first.`
                : 'Are you sure you want to delete this niche? This action cannot be undone.'
            }
            confirmText="Delete"
            confirmVariant="danger"
            disabled={selectedNiche.totalProductCount && selectedNiche.totalProductCount > 0}
          >
            {selectedNiche.totalProductCount === 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={formData.deletedReason || ''}
                  onChange={(e) => setFormData({ ...formData, deletedReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Why are you deleting this niche?"
                />
              </div>
            )}
          </ConfirmModal>
        )}
      </div>
    </AdminLayout>
  );
}

// Niche Form Modal Component
function NicheModal({
  title,
  formData,
  setFormData,
  onSave,
  onClose,
  isDefault = false,
}: {
  title: string;
  formData: Partial<Niche>;
  setFormData: (data: Partial<Niche>) => void;
  onSave: () => void;
  onClose: () => void;
  isDefault?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isDefault}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (auto-generated if empty)
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              disabled={isDefault}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
              placeholder="fitness-health"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="💪"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority || 0}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Color
              </label>
              <input
                type="color"
                value={formData.themeColor || '#6366f1'}
                onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={formData.textColor || '#ffffff'}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Synonyms (comma-separated)
            </label>
            <input
              type="text"
              value={formData.synonyms?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  synonyms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="fitness gear, gym, wellness"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured || false}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.showOnHomePage || false}
                onChange={(e) => setFormData({ ...formData, showOnHomePage: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show on Homepage</span>
            </label>

            {title === 'Edit Niche' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  disabled={isDefault}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}




