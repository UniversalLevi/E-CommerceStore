'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Section {
  title: string;
  content: React.ReactNode;
}

export default function TermsPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections: Section[] = [
    {
      title: '1. Acceptance of Terms',
      content: (
        <p className="text-text-secondary leading-relaxed">
          By accessing and using this service, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>
      ),
    },
    {
      title: '2. Use License',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            Permission is granted to temporarily use this service for personal, non-commercial
            transitory viewing only. This is the grant of a license, not a transfer of title,
            and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained in the service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </div>
      ),
    },
    {
      title: '3. User Accounts',
      content: (
        <p className="text-text-secondary leading-relaxed">
          When you create an account with us, you must provide information that is accurate,
          complete, and current at all times. You are responsible for safeguarding the
          password and for all activities that occur under your account.
        </p>
      ),
    },
    {
      title: '4. Shopify Integration',
      content: (
        <p className="text-text-secondary leading-relaxed">
          Our service integrates with Shopify stores. By connecting your Shopify store, you
          agree to comply with Shopify's Terms of Service and API License Agreement. You are
          responsible for maintaining the security of your Shopify credentials.
        </p>
      ),
    },
    {
      title: '5. Prohibited Uses',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">You may not use our service:</p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>In any way that violates any applicable law or regulation</li>
            <li>To transmit any malicious code or viruses</li>
            <li>To impersonate or attempt to impersonate another user</li>
            <li>In any way that infringes upon the rights of others</li>
          </ul>
        </div>
      ),
    },
    {
      title: '6. Disclaimer',
      content: (
        <p className="text-text-secondary leading-relaxed">
          The materials on this service are provided on an 'as is' basis. We make no
          warranties, expressed or implied, and hereby disclaim and negate all other
          warranties including, without limitation, implied warranties or conditions of
          merchantability, fitness for a particular purpose, or non-infringement of
          intellectual property or other violation of rights.
        </p>
      ),
    },
    {
      title: '7. Limitations',
      content: (
        <p className="text-text-secondary leading-relaxed">
          In no event shall we or our suppliers be liable for any damages (including, without
          limitation, damages for loss of data or profit, or due to business interruption)
          arising out of the use or inability to use the materials on this service.
        </p>
      ),
    },
    {
      title: '8. Revisions',
      content: (
        <p className="text-text-secondary leading-relaxed">
          We may revise these terms of service at any time without notice. By using this
          service you are agreeing to be bound by the then current version of these terms of
          service.
        </p>
      ),
    },
    {
      title: '9. Contact Information',
      content: (
        <p className="text-text-secondary leading-relaxed">
          If you have any questions about these Terms of Service, please contact us at{' '}
          <Link href="/contact" className="text-primary-500 hover:text-primary-400">
            our contact page
          </Link>
          .
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-8 md:p-12">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Terms of Service</h1>
          <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={index}
                className="border border-border-default rounded-lg overflow-hidden bg-surface-elevated"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface-hover transition-colors"
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
                  <div className="px-6 py-4 border-t border-border-default">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border-default">
            <Link
              href="/"
              className="text-text-primary hover:text-primary-500 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
