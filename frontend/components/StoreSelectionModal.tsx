'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from './Button';
import { notify } from '@/lib/toast';

interface Store {
  _id: string;
  storeName: string;
  shopDomain: string;
  isDefault: boolean;
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
    stores.find((s) => s.isDefault)?._id || stores[0]?._id || ''
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
    router.push('/dashboard/stores/connect');
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md mx-4 transform overflow-hidden rounded-2xl bg-white p-4 md:p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Add Product to Store
                </Dialog.Title>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {stores.length === 0 ? (
                  <div className="mb-4">
                    <p className="text-gray-600 mb-4">
                      You don't have any stores connected yet. Connect a Shopify store to
                      add products.
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={handleConnectNewStore} className="flex-1">
                        Connect Store
                      </Button>
                      <Button variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Store
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stores.map((store) => (
                            <label
                            key={store._id}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedStoreId === store._id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            aria-label={`Select store ${store.storeName}`}
                          >
                            <input
                              type="radio"
                              name="store"
                              value={store._id}
                              checked={selectedStoreId === store._id}
                              onChange={(e) => setSelectedStoreId(e.target.value)}
                              className="mr-3 text-primary-600 focus:ring-primary-500"
                              aria-labelledby={`store-${store._id}-label`}
                            />
                            <div className="flex-1" id={`store-${store._id}-label`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {store.storeName}
                                </span>
                                {store.isDefault && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                                    Default
                                  </span>
                                )}
                                {store.status !== 'active' && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                    {store.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {store.shopDomain}
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
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
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

