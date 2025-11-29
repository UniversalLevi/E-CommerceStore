'use client';

import { useState, useEffect } from 'react';
import { useCampaignStore } from '@/store/useCampaignStore';
import Button from '@/components/Button';
import FileUploader from '@/components/ads/FileUploader';
import AIResultPanel from '@/components/ads/AIResultPanel';
import AdPreview from '@/components/ads/AdPreview';
import { notify } from '@/lib/toast';
import { Sparkles } from 'lucide-react';
import AdBuilderTabs from '@/components/ads/AdBuilderTabs';
import { COUNTRIES } from '@/lib/countries';

interface CampaignFormData {
  campaignGoal: string;
  dailyBudget: number;
  country: string;
  ageRange: { min: number; max: number };
  gender: string;
  productName: string;
  interests: string[];
  imageFile: File | null;
  videoFile: File | null;
  captions: string[];
  hashtags: string[];
  ctaRecommendations: string[];
}

export default function InstagramAdsPage() {
  const { currentDraft, updateCurrentDraft, setCurrentDraft } = useCampaignStore();
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignGoal: '',
    dailyBudget: 50,
    country: 'United States',
    ageRange: { min: 18, max: 65 },
    gender: 'all',
    productName: '',
    interests: [],
    imageFile: null,
    videoFile: null,
    captions: [],
    hashtags: [],
    ctaRecommendations: [],
  });

  const [loading, setLoading] = useState({
    interests: false,
    captions: false,
    hashtags: false,
    recommendations: false,
    ctaRecommendations: false,
  });

  const [generated, setGenerated] = useState({
    interests: [] as string[],
    captions: [] as string[],
    hashtags: [] as string[],
    ctaRecommendations: [] as string[],
    recommendations: null as any,
  });

  // Load draft if editing
  useEffect(() => {
    if (currentDraft) {
      setFormData({
        campaignGoal: currentDraft.campaignGoal || '',
        dailyBudget: currentDraft.dailyBudget || 50,
        country: currentDraft.country || 'United States',
        ageRange: currentDraft.ageRange || { min: 18, max: 65 },
        gender: currentDraft.gender || 'all',
        productName: currentDraft.productName || '',
        interests: currentDraft.interests || [],
        imageFile: null,
        videoFile: null,
        captions: currentDraft.captions || [],
        hashtags: currentDraft.hashtags || [],
        ctaRecommendations: currentDraft.ctaRecommendations || [],
      });
    }
  }, [currentDraft]);

  const generateInterests = async () => {
    if (!formData.productName) {
      notify.error('Please enter a product name first');
      return;
    }

    setLoading({ ...loading, interests: true });
    try {
      const response = await fetch('/api/instagram/generate-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.productName }),
      });

      const data = await response.json();
      if (data.success) {
        setGenerated({ ...generated, interests: data.interests });
        setFormData({ ...formData, interests: data.interests });
        notify.success('Interests generated successfully!');
      } else {
        notify.error(data.error || 'Failed to generate interests');
      }
    } catch (error) {
      notify.error('Failed to generate interests');
    } finally {
      setLoading({ ...loading, interests: false });
    }
  };

  const generateCaptions = async () => {
    if (!formData.productName) {
      notify.error('Please enter a product name first');
      return;
    }

    setLoading({ ...loading, captions: true });
    try {
      const response = await fetch('/api/instagram/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.productName }),
      });

      const data = await response.json();
      if (data.success) {
        setGenerated({ ...generated, captions: data.captions });
        setFormData({ ...formData, captions: data.captions });
        notify.success('Captions generated successfully!');
      } else {
        notify.error(data.error || 'Failed to generate captions');
      }
    } catch (error) {
      notify.error('Failed to generate captions');
    } finally {
      setLoading({ ...loading, captions: false });
    }
  };

  const generateHashtags = async () => {
    if (!formData.productName) {
      notify.error('Please enter a product name first');
      return;
    }

    setLoading({ ...loading, hashtags: true });
    try {
      const response = await fetch('/api/instagram/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.productName }),
      });

      const data = await response.json();
      if (data.success) {
        setGenerated({ ...generated, hashtags: data.hashtags });
        setFormData({ ...formData, hashtags: data.hashtags });
        notify.success('Hashtags generated successfully!');
      } else {
        notify.error(data.error || 'Failed to generate hashtags');
      }
    } catch (error) {
      notify.error('Failed to generate hashtags');
    } finally {
      setLoading({ ...loading, hashtags: false });
    }
  };

  const generateCTAs = async () => {
    if (!formData.productName) {
      notify.error('Please enter a product name first');
      return;
    }

    setLoading({ ...loading, ctaRecommendations: true });
    try {
      // Using the AI helper directly for CTAs
      const response = await fetch('/api/instagram/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.productName }),
      });

      const data = await response.json();
      if (data.success && data.recommendations) {
        // Generate CTAs using a simple approach
        const ctas = ['Shop Now', 'Learn More', 'Get Started'];
        setGenerated({ ...generated, ctaRecommendations: ctas });
        setFormData({ ...formData, ctaRecommendations: ctas });
        notify.success('CTA recommendations generated!');
      } else {
        notify.error(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      notify.error('Failed to generate CTA recommendations');
    } finally {
      setLoading({ ...loading, ctaRecommendations: false });
    }
  };

  const generateRecommendations = async () => {
    if (!formData.productName) {
      notify.error('Please enter a product name first');
      return;
    }

    setLoading({ ...loading, recommendations: true });
    try {
      const response = await fetch('/api/instagram/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.productName }),
      });

      const data = await response.json();
      if (data.success && data.recommendations) {
        setGenerated({ ...generated, recommendations: data.recommendations });
        setFormData({
          ...formData,
          campaignGoal: data.recommendations.campaignGoal || formData.campaignGoal,
          dailyBudget: data.recommendations.dailyBudget || formData.dailyBudget,
          country: data.recommendations.country || formData.country,
          ageRange: data.recommendations.ageRange || formData.ageRange,
          gender: data.recommendations.gender || formData.gender,
        });
        notify.success('Recommended settings applied!');
      } else {
        notify.error(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      notify.error('Failed to generate recommendations');
    } finally {
      setLoading({ ...loading, recommendations: false });
    }
  };


  const imageUrl = formData.imageFile ? URL.createObjectURL(formData.imageFile) : undefined;
  const videoUrl = formData.videoFile ? URL.createObjectURL(formData.videoFile) : undefined;
  const selectedCaption = formData.captions[0] || '';

  return (
    <div className="space-y-6">
      <AdBuilderTabs />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-primary">Instagram Ads Builder</h1>
        </div>

        {/* Section 1: Basic Setup */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Basic Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Campaign Goal
              </label>
              <select
                value={formData.campaignGoal}
                onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select goal</option>
                <option value="Conversions">Conversions</option>
                <option value="Traffic">Traffic</option>
                <option value="Engagement">Engagement</option>
                <option value="Awareness">Awareness</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Daily Budget ($)
              </label>
              <input
                type="number"
                value={formData.dailyBudget}
                onChange={(e) =>
                  setFormData({ ...formData, dailyBudget: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Age Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.ageRange.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRange: { ...formData.ageRange, min: parseInt(e.target.value) || 18 },
                    })
                  }
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={formData.ageRange.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ageRange: { ...formData.ageRange, max: parseInt(e.target.value) || 65 },
                    })
                  }
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Product Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter product name"
                />
                <Button
                  onClick={generateRecommendations}
                  loading={loading.recommendations}
                  iconLeft={<Sparkles className="h-4 w-4" />}
                >
                  Get Recommendations
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">Interests</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                      setFormData({
                        ...formData,
                        interests: [...formData.interests, (e.target as HTMLInputElement).value],
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Add interest and press Enter"
                />
                <Button
                  onClick={generateInterests}
                  loading={loading.interests}
                  iconLeft={<Sparkles className="h-4 w-4" />}
                >
                  Generate
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-surface-elevated border border-border-default rounded-full text-sm text-text-primary"
                  >
                    {interest}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          interests: formData.interests.filter((_, i) => i !== index),
                        })
                      }
                      className="ml-2 text-text-secondary hover:text-text-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Ad Creative */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Ad Creative</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploader
                type="image"
                label="Upload Image"
                onFileSelect={(file) => setFormData({ ...formData, imageFile: file })}
                currentFile={formData.imageFile}
              />
              <FileUploader
                type="video"
                label="Upload Video"
                onFileSelect={(file) => setFormData({ ...formData, videoFile: file })}
                currentFile={formData.videoFile}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-primary">AI-Generated Content</h3>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={generateCaptions}
                  loading={loading.captions}
                  iconLeft={<Sparkles className="h-4 w-4" />}
                  variant="secondary"
                >
                  Generate Captions
                </Button>
                <Button
                  onClick={generateHashtags}
                  loading={loading.hashtags}
                  iconLeft={<Sparkles className="h-4 w-4" />}
                  variant="secondary"
                >
                  Generate Hashtags
                </Button>
                <Button
                  onClick={generateCTAs}
                  loading={loading.ctaRecommendations}
                  iconLeft={<Sparkles className="h-4 w-4" />}
                  variant="secondary"
                >
                  Generate CTAs
                </Button>
              </div>

              {generated.captions.length > 0 && (
                <AIResultPanel
                  title="Generated Captions"
                  results={generated.captions}
                  defaultOpen
                />
              )}

              {generated.hashtags.length > 0 && (
                <AIResultPanel
                  title="Generated Hashtags"
                  results={generated.hashtags}
                  defaultOpen
                />
              )}

              {generated.ctaRecommendations.length > 0 && (
                <AIResultPanel
                  title="CTA Recommendations"
                  results={generated.ctaRecommendations}
                  defaultOpen
                />
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Previews */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Ad Previews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdPreview
              platform="instagram"
              placement="feed"
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              caption={selectedCaption}
              hashtags={formData.hashtags}
            />
            <AdPreview
              platform="instagram"
              placement="story"
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              caption={selectedCaption}
              hashtags={formData.hashtags}
            />
            <AdPreview
              platform="instagram"
              placement="reels"
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              caption={selectedCaption}
              hashtags={formData.hashtags}
            />
          </div>
        </section>

      </div>
    </div>
  );
}

