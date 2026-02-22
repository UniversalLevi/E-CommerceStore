'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Announcement {
  text: string;
  link?: string;
  bgColor?: string;
  textColor?: string;
}

interface AnnouncementBarProps {
  announcements: Announcement[];
  speed?: number;
}

export default function AnnouncementBar({ announcements, speed = 30 }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !announcements || announcements.length === 0) return null;

  const bgColor = announcements[0]?.bgColor || '#7c3aed';
  const textColor = announcements[0]?.textColor || '#ffffff';
  const allText = announcements.map(a => a.text).join('   •   ');

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div className="flex items-center py-2 px-8">
        <div className="flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap animate-marquee inline-block"
            style={{ color: textColor, animationDuration: `${speed}s` }}
          >
            {allText}
            <span className="mx-8">•</span>
            {allText}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 p-1 rounded-full hover:opacity-70 transition-opacity shrink-0"
          style={{ color: textColor }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}
