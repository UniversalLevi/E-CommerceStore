'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Button from '@/components/Button';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message must be less than 5000 characters'),
});

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = contactSchema.parse(formData);
      setSubmitting(true);

      await api.post('/api/contact', validated);

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      notify.success('Thank you for contacting us! We will get back to you soon.');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        notify.error(err.response?.data?.error || 'Failed to send message');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-black min-h-screen">
      <div className="bg-[#1a1a1a] border border-[#5D737E] rounded-xl shadow-md p-8 md:p-12">
        <h1 className="text-4xl font-bold text-[#F0F7EE] mb-4">Contact Us</h1>
        <p className="text-[#d1d9d4] mb-8">
            Have a question or need help? We'd love to hear from you. Send us a message and we'll
            respond as soon as possible.
          </p>

        {success ? (
          <div className="bg-[#87BBA2] bg-opacity-20 border border-[#87BBA2] rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-[#F0F7EE] mb-2">
              Message Sent Successfully
            </h3>
            <p className="text-[#d1d9d4] mb-4">
                Thank you for contacting us! We will get back to you soon.
              </p>
              <Button
                onClick={() => setSuccess(false)}
                variant="secondary"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#d1d9d4] mb-2">
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border ${
                      errors.name ? 'border-red-500' : 'border-[#5D737E]'
                    } text-[#F0F7EE] rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED]`}
                    placeholder="Your name"
                  />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#d1d9d4] mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border ${
                      errors.email ? 'border-red-500' : 'border-[#5D737E]'
                    } text-[#F0F7EE] rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED]`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-[#d1d9d4] mb-2">
                Subject *
              </label>
              <input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className={`w-full px-4 py-2 bg-[#0a0a0a] border ${
                  errors.subject ? 'border-red-500' : 'border-[#5D737E]'
                } text-[#F0F7EE] rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED]`}
                placeholder="What is this regarding?"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[#d1d9d4] mb-2">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className={`w-full px-4 py-2 bg-[#0a0a0a] border ${
                  errors.message ? 'border-red-500' : 'border-[#5D737E]'
                } text-[#F0F7EE] rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED]`}
                placeholder="Tell us how we can help..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-400">{errors.message}</p>
              )}
              <p className="mt-1 text-sm text-[#939ba0]">
                {formData.message.length}/5000 characters
              </p>
            </div>

              <Button
                type="submit"
                className="w-full"
                loading={submitting}
                disabled={submitting}
              >
                Send Message
              </Button>
            </form>
          )}

        <div className="mt-12 pt-8 border-t border-[#5D737E]">
          <h3 className="text-lg font-semibold text-[#F0F7EE] mb-4">Support Hours</h3>
          <p className="text-[#d1d9d4] mb-2">
            <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST
          </p>
          <p className="text-[#d1d9d4] mb-2">
            <strong>Saturday:</strong> 10:00 AM - 4:00 PM EST
          </p>
          <p className="text-[#d1d9d4]">
            <strong>Sunday:</strong> Closed
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/help"
            className="text-[#1AC8ED] hover:text-[#17b4d5] font-medium"
          >
            Visit our Help Center →
          </Link>
        </div>
      </div>
    </div>
  );
}

