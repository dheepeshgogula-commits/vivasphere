'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to verify authentication status.
 * Redirects to /login if no valid user session exists in localStorage.
 * Always call all component hooks before checking the returned boolean!
 */
export function useAuthGuard(): boolean {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('vivasphere_user') : null;
      if (!stored) {
        router.replace('/login');
      } else {
        const user = JSON.parse(stored);
        if (user && (user.email || user.name)) {
          setAuthorized(true);
        } else {
          router.replace('/login');
        }
      }
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('vivasphere_user');
      router.replace('/login');
    }
  }, [router]);

  return authorized;
}
