'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import Button from './Button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    onComplete();
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Step {step} of {totalSteps}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round((step / totalSteps) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Step Content */}
                {step === 1 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                      Welcome! 👋
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-gray-600 mb-6">
                        Welcome to Auto Shopify Store Builder! Let's get you started by connecting
                        your first Shopify store.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Next:</strong> You'll learn how to create a Shopify custom app and
                          connect it to our platform.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                      How to Create a Shopify Custom App
                    </Dialog.Title>
                    <div className="mt-2">
                      <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-6">
                        <li>Go to your Shopify Admin Dashboard</li>
                        <li>Navigate to Settings → Apps and sales channels → Develop apps</li>
                        <li>Click "Create an app"</li>
                        <li>Name your app and click "Create app"</li>
                        <li>Go to "API credentials" tab</li>
                        <li>Click "Configure Admin API scopes"</li>
                        <li>Select scopes: <code className="bg-gray-100 px-1 rounded">write_products</code> and <code className="bg-gray-100 px-1 rounded">read_products</code></li>
                        <li>Click "Save" and then "Install app"</li>
                        <li>Copy the Admin API access token</li>
                        <li>Use this token when connecting your store on our platform</li>
                      </ol>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                      Start Adding Products! 🚀
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-gray-600 mb-6">
                        Once you've connected your store, you can start adding products and creating
                        your Shopify store directly from our platform.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          <strong>Ready to go!</strong> Click "Get Started" to connect your first
                          store.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-between">
                  <div>
                    {step > 1 && (
                      <Button variant="secondary" onClick={() => setStep(step - 1)}>
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose}>
                      Skip
                    </Button>
                    {step < totalSteps ? (
                      <Button onClick={handleNext}>Next</Button>
                    ) : (
                      <Link href="/dashboard/stores/connect">
                        <Button onClick={handleComplete}>Get Started</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

