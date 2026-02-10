'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-hero relative py-12">
      <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="glass-card border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-purple">About Us</span>
            </h1>
            <p className="text-xl text-text-secondary">
              Learn more about EazyDS
            </p>
          </div>

          <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
            <p className="text-text-secondary leading-relaxed">
              At EazyDS, we believe that launching an e-commerce store shouldn't require technical expertise or months of setup. Our mission is to democratize e-commerce by making it possible for anyone to launch a fully functional Shopify store in minutes, not months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">What We Do</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We provide an automated platform that connects you with thousands of pre-vetted products across multiple niches. Simply browse our catalog, select products that match your vision, and we'll automatically add them to your Shopify store with all the details, images, and pricing configured.
            </p>
            <p className="text-text-secondary leading-relaxed">
              No coding required. No product research needed. No manual data entry. Just browse, select, and launch.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Why Choose Us</h2>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-text-primary">Speed:</strong> Launch your store in minutes, not weeks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-text-primary">Simplicity:</strong> No technical skills required</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-text-primary">Quality:</strong> Pre-vetted products from trusted suppliers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-text-primary">Flexibility:</strong> Manage multiple stores from one dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-text-primary">Support:</strong> Get help when you need it</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Get Started</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              Ready to launch your store? It's free to get started. Browse our product catalog, connect your Shopify account, and start building your e-commerce empire today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 text-center"
              >
                Get Started Free
              </Link>
              <Link
                href="/contact"
                className="inline-block glass-card hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-full font-semibold transition-all text-center"
              >
                Contact Us
              </Link>
            </div>
          </section>
          </div>

          <div className="mt-8 text-center pt-8 border-t border-white/10">
            <Link
              href="/"
              className="text-text-primary hover:text-purple-400 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

