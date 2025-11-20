import Link from 'next/link';
import Navbar from '@/components/Navbar';

const features = [
  {
    title: 'Easy Store Connection',
    description: 'Connect your Shopify store in minutes with just your access token. No complex setup required.',
    icon: '🔗',
  },
  {
    title: 'Curated Product Catalog',
    description: 'Browse thousands of products organized by niches. Find exactly what you need for your store.',
    icon: '📦',
  },
  {
    title: 'One-Click Product Addition',
    description: 'Add products to your Shopify store with a single click. All details, images, and pricing included.',
    icon: '⚡',
  },
  {
    title: 'Multiple Store Management',
    description: 'Manage multiple Shopify stores from one account. Switch between stores effortlessly.',
    icon: '🏪',
  },
  {
    title: 'Niche-Based Organization',
    description: 'Products organized by niches make it easy to find relevant items for your target market.',
    icon: '🎯',
  },
  {
    title: 'Automatic Store Setup',
    description: 'Products are automatically added to your store with professional descriptions and images.',
    icon: '🤖',
  },
  {
    title: 'Secure Credential Storage',
    description: 'Your Shopify credentials are encrypted and stored securely. We never share your data.',
    icon: '🔒',
  },
  {
    title: 'Real-Time Sync',
    description: 'See your products appear in Shopify instantly. No waiting, no delays.',
    icon: '🔄',
  },
];

const comparisonFeatures = [
  { feature: 'Setup Time', us: '5 minutes', others: 'Hours or days' },
  { feature: 'Technical Skills Required', us: 'None', others: 'High' },
  { feature: 'Product Catalog', us: 'Thousands', others: 'Limited' },
  { feature: 'Multiple Stores', us: 'Unlimited', others: 'Single store' },
  { feature: 'Support', us: '24/7', others: 'Business hours' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for Your Shopify Store
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to build and manage your Shopify store quickly and efficiently.
            No technical expertise required.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Detailed Features */}
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Everything You Need to Succeed
          </h2>

          <div className="space-y-12">
            <section>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Quick Setup & Launch
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Get your store up and running in minutes, not days. Our streamlined process
                    eliminates the technical complexity of setting up a Shopify store from scratch.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Connect your store in under 5 minutes</li>
                    <li>No coding or technical knowledge required</li>
                    <li>Automatic theme and homepage setup</li>
                    <li>Ready to start selling immediately</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Comprehensive Product Catalog
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Access thousands of products organized by niches. Each product comes with
                    professional descriptions, high-quality images, and competitive pricing.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Products organized by niches (Fitness, Home & Garden, Electronics, etc.)</li>
                    <li>Professional product descriptions</li>
                    <li>High-resolution product images</li>
                    <li>Competitive pricing</li>
                    <li>Regular catalog updates</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  🎨
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Beautiful Store Design
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your store automatically gets a professional look with optimized themes and
                    layouts. Focus on selling while we handle the design.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Automatically configured themes</li>
                    <li>Mobile-responsive design</li>
                    <li>SEO-optimized pages</li>
                    <li>Fast loading times</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                  🔐
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Enterprise-Grade Security
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your data and store credentials are protected with industry-standard encryption.
                    We take security seriously.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Encrypted credential storage</li>
                    <li>Secure API connections</li>
                    <li>Regular security audits</li>
                    <li>GDPR compliant</li>
                    <li>No data sharing with third parties</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose Us?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary-600">Our Platform</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{item.feature}</td>
                    <td className="py-4 px-4 text-center text-primary-600 font-semibold">
                      {item.us}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">{item.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Entrepreneurs</h3>
              <p className="text-gray-600">
                Launch your online store quickly without technical barriers. Focus on marketing
                and sales, not setup.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Small Businesses</h3>
              <p className="text-gray-600">
                Expand your business online with minimal investment. No need to hire developers
                or designers.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dropshippers</h3>
              <p className="text-gray-600">
                Quickly test new products and niches. Add products to multiple stores and scale
                your business.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of store owners who are already using our platform
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors border-2 border-white"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

