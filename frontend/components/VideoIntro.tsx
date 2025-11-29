'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoIntroProps {
  onComplete: () => void;
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showText, setShowText] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Show button after 2.5 seconds
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

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
      clearTimeout(buttonTimer);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
    };
  }, [onComplete]);

  const handleStart = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsPlaying(false);
      onComplete();
    }, 800);
  };

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
      
      {/* Text and Button Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-8">
        {/* Text Overlay */}
        {showText && (
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-center px-4 italic"
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", "Georgia", serif',
              textShadow: `
                0 0 10px rgba(0, 0, 0, 1),
                0 0 20px rgba(0, 0, 0, 1),
                0 0 30px rgba(0, 0, 0, 1),
                0 0 40px rgba(0, 0, 0, 0.95),
                0 0 50px rgba(0, 0, 0, 0.9),
                0 0 60px rgba(0, 0, 0, 0.85),
                0 0 80px rgba(0, 0, 0, 0.8),
                0 0 100px rgba(0, 0, 0, 0.75),
                0 0 120px rgba(0, 0, 0, 0.7),
                3px 3px 0 rgba(0, 0, 0, 1),
                -3px -3px 0 rgba(0, 0, 0, 1),
                3px -3px 0 rgba(0, 0, 0, 1),
                -3px 3px 0 rgba(0, 0, 0, 1),
                0 3px 0 rgba(0, 0, 0, 1),
                0 -3px 0 rgba(0, 0, 0, 1),
                3px 0 0 rgba(0, 0, 0, 1),
                -3px 0 0 rgba(0, 0, 0, 1),
                6px 6px 12px rgba(0, 0, 0, 1),
                -6px -6px 12px rgba(0, 0, 0, 1),
                0 6px 12px rgba(0, 0, 0, 1),
                0 -6px 12px rgba(0, 0, 0, 1),
                6px 0 12px rgba(0, 0, 0, 1),
                -6px 0 12px rgba(0, 0, 0, 1)
              `.replace(/\s+/g, ' ').trim(),
              letterSpacing: '0.02em',
              animation: 'fadeInUpSmooth 1.6s ease-out forwards, pulse 4s ease-in-out infinite 1.6s',
              filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 1)) drop-shadow(0 0 16px rgba(0, 0, 0, 0.9))',
              willChange: 'transform, opacity',
            }}
          >
            IMAGINE HOW THIS WILL FEEL
          </h1>
        )}

        {/* Start Button - appears after 2-3 seconds */}
        {showButton && (
          <button
            onClick={handleStart}
            className={`bg-transparent hover:opacity-80 text-white font-bold transition-all duration-500 transform hover:scale-110 cursor-pointer border-none outline-none ${
              showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              fontFamily: '"Inter", "Arial", sans-serif',
              letterSpacing: '0.1em',
              fontSize: '8rem',
              lineHeight: '1',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 2px 15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 255, 255, 0.2)',
            }}
          >
            Get Started
          </button>
        )}
      </div>
      
      {/* Optional: Add a skip button */}
      <button
        onClick={handleStart}
        className="absolute bottom-8 right-8 z-10 bg-black/50 hover:bg-black/70 text-white px-6 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm border border-white/20"
        aria-label="Skip intro"
      >
        Skip Intro
      </button>
    </div>
  );
}

