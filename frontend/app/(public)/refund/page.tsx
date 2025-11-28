'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Section {
  title: string;
  content: React.ReactNode;
}

export default function RefundPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections: Section[] = [
    {
      title: '1. Refund Eligibility',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            We offer refunds for our services under the following conditions:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Refund requests must be made within 30 days of purchase</li>
            <li>The service must not have been used extensively</li>
            <li>Technical issues that prevent service usage</li>
            <li>Duplicate charges or billing errors</li>
          </ul>
        </div>
      ),
    },
    {
      title: '2. Non-Refundable Items',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            The following are not eligible for refunds:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Services used beyond the refund period</li>
            <li>Custom development or integration work</li>
            <li>Third-party fees (Shopify, payment processors)</li>
            <li>Services terminated due to violation of Terms of Service</li>
          </ul>
        </div>
      ),
    },
    {
      title: '3. Refund Process',
      content: (
        <div>
          <p className="text-text-secondary leading-relaxed mb-4">
            To request a refund, please contact us through{' '}
            <Link href="/contact" className="text-primary-500 hover:text-primary-400">
              our contact page
            </Link>
            {' '}with the following information:
          </p>
          <ul className="list-disc pl-6 text-text-secondary space-y-2">
            <li>Your account email address</li>
            <li>Date of purchase</li>
            <li>Reason for refund request</li>
            <li>Any relevant transaction details</li>
          </ul>
        </div>
      ),
    },
    {
      title: '4. Processing Time',
      content: (
        <p className="text-text-secondary leading-relaxed">
          Once your refund request is approved, we will process the refund within 5-10
          business days. The refund will be issued to the original payment method used for
          the purchase. Please note that it may take additional time for your bank or credit
          card company to process the refund.
        </p>
      ),
    },
    {
      title: '5. Partial Refunds',
      content: (
        <p className="text-text-secondary leading-relaxed">
          In some cases, we may offer partial refunds based on the extent of service usage.
          This will be determined on a case-by-case basis and communicated to you during the
          refund process.
        </p>
      ),
    },
    {
      title: '6. Cancellation',
      content: (
        <p className="text-text-secondary leading-relaxed">
          You may cancel your subscription at any time. Cancellation will take effect at the
          end of your current billing period. You will continue to have access to the
          service until the end of the billing period, but no further charges will be made.
        </p>
      ),
    },
    {
      title: '7. Disputes',
      content: (
        <p className="text-text-secondary leading-relaxed">
          If you are not satisfied with our refund decision, you may contact us to discuss
          your concerns. We are committed to resolving disputes fairly and promptly.
        </p>
      ),
    },
    {
      title: '8. Contact Information',
      content: (
        <p className="text-text-secondary leading-relaxed">
          For refund requests or questions about this policy, please contact us at{' '}
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
          <h1 className="text-4xl font-bold text-text-primary mb-2">Refund Policy</h1>
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
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
