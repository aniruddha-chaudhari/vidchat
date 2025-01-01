'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCheckAuth } from '@/hooks/useCheckAuth'; // Added import

function Home() {
  const router = useRouter();
  const { user, loading } = useCheckAuth(); // Updated hook usage

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        router.push('/chats');
      }
    }
  }, [loading, user, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1>Loading...</h1>
      </div>
    );
  }

  // Don't show the main content while redirecting
  return null;
}

export default Home;