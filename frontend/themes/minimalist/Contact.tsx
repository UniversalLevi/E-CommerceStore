'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { notify } from '@/lib/toast';
import '../minimalist/styles.css';

interface ContactProps {
  storeSlug: string;
  storeName: string;
}

export default function Contact({ storeSlug, storeName }: ContactProps) {
  const { colors } = useStoreTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    notify.success('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 minimalist-fade">
      <h1 className="text-3xl font-medium mb-12" style={{ color: colors.primary }}>
        Contact Us
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-lg font-medium mb-4" style={{ color: colors.primary }}>
            Get in Touch
          </h2>
          <p className="mb-6 text-sm" style={{ color: colors.text + '80' }}>
            Have a question or need assistance? We're here to help! Fill out the form and we'll get
            back to you as soon as possible.
          </p>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-1 text-xs" style={{ color: colors.accent }}>Email</p>
              <p className="text-xs" style={{ color: colors.text + '60' }}>support@{storeName.toLowerCase().replace(/\s+/g, '')}.com</p>
            </div>
            <div>
              <p className="font-medium mb-1 text-xs" style={{ color: colors.accent }}>Response Time</p>
              <p className="text-xs" style={{ color: colors.text + '60' }}>We typically respond within 24 hours</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-b minimalist-input"
            style={{
              borderColor: colors.border || colors.primary + '20',
              color: colors.text,
              backgroundColor: 'transparent',
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-b minimalist-input"
            style={{
              borderColor: colors.border || colors.primary + '20',
              color: colors.text,
              backgroundColor: 'transparent',
            }}
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-b minimalist-input"
            style={{
              borderColor: colors.border || colors.primary + '20',
              color: colors.text,
              backgroundColor: 'transparent',
            }}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 border-b minimalist-input"
            style={{
              borderColor: colors.border || colors.primary + '20',
              color: colors.text,
              backgroundColor: 'transparent',
            }}
          />
          <button
            type="submit"
            className="w-full px-6 py-3 minimalist-button text-white"
            style={{ 
              backgroundColor: colors.accent,
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
