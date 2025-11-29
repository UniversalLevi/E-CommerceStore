'use client';

import { Instagram, Facebook } from 'lucide-react';

interface AdPreviewProps {
  platform: 'instagram' | 'facebook';
  placement: 'feed' | 'story' | 'reels' | 'rightColumn';
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  hashtags?: string[];
}

export default function AdPreview({
  platform,
  placement,
  imageUrl,
  videoUrl,
  caption,
  hashtags = [],
}: AdPreviewProps) {
  const getPlacementLabel = () => {
    if (platform === 'instagram') {
      if (placement === 'feed') return 'Instagram Feed';
      if (placement === 'story') return 'Instagram Story';
      if (placement === 'reels') return 'Instagram Reels';
    } else {
      if (placement === 'feed') return 'Facebook Feed';
      if (placement === 'story') return 'Facebook Story';
      if (placement === 'rightColumn') return 'Facebook Right Column';
    }
    return 'Preview';
  };

  const isVertical = placement === 'story' || placement === 'reels';
  const isNarrow = placement === 'rightColumn';

  return (
    <div className="bg-surface-raised border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {platform === 'instagram' ? (
          <Instagram className="h-5 w-5 text-pink-500" />
        ) : (
          <Facebook className="h-5 w-5 text-blue-500" />
        )}
        <h3 className="font-semibold text-text-primary">{getPlacementLabel()}</h3>
      </div>

      <div
        className={`bg-white rounded-lg overflow-hidden shadow-lg ${
          isVertical
            ? 'w-64 h-[450px] mx-auto'
            : isNarrow
            ? 'w-48 h-96 mx-auto'
            : 'w-full max-w-md mx-auto'
        }`}
      >
        {/* Preview Content */}
        <div className="relative bg-gray-100">
          {videoUrl ? (
            <video
              src={videoUrl}
              className={`w-full ${isVertical ? 'h-[320px]' : 'h-64'} object-cover`}
              controls
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Ad preview"
              className={`w-full ${isVertical ? 'h-[320px]' : 'h-64'} object-cover`}
            />
          ) : (
            <div
              className={`w-full ${isVertical ? 'h-[320px]' : 'h-64'} bg-gray-200 flex items-center justify-center`}
            >
              <p className="text-gray-400 text-sm">No media uploaded</p>
            </div>
          )}
        </div>

        {/* Caption Section */}
        {(caption || hashtags.length > 0) && (
          <div className="p-3 space-y-2">
            {caption && (
              <p className="text-sm text-gray-800 line-clamp-3">{caption}</p>
            )}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="text-xs text-blue-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

