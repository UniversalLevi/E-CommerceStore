'use client';

export default function StorePreview() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-glow-blue opacity-40"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-purple">See It In Action</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Watch your store come to life in real-time
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative animate-float">
            {/* Mock Dashboard Container */}
            <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                <div className="flex-1 h-10 rounded-lg bg-white/5 ml-4 border border-white/10"></div>
              </div>

              {/* Dashboard Content */}
              <div className="space-y-6">
                {/* Header Bar */}
                <div className="h-16 rounded-xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-teal-500/20 border border-white/10"></div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-4 w-16 bg-white/20 rounded mb-2 mx-auto"></div>
                        <div className="h-3 w-12 bg-white/10 rounded mx-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="space-y-2">
                        <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                        <div className="h-2 w-full bg-white/10 rounded"></div>
                        <div className="h-2 w-2/3 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10"></div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10"></div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/10"></div>
                </div>
              </div>
            </div>

            {/* Glow Effect Behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-20 -z-10 animate-pulse-glow"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

