import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Launch Your Shopify Store in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            No technical skills needed. Browse products, connect your Shopify account,
            and get a fully functional store automatically.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Login
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-2">Browse Products</h3>
              <p className="text-gray-600">
                Choose from our curated catalog of ready-to-sell products
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold mb-2">Connect Shopify</h3>
              <p className="text-gray-600">
                Securely link your Shopify account in seconds
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Launch Store</h3>
              <p className="text-gray-600">
                Get a fully functional store created automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

