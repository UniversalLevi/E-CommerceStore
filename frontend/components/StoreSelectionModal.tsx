'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from './Button';
import { notify } from '@/lib/toast';

interface Store {
  _id: string;
  name: string;
  slug: string;
  status: string;
}

interface StoreSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  productId: string;
  onSuccess?: (data: any) => void;
}

export default function StoreSelectionModal({
  isOpen,
  onClose,
  stores,
  productId,
  onSuccess,
}: StoreSelectionModalProps) {
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    stores[0]?._id || ''
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleAddToStore = async () => {
    if (!selectedStoreId) {
      setError('Please select a store');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { api } = await import('@/lib/api');
      const response = await api.post<{
        success: boolean;
        message: string;
        data: any;
      }>('/api/stores/create', {
        productId,
        storeId: selectedStoreId,
      });

      notify.success('Product added to store successfully!');
      onSuccess?.(response.data);
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to add product to store. Please try again.';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleConnectNewStore = () => {
    onClose();
    router.push('/dashboard/store/create');
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
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md mx-4 transform overflow-hidden rounded-2xl glass-card border border-white/10 p-4 md:p-6 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-text-primary mb-4"
                >
                  Add Product to Store
                </Dialog.Title>

                {error && (
                  <div className="mb-4 bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {stores.length === 0 ? (
                  <div className="mb-4">
                    <p className="text-text-secondary mb-4">
                      You don't have a store yet. Create a store to add products.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={handleConnectNewStore} className="flex-1">
                        Create Store
                      </Button>
                      <Button variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Select Store
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stores.map((store) => (
                            <label
                            key={store._id}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedStoreId === store._id
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/10 hover:border-white/20 bg-white/5'
                            }`}
                            aria-label={`Select store ${store.name}`}
                          >
                            <input
                              type="radio"
                              name="store"
                              value={store._id}
                              checked={selectedStoreId === store._id}
                              onChange={(e) => setSelectedStoreId(e.target.value)}
                              className="mr-3 text-purple-500 focus:ring-purple-500"
                              aria-labelledby={`store-${store._id}-label`}
                            />
                            <div className="flex-1" id={`store-${store._id}-label`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary">
                                  {store.name}
                                </span>
                                {store.status !== 'active' && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/30 text-yellow-300">
                                    {store.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-text-secondary mt-1">
                                {store.slug}.eazydropshipping.com
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleAddToStore}
                        disabled={creating || !selectedStoreId}
                        className="flex-1"
                        loading={creating}
                      >
                        {creating ? 'Adding...' : 'Add to Store'}
                      </Button>
                      <Button variant="secondary" onClick={onClose} disabled={creating}>
                        Cancel
                      </Button>
                    </div>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleConnectNewStore}
                        className="text-sm text-purple-400 hover:text-purple-300 font-medium"
                      >
                        + Connect New Store
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

