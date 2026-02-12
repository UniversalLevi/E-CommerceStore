'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StoreSettingsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to information page as default
    router.replace('/dashboard/store/information');
  }, [router]);

  return null;
}
