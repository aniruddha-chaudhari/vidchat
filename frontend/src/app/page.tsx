'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user'
import { useEffect } from 'react';

function Home() {
  const router = useRouter()
  const {user, checkAuth, loading,checkingAuth} = useUserStore();

  useEffect(() => {
    const delay = setTimeout(() => {
      checkAuth()
      if(user) {
        router.push('/chats')
      }
    }, 1000);

    return () => clearTimeout(delay);
  }, [checkAuth, user, router]);

  if(checkingAuth) {
    return (
      <div>
        <h1>Loading......</h1>
      </div>
    )
  }

  return (
    <div>
      <h1>Welcome to Our Application</h1>
      <p>Get started by signing up or logging in.</p>
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link 
          href="/signup"
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        >
          Sign Up
        </Link>
        <Link 
          href="/login"
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        >
          Log In
        </Link>
       
      </div>
    </div>
  );
}

export default Home;