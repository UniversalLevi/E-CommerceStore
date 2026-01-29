'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';

export default function MentorshipPage() {
  const router = useRouter();

  // Redirect to new services page
  useEffect(() => {
    router.push('/dashboard/services');
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Migration Notice */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary mb-2">Redirecting to Services...</h2>
            <p className="text-text-secondary mb-4">
              Our mentorship program has been transformed into <strong className="text-white">"Connect with Experts"</strong> - a more structured, outcome-driven service with clear pricing and goal-based plans.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Go to Services Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
