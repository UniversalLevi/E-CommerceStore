'use client';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 bg-radial-glow-purple opacity-40"></div>
      
      <div className="text-center relative z-10">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-6 text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

