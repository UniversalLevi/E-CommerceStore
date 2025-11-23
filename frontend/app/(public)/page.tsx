import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[#F0F7EE] mb-6">
            Launch Your Shopify Store in Minutes
          </h1>
          <p className="text-xl text-[#d1d9d4] mb-8">
            No technical skills needed. Browse products, connect your Shopify account,
            and get a fully functional store automatically.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-[#1AC8ED] hover:bg-[#17b4d5] text-black px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#F0F7EE] border-2 border-[#1AC8ED] px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Login
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-[#1a1a1a] border border-[#5D737E] p-6 rounded-xl shadow-lg hover:border-[#1AC8ED] transition-colors">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-2 text-[#F0F7EE]">Browse Products</h3>
              <p className="text-[#d1d9d4]">
                Choose from our curated catalog of ready-to-sell products
              </p>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#5D737E] p-6 rounded-xl shadow-lg hover:border-[#1AC8ED] transition-colors">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold mb-2 text-[#F0F7EE]">Connect Shopify</h3>
              <p className="text-[#d1d9d4]">
                Securely link your Shopify account in seconds
              </p>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#5D737E] p-6 rounded-xl shadow-lg hover:border-[#1AC8ED] transition-colors">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2 text-[#F0F7EE]">Launch Store</h3>
              <p className="text-[#d1d9d4]">
                Get a fully functional store created automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

