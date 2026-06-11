'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BailleurDoubleDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/bailleur');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
