'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/imageUrl';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a product image with resolved URL and fallback on load error.
 * Use for product/niche images so broken or blocked URLs show a placeholder.
 */
export default function ProductImage({ src, alt, className = '', fallbackClassName = '', style }: ProductImageProps) {
  const [error, setError] = useState(false);
  const url = getImageUrl(src);

  if (!url || error) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-hover text-text-secondary ${fallbackClassName || className}`}
        style={style}
        aria-label={alt}
      >
        <Package className="w-12 h-12 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
