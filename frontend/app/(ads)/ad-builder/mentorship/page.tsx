'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { Send } from 'lucide-react';

export default function MentorshipPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    incomeGoal: '',
    businessStage: '',
    whyMentorship: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/mentorship/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        notify.success('Application submitted successfully!');
        setFormData({
          name: '',
          phone: '',
          email: '',
          incomeGoal: '',
          businessStage: '',
          whyMentorship: '',
        });
      } else {
        notify.error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      notify.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface-raised border border-border-default rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Application Received!</h2>
          <p className="text-text-secondary mb-6">
            We've received your mentorship application. Our team will review it and get back to you
            soon.
          </p>
          <Button onClick={() => setSubmitted(false)}>Submit Another Application</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Mentorship Program</h1>

      {/* Section 1: About The Mentorship */}
      <section className="bg-surface-raised border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">About The Mentorship</h2>
        <p className="text-text-secondary leading-relaxed">
          Join our exclusive mentorship program designed to help you build and scale your online
          business. Learn from experienced entrepreneurs who have built successful e-commerce
          businesses from the ground up. Get personalized guidance, actionable strategies, and the
          support you need to achieve your goals.
        </p>
      </section>

      {/* Section 2: What's Included */}
      <section className="bg-surface-raised border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">What's Included</h2>
        <ul className="space-y-3 text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>1-on-1 Zoom calls with your mentor</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>WhatsApp support for quick questions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>Review and feedback on your ads</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>Daily accountability check-ins</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>Access to exclusive resources and templates</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500 mt-1">•</span>
            <span>Community access with other mentees</span>
          </li>
        </ul>
      </section>

      {/* Section 3: Student Results */}
      <section className="bg-surface-raised border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Student Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-elevated rounded-lg p-4 border border-border-default"
            >
              <div className="aspect-video bg-surface-hover rounded mb-3 flex items-center justify-center">
                <span className="text-text-secondary text-sm">Testimonial {i}</span>
              </div>
              <p className="text-sm text-text-secondary">
                "This mentorship program changed my business. I went from struggling to making
                consistent sales."
              </p>
              <p className="text-xs text-text-secondary mt-2">- Student {i}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Application Form */}
      <section className="bg-surface-raised border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Apply for Mentorship</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Income Goal</label>
            <select
              value={formData.incomeGoal}
              onChange={(e) => setFormData({ ...formData, incomeGoal: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">Select income goal</option>
              <option value="1k-5k">$1,000 - $5,000/month</option>
              <option value="5k-10k">$5,000 - $10,000/month</option>
              <option value="10k-25k">$10,000 - $25,000/month</option>
              <option value="25k+">$25,000+/month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Business Stage
            </label>
            <select
              value={formData.businessStage}
              onChange={(e) => setFormData({ ...formData, businessStage: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">Select business stage</option>
              <option value="just-starting">Just Starting</option>
              <option value="some-sales">Making Some Sales</option>
              <option value="scaling">Ready to Scale</option>
              <option value="established">Established Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Why Mentorship?
            </label>
            <textarea
              required
              rows={4}
              value={formData.whyMentorship}
              onChange={(e) => setFormData({ ...formData, whyMentorship: e.target.value })}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Tell us why you're interested in mentorship..."
            />
          </div>

          <Button type="submit" loading={submitting} iconLeft={<Send className="h-4 w-4" />}>
            Submit Application
          </Button>
        </form>
      </section>
    </div>
  );
}
