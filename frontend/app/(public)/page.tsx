import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-base">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-elevated to-surface-base"></div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
              Launch Your Shopify Store
              <span className="block mt-2">in Minutes</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
              No technical skills needed. Browse products, connect your Shopify account,
              and get a fully functional store automatically.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mb-16">
              <Link
                href="/register"
                className="bg-primary-500 hover:bg-primary-600 text-black px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="bg-transparent hover:bg-surface-hover text-text-primary border-2 border-primary-500 px-10 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Login
              </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-text-primary mb-2">1000+</div>
                <div className="text-text-secondary">Products Available</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-text-primary mb-2">5 Min</div>
                <div className="text-text-secondary">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-text-primary mb-2">24/7</div>
                <div className="text-text-secondary">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Powerful features to help you build and grow your online store
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">🛍️</div>
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Browse Products</h3>
              <p className="text-text-secondary leading-relaxed">
                Choose from our curated catalog of ready-to-sell products across multiple niches. 
                Find the perfect products for your store.
              </p>
            </div>
            
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">🔗</div>
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Connect Shopify</h3>
              <p className="text-text-secondary leading-relaxed">
                Securely link your Shopify account in seconds. Manage multiple stores 
                from one dashboard.
              </p>
            </div>
            
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">🚀</div>
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Launch Store</h3>
              <p className="text-text-secondary leading-relaxed">
                Get a fully functional store created automatically. Add products with 
                one click and start selling immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Why Choose Us
              </h2>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">No Technical Skills Required</h3>
                  <p className="text-text-secondary">
                    Our platform handles all the technical complexity. You just browse, select, and launch.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Curated Product Catalog</h3>
                  <p className="text-text-secondary">
                    Every product in our catalog is carefully selected and optimized for e-commerce success.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Fast & Reliable</h3>
                  <p className="text-text-secondary">
                    Get your store up and running in minutes. Our automated system ensures 
                    everything works perfectly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface-elevated border-t border-border-default">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join thousands of entrepreneurs who have launched their stores with us.
            </p>
            <Link
              href="/register"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-12 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Your Store Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

