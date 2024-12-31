'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user'
import { useEffect } from 'react';

function Home() {
  const router = useRouter()
  const {user, checkAuth, loading, checkingAuth} = useUserStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.log('Auth check failed, continuing as unauthenticated');
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!checkingAuth) {
      if (!user) {
        router.push('/login');
      } else {
        router.push('/chats');
      }
    }
  }, [checkingAuth, user, router]);

  // Show loading state while checking authentication
  if (checkingAuth || loading) {
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