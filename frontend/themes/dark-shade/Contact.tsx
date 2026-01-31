'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { notify } from '@/lib/toast';
import './styles.css';

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-4xl font-bold mb-8 animate-slideIn" style={{ color: colors.primary }}>
        Contact Us
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
            Get in Touch
          </h2>
          <p className="mb-6 animate-fadeIn" style={{ color: colors.text, opacity: 0.9 }}>
            Have a question or need assistance? We're here to help! Fill out the form and we'll get
            back to you as soon as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:scale-[1.02] focus:shadow-lg animate-fadeIn"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: colors.text,
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: colors.text,
            }}
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: colors.text,
            }}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: colors.text,
            }}
          />
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
            style={{ 
              backgroundColor: colors.accent,
              boxShadow: '0 10px 30px rgba(100, 116, 139, 0.4)',
            }}
          >
            <span className="relative z-10">Send Message</span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              }}
            ></div>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
