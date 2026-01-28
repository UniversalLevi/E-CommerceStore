'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { notify } from '@/lib/toast';
import '../elegant/styles.css';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 elegant-fade-in">
      <h1 className="text-4xl font-bold mb-8" style={{ color: colors.primary }}>
        Contact Us
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
            Get in Touch
          </h2>
          <p className="mb-6 text-lg" style={{ color: colors.text + 'DD' }}>
            Have a question or need assistance? We're here to help! Fill out the form and we'll get
            back to you as soon as possible.
          </p>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2" style={{ color: colors.accent }}>Email</p>
              <p style={{ color: colors.text + 'CC' }}>support@{storeName.toLowerCase().replace(/\s+/g, '')}.com</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: colors.accent }}>Response Time</p>
              <p style={{ color: colors.text + 'CC' }}>We typically respond within 24 hours</p>
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
            className="w-full px-4 py-3 rounded-lg border elegant-input"
            style={{
              borderColor: colors.border || colors.accent + '30',
              color: colors.text,
              backgroundColor: colors.secondary + '30',
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border elegant-input"
            style={{
              borderColor: colors.border || colors.accent + '30',
              color: colors.text,
              backgroundColor: colors.secondary + '30',
            }}
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border elegant-input"
            style={{
              borderColor: colors.border || colors.accent + '30',
              color: colors.text,
              backgroundColor: colors.secondary + '30',
            }}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 rounded-lg border elegant-input"
            style={{
              borderColor: colors.border || colors.accent + '30',
              color: colors.text,
              backgroundColor: colors.secondary + '30',
            }}
          />
          <button
            type="submit"
            className="w-full px-8 py-4 rounded-lg font-bold text-white elegant-button transition-all"
            style={{ 
              backgroundColor: colors.accent,
              color: colors.primary,
              boxShadow: `0 8px 25px ${colors.accent}30`,
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
