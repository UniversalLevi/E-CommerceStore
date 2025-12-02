'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContentStore } from '@/store/useContentStore';
import Button from '@/components/Button';
import SubscriptionLock from '@/components/SubscriptionLock';
import { useSubscription } from '@/hooks/useSubscription';
import { notify } from '@/lib/toast';
import { Sparkles, Save, RefreshCw, Trash2 } from 'lucide-react';
import AIResultPanel from '@/components/ads/AIResultPanel';
import AdBuilderTabs from '@/components/ads/AdBuilderTabs';

export default function ContentFinderPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const { library, dailyIdeas, setLibrary, addToLibrary, removeFromLibrary, setDailyIdeas } =
    useContentStore();

  // Check subscription before rendering
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Content Finder" />;
  }

  const [niche, setNiche] = useState('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState({
    trending: false,
    daily: false,
    creative: false,
  });

  const [trendingContent, setTrendingContent] = useState<any>(null);
  const [creativeIdeas, setCreativeIdeas] = useState<any>(null);

  // Load daily ideas on mount
  useEffect(() => {
    loadDailyIdeas();
    loadLibrary();
  }, []);

  const loadDailyIdeas = async () => {
    try {
      const response = await fetch('/api/content/daily', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setDailyIdeas(data.ideas);
      }
    } catch (error) {
      console.error('Error loading daily ideas:', error);
    }
  };

  const loadLibrary = async () => {
    try {
      const response = await fetch('/api/content/library', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setLibrary(data.library);
      }
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const generateTrending = async () => {
    if (!niche) {
      notify.error('Please enter a niche');
      return;
    }

    setLoading({ ...loading, trending: true });
    try {
      const response = await fetch('/api/content/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ niche }),
      });

      const data = await response.json();
      if (data.success) {
        setTrendingContent(data.content);
        notify.success('Trending content generated!');
      } else {
        notify.error(data.error || 'Failed to generate trending content');
      }
    } catch (error) {
      notify.error('Failed to generate trending content');
    } finally {
      setLoading({ ...loading, trending: false });
    }
  };

  const generateDaily = async () => {
    setLoading({ ...loading, daily: true });
    try {
      const response = await fetch('/api/content/daily', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setDailyIdeas(data.ideas);
        notify.success(data.cached ? 'Loaded cached ideas' : 'New daily ideas generated!');
      } else {
        notify.error(data.error || 'Failed to generate daily ideas');
      }
    } catch (error) {
      notify.error('Failed to generate daily ideas');
    } finally {
      setLoading({ ...loading, daily: false });
    }
  };

  const generateCreative = async () => {
    if (!productName) {
      notify.error('Please enter a product name');
      return;
    }

    setLoading({ ...loading, creative: true });
    try {
      const response = await fetch('/api/content/generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'creative_idea', productName }),
      });

      const data = await response.json();
      if (data.success) {
        setCreativeIdeas(data.ideas);
        notify.success('Creative ideas generated!');
      } else {
        notify.error(data.error || 'Failed to generate creative ideas');
      }
    } catch (error) {
      notify.error('Failed to generate creative ideas');
    } finally {
      setLoading({ ...loading, creative: false });
    }
  };

  const saveToLibrary = async (content: string, type: string, title?: string) => {
    try {
      const response = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          content,
          title,
          source: 'ai_generated',
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToLibrary(data.content);
        notify.success('Saved to library!');
      } else {
        notify.error(data.error || 'Failed to save');
      }
    } catch (error) {
      notify.error('Failed to save to library');
    }
  };

  const deleteFromLibrary = async (id: string) => {
    try {
      const response = await fetch(`/api/content/library/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        removeFromLibrary(id);
        notify.success('Deleted from library');
      } else {
        notify.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      notify.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <AdBuilderTabs />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-text-primary">Content Finder & AI Tools</h1>

        {/* Section 1: Trending Ads */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Trending Ads</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Enter niche (e.g., fitness, beauty, tech)"
                className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <Button
                onClick={generateTrending}
                loading={loading.trending}
                iconLeft={<Sparkles className="h-4 w-4" />}
              >
                Generate Trending Content
              </Button>
            </div>

            {trendingContent && (
              <div className="space-y-4">
                {trendingContent.adConcepts && trendingContent.adConcepts.length > 0 && (
                  <div>
                    <h3 className="font-medium text-text-primary mb-2">Ad Concepts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trendingContent.adConcepts.map((concept: string, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-surface-elevated rounded-lg flex items-center justify-between"
                        >
                          <p className="text-text-primary flex-1">{concept}</p>
                          <Button
                            onClick={() => saveToLibrary(concept, 'creative_idea', `Ad Concept ${index + 1}`)}
                            variant="ghost"
                            iconLeft={<Save className="h-3 w-3" />}
                          >
                            Save
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trendingContent.hookIdeas && trendingContent.hookIdeas.length > 0 && (
                  <AIResultPanel
                    title="Hook Ideas"
                    results={trendingContent.hookIdeas}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'hook')}
                  />
                )}

                {trendingContent.captionTemplates && trendingContent.captionTemplates.length > 0 && (
                  <AIResultPanel
                    title="Caption Templates"
                    results={trendingContent.captionTemplates}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'caption')}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Daily Content Ideas */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Daily Content Ideas</h2>
            <Button
              onClick={generateDaily}
              loading={loading.daily}
              variant="secondary"
              iconLeft={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </div>

          {dailyIdeas && (
            <div className="space-y-6">
              {dailyIdeas.cachedAt && (
                <p className="text-sm text-text-secondary">
                  Cached from {new Date(dailyIdeas.cachedAt).toLocaleDateString()}
                </p>
              )}

              {dailyIdeas.reelIdeas && dailyIdeas.reelIdeas.length > 0 && (
                <AIResultPanel
                  title="Reel Ideas (10)"
                  results={dailyIdeas.reelIdeas}
                  defaultOpen
                  onCopy={(text) => saveToLibrary(text, 'hook', 'Reel Idea')}
                />
              )}

              {dailyIdeas.photoIdeas && dailyIdeas.photoIdeas.length > 0 && (
                <AIResultPanel
                  title="Photo Ideas (10)"
                  results={dailyIdeas.photoIdeas}
                  defaultOpen
                  onCopy={(text) => saveToLibrary(text, 'creative_idea', 'Photo Idea')}
                />
              )}

              {dailyIdeas.hooks && dailyIdeas.hooks.length > 0 && (
                <AIResultPanel
                  title="Hooks (10)"
                  results={dailyIdeas.hooks}
                  defaultOpen
                  onCopy={(text) => saveToLibrary(text, 'hook')}
                />
              )}

              {dailyIdeas.captions && dailyIdeas.captions.length > 0 && (
                <AIResultPanel
                  title="Captions (10)"
                  results={dailyIdeas.captions}
                  defaultOpen
                  onCopy={(text) => saveToLibrary(text, 'caption')}
                />
              )}

              {dailyIdeas.trendingAudios && dailyIdeas.trendingAudios.length > 0 && (
                <AIResultPanel
                  title="Trending Audio Suggestions (10)"
                  results={dailyIdeas.trendingAudios}
                  defaultOpen
                  onCopy={(text) => saveToLibrary(text, 'script', 'Audio Suggestion')}
                />
              )}
            </div>
          )}

          {!dailyIdeas && (
            <p className="text-text-secondary">Click Refresh to generate daily ideas</p>
          )}
        </section>

        {/* Section 3: AI Creative Generator */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">AI Creative Generator</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <Button
                onClick={generateCreative}
                loading={loading.creative}
                iconLeft={<Sparkles className="h-4 w-4" />}
              >
                Generate Content
              </Button>
            </div>

            {creativeIdeas && (
              <div className="space-y-4">
                {creativeIdeas.adConcepts && creativeIdeas.adConcepts.length > 0 && (
                  <AIResultPanel
                    title="Ad Concepts (5)"
                    results={creativeIdeas.adConcepts}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'creative_idea')}
                  />
                )}

                {creativeIdeas.scripts && creativeIdeas.scripts.length > 0 && (
                  <AIResultPanel
                    title="Short Scripts (3)"
                    results={creativeIdeas.scripts}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'script')}
                  />
                )}

                {creativeIdeas.ugcIdeas && creativeIdeas.ugcIdeas.length > 0 && (
                  <AIResultPanel
                    title="UGC Ideas (3)"
                    results={creativeIdeas.ugcIdeas}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'creative_idea', 'UGC Idea')}
                  />
                )}

                {creativeIdeas.headlines && creativeIdeas.headlines.length > 0 && (
                  <AIResultPanel
                    title="Headlines (5)"
                    results={creativeIdeas.headlines}
                    defaultOpen
                    onCopy={(text) => saveToLibrary(text, 'hook', 'Headline')}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Content Library */}
        <section className="bg-surface-raised border border-border-default rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Your Content Library</h2>
          {library.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {library.map((item) => (
                <div
                  key={item._id.toString()}
                  className="p-4 bg-surface-elevated rounded-lg border border-border-default"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2 py-1 bg-surface-hover rounded text-text-secondary">
                      {item.type}
                    </span>
                    <Button
                      onClick={() => deleteFromLibrary(item._id.toString())}
                      variant="ghost"
                      iconLeft={<Trash2 className="h-3 w-3" />}
                    >
                      Delete
                    </Button>
                  </div>
                  {item.title && (
                    <h4 className="font-medium text-text-primary mb-1">{item.title}</h4>
                  )}
                  <p className="text-sm text-text-secondary line-clamp-3">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">Your library is empty. Save content to get started!</p>
          )}
        </section>
      </div>
    </div>
  );
}

