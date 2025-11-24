import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-[#1a1a1a] border border-[#505050] rounded-xl shadow-md p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-6">Refund Policy</h1>
          <p className="text-[#a0a0a0] mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Refund Eligibility</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                We offer refunds for our services under the following conditions:
              </p>
              <ul className="list-disc pl-6 text-[#a0a0a0] space-y-2">
                <li>Refund requests must be made within 30 days of purchase</li>
                <li>The service must not have been used extensively</li>
                <li>Technical issues that prevent service usage</li>
                <li>Duplicate charges or billing errors</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Non-Refundable Items</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc pl-6 text-[#a0a0a0] space-y-2">
                <li>Services used beyond the refund period</li>
                <li>Custom development or integration work</li>
                <li>Third-party fees (Shopify, payment processors)</li>
                <li>Services terminated due to violation of Terms of Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Refund Process</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                To request a refund, please contact us through{' '}
                <Link href="/contact" className="text-white hover:text-[#e0e0e0]">
                  our contact page
                </Link>
                {' '}with the following information:
              </p>
              <ul className="list-disc pl-6 text-[#a0a0a0] space-y-2">
                <li>Your account email address</li>
                <li>Date of purchase</li>
                <li>Reason for refund request</li>
                <li>Any relevant transaction details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Processing Time</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                Once your refund request is approved, we will process the refund within 5-10
                business days. The refund will be issued to the original payment method used for
                the purchase. Please note that it may take additional time for your bank or credit
                card company to process the refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Partial Refunds</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                In some cases, we may offer partial refunds based on the extent of service usage.
                This will be determined on a case-by-case basis and communicated to you during the
                refund process.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cancellation</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                You may cancel your subscription at any time. Cancellation will take effect at the
                end of your current billing period. You will continue to have access to the
                service until the end of the billing period, but no further charges will be made.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Disputes</h2>
              <p className="text-[#a0a0a0] leading-relaxed mb-4">
                If you are not satisfied with our refund decision, you may contact us to discuss
                your concerns. We are committed to resolving disputes fairly and promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Information</h2>
              <p className="text-[#a0a0a0] leading-relaxed">
                For refund requests or questions about this policy, please contact us at{' '}
                <Link href="/contact" className="text-white hover:text-[#e0e0e0]">
                  our contact page
                </Link>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#505050]">
            <Link
              href="/"
              className="text-white hover:text-[#e0e0e0] font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

