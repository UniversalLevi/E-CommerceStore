'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import Button from './Button';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface Niche {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [nicheSearch, setNicheSearch] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<'dropship' | 'brand' | 'start_small' | ''>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch niches on mount
  useEffect(() => {
    if (isOpen && step === 2) {
      fetchNiches();
    }
  }, [isOpen, step]);

  const fetchNiches = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: Niche[] }>('/api/niches?active=true');
      setNiches(response.data);
    } catch (error) {
      console.error('Failed to fetch niches:', error);
      notify.error('Failed to load niches');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate step 2 (niche selection)
    if (step === 2 && !selectedNiche) {
      notify.error('Please select a niche');
      return;
    }

    // Validate step 3 (goal selection)
    if (step === 3 && !selectedGoal) {
      notify.error('Please select your goal');
      return;
    }

    // Save onboarding data after step 3
    if (step === 3 && selectedNiche && selectedGoal) {
      try {
        setSaving(true);
        await api.put('/api/auth/onboarding', {
          nicheId: selectedNiche,
          goal: selectedGoal,
        });
        notify.success('Preferences saved!');
      } catch (error: any) {
        console.error('Failed to save onboarding:', error);
        notify.error(error.response?.data?.error || 'Failed to save preferences');
        return;
      } finally {
        setSaving(false);
      }
    }

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

  // Filter niches based on search
  const filteredNiches = niches.filter((niche) =>
    niche.name.toLowerCase().includes(nicheSearch.toLowerCase()) ||
    niche.slug.toLowerCase().includes(nicheSearch.toLowerCase())
  );

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
          <div className="fixed inset-0 bg-black bg-opacity-75" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-surface-raised border-4 border-primary-500 p-10 text-left align-middle shadow-2xl transition-all ring-4 ring-primary-500/20">
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">
                      Step {step} of {totalSteps}
                    </span>
                    <span className="text-sm text-text-muted">
                      {Math.round((step / totalSteps) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-surface-hover rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Step Content */}
                {step === 1 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-text-primary mb-4">
                      Welcome!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-text-secondary mb-6">
                        Welcome to Auto Shopify Store Builder! Let's get you started by personalizing
                        your experience and connecting your first Shopify store.
                      </p>
                      <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                        <p className="text-sm text-text-secondary">
                          <strong>Next:</strong> We'll ask you a few quick questions to help us recommend
                          the best products for you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-text-primary mb-4">
                      Pick Your Niche
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-text-secondary mb-4">
                        Select the niche that best matches your store's focus. This helps us recommend
                        products tailored to your needs.
                      </p>
                      
                      {/* Search input */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search niches..."
                          value={nicheSearch}
                          onChange={(e) => setNicheSearch(e.target.value)}
                          className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      {/* Niches list */}
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                          <p className="mt-2 text-text-secondary">Loading niches...</p>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {filteredNiches.length === 0 ? (
                            <p className="text-text-secondary text-center py-4">No niches found</p>
                          ) : (
                            filteredNiches.map((niche) => (
                              <button
                                key={niche._id}
                                onClick={() => setSelectedNiche(niche._id)}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                                  selectedNiche === niche._id
                                    ? 'bg-primary-500 text-black border-primary-500'
                                    : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {niche.icon && <span className="text-2xl">{niche.icon}</span>}
                                  <span className="font-medium">{niche.name}</span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-text-primary mb-4">
                      What's Your Goal?
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-text-secondary mb-6">
                        Tell us what you want to achieve. This helps us personalize product recommendations
                        for you.
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => setSelectedGoal('dropship')}
                          className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-colors ${
                            selectedGoal === 'dropship'
                              ? 'bg-primary-500 text-black border-primary-500'
                              : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                          }`}
                        >
                          <div className="font-semibold text-lg mb-1">Dropship</div>
                          <div className="text-sm opacity-90">
                            Start selling products without holding inventory. Perfect for testing the market.
                          </div>
                        </button>

                        <button
                          onClick={() => setSelectedGoal('brand')}
                          className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-colors ${
                            selectedGoal === 'brand'
                              ? 'bg-primary-500 text-black border-primary-500'
                              : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                          }`}
                        >
                          <div className="font-semibold text-lg mb-1">Build a Brand</div>
                          <div className="text-sm opacity-90">
                            Create a long-term brand with curated products and consistent quality.
                          </div>
                        </button>

                        <button
                          onClick={() => setSelectedGoal('start_small')}
                          className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-colors ${
                            selectedGoal === 'start_small'
                              ? 'bg-primary-500 text-black border-primary-500'
                              : 'bg-surface-base border-border-default text-text-primary hover:border-primary-500'
                          }`}
                        >
                          <div className="font-semibold text-lg mb-1">Start Small</div>
                          <div className="text-sm opacity-90">
                            Begin with a few products to learn the ropes before scaling up.
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-text-primary mb-4">
                      How to Create a Shopify Custom App
                    </Dialog.Title>
                    <div className="mt-2">
                      <ol className="list-decimal list-inside space-y-3 text-text-secondary mb-6">
                        <li>Go to your Shopify Admin Dashboard</li>
                        <li>Navigate to Settings → Apps and sales channels → Develop apps</li>
                        <li>Click "Create an app"</li>
                        <li>Name your app and click "Create app"</li>
                        <li>Go to "API credentials" tab</li>
                        <li>Click "Configure Admin API scopes"</li>
                        <li>Select scopes: <code className="bg-surface-hover px-1 rounded">write_products</code> and <code className="bg-surface-hover px-1 rounded">read_products</code></li>
                        <li>Click "Save" and then "Install app"</li>
                        <li>Copy the Admin API access token</li>
                        <li>Use this token when connecting your store on our platform</li>
                      </ol>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-text-primary mb-4">
                      Start Adding Products!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-text-secondary mb-6">
                        Once you've connected your store, you can start adding products and creating
                        your Shopify store directly from our platform.
                      </p>
                      <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                        <p className="text-sm text-text-secondary">
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
                    {step < 4 && (
                      <Button variant="ghost" onClick={onClose}>
                        Skip
                      </Button>
                    )}
                    {step < totalSteps ? (
                      <Button onClick={handleNext} loading={saving} disabled={saving}>
                        {step === 3 ? 'Save & Continue' : 'Next'}
                      </Button>
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

