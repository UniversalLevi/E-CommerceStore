'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { X, Mail } from 'lucide-react';

interface EmailPopupProps {
  slug: string;
  config: {
    title?: string;
    description?: string;
    couponCode?: string;
    triggerType?: string;
    triggerValue?: number;
    bgColor?: string;
  };
}

export default function EmailPopup({ slug, config }: EmailPopupProps) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `popup_dismissed_${slug}`;
    if (typeof window !== 'undefined' && localStorage.getItem(key)) return;

    const trigger = config.triggerType || 'delay';
    const value = config.triggerValue || 5000;

    if (trigger === 'delay') {
      const timer = setTimeout(() => setShow(true), value);
      return () => clearTimeout(timer);
    }

    if (trigger === 'scroll') {
      const handler = () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= value) { setShow(true); window.removeEventListener('scroll', handler); }
      };
      window.addEventListener('scroll', handler);
      return () => window.removeEventListener('scroll', handler);
    }

    if (trigger === 'exit_intent') {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 5) { setShow(true); document.removeEventListener('mouseleave', handler); }
      };
      document.addEventListener('mouseleave', handler);
      return () => document.removeEventListener('mouseleave', handler);
    }
  }, [config, slug]);

  const handleClose = () => {
    setDismissed(true);
    setShow(false);
    if (typeof window !== 'undefined') localStorage.setItem(`popup_dismissed_${slug}`, '1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.subscribeEmail(slug, email);
      setSubmitted(true);
    } catch { }
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-8" style={{ backgroundColor: config.bgColor || '#1a1a2e' }}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>

        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <Mail className="h-10 w-10 text-purple-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">{config.title || 'Stay Connected!'}</h2>
              <p className="text-sm text-gray-400 mt-2">{config.description || 'Subscribe for exclusive deals.'}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-gray-600 text-white placeholder:text-gray-500"
              />
              <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Subscribe
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-white">Thank You!</h2>
            {config.couponCode ? (
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-2">Here is your discount code:</p>
                <div className="inline-block px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
                  <span className="text-lg font-mono font-bold text-purple-400">{config.couponCode}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">You have been subscribed successfully.</p>
            )}
            <button onClick={handleClose} className="mt-4 px-6 py-2 text-sm text-gray-400 hover:text-white">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
