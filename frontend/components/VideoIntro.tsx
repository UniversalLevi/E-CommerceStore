'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoIntroProps {
  onComplete: () => void;
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      setIsFading(true);
      // Wait for fade animation to complete
      setTimeout(() => {
        setIsPlaying(false);
        onComplete();
      }, 40); // Match the fade duration
    };

    const handleVideoError = () => {
      // If video fails to load, skip intro
      setIsPlaying(false);
      onComplete();
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);

    // Ensure video plays
    video.play().catch((error) => {
      console.warn('Video autoplay failed:', error);
      // If autoplay fails, skip intro
      setIsPlaying(false);
      onComplete();
    });

    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
    };
  }, [onComplete]);

  if (!isPlaying) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-[800ms] ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-label="Introductory video"
      >
        <source src="/shopify_bg.mp4" type="video/mp4" />
      </video>
      
      {/* Optional: Add a skip button */}
      <button
        onClick={() => {
          setIsFading(true);
          setTimeout(() => {
            setIsPlaying(false);
            onComplete();
          }, 80);
        }}
        className="absolute bottom-8 right-8 z-10 bg-black/50 hover:bg-black/70 text-white px-6 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm border border-white/20"
        aria-label="Skip intro"
      >
        Skip Intro
      </button>
    </div>
  );
}

