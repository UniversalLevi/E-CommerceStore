'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  /** Visual style for the confirm button (backwards-compatible) */
  variant?: 'danger' | 'warning' | 'info';
  /** Alias for `variant` used in some callers */
  confirmVariant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  /** Preferred close handler; falls back to `onCancel` for older callers */
  onClose?: () => void;
  /** Backwards-compatible cancel handler */
  onCancel?: () => void;
  loading?: boolean;
  /** When true, disables the confirm button (used by some admin flows) */
  disabled?: boolean;
  /** Optional extra content (e.g. reason textarea) */
  children?: ReactNode;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'info',
  confirmVariant,
  onConfirm,
  onClose,
  onCancel,
  loading = false,
  disabled = false,
  children,
}: ConfirmModalProps) {
  const effectiveVariant = confirmVariant || variant || 'info';
  const handleClose = onClose || onCancel || (() => {});

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'text-red-600',
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      icon: 'text-yellow-600',
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: 'text-blue-600',
    },
  };

  const styles = variantStyles[effectiveVariant];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">
                  {title}
                </Dialog.Title>
                {message && (
                  <div className="mt-2">
                    <p className="text-sm text-text-secondary">{message}</p>
                  </div>
                )}

                {children && <div className="mt-4">{children}</div>}

                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black min-h-[44px] transition-colors"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black min-h-[44px] transition-all ${styles.button}`}
                    onClick={onConfirm}
                    disabled={loading || disabled}
                  >
                    {loading ? 'Processing...' : confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

