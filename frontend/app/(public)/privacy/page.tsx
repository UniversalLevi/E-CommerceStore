'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Section {
  title: string;
  content: React.ReactNode;
}

export default function PrivacyPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections: Section[] = [
    {
      title: '1. Information We Collect',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Email address and password when you create an account</li>
            <li>Shopify store credentials (access tokens, shop domain) when you connect a store</li>
            <li>Product information you add to your stores</li>
            <li>Usage data and analytics</li>
          </ul>
        </div>
      ),
    },
    {
      title: '2. How We Use Your Information',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends and usage</li>
          </ul>
        </div>
      ),
    },
    {
      title: '3. Information Sharing',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may
            share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>With Shopify to provide integration services</li>
            <li>With service providers who assist us in operating our service</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a business transfer or merger</li>
          </ul>
        </div>
      ),
    },
    {
      title: '4. Data Security',
      content: (
        <p className="text-text-secondary leading-relaxed">
          We implement appropriate technical and organizational security measures to protect
          your personal information. However, no method of transmission over the Internet or
          electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      ),
    },
    {
      title: '5. Cookies and Tracking',
      content: (
        <p className="text-text-secondary leading-relaxed">
          We use cookies and similar tracking technologies to track activity on our service
          and hold certain information. Cookies are files with a small amount of data which
          may include an anonymous unique identifier.
        </p>
      ),
    },
    {
      title: '6. Your Rights (GDPR)',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            If you are located in the European Economic Area (EEA), you have certain data
            protection rights:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>The right to access your personal data</li>
            <li>The right to rectification of inaccurate data</li>
            <li>The right to erasure ("right to be forgotten")</li>
            <li>The right to restrict processing</li>
            <li>The right to data portability</li>
            <li>The right to object to processing</li>
          </ul>
        </div>
      ),
    },
    {
      title: '7. Data Retention',
      content: (
        <p className="text-text-secondary leading-relaxed">
          We retain your personal information for as long as your account is active or as
          needed to provide you services. If you delete your account, we will delete or
          anonymize your personal information, except where we are required to retain it for
          legal purposes.
        </p>
      ),
    },
    {
      title: '8. Children\'s Privacy',
      content: (
        <p className="text-text-secondary leading-relaxed">
          Our service is not intended for children under the age of 13. We do not knowingly
          collect personal information from children under 13.
        </p>
      ),
    },
    {
      title: '9. Changes to This Policy',
      content: (
        <p className="text-text-secondary leading-relaxed">
          We may update our Privacy Policy from time to time. We will notify you of any
          changes by posting the new Privacy Policy on this page and updating the "Last
          updated" date.
        </p>
      ),
    },
    {
      title: '10. Contact Us',
      content: (
        <p className="text-text-secondary leading-relaxed">
          If you have any questions about this Privacy Policy, please contact us at{' '}
          <Link href="/contact" className="text-primary-500 hover:text-primary-400">
            our contact page
          </Link>
          .
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero relative py-12">
      <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="glass-card border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-2"><span className="text-gradient-purple">Privacy Policy</span></h1>
          <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
                  <svg
                    className={`w-5 h-5 text-text-secondary transition-transform ${
                      openSection === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openSection === index && (
                  <div className="px-6 py-4 border-t border-white/10">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <Link
              href="/"
              className="text-text-primary hover:text-purple-400 font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
