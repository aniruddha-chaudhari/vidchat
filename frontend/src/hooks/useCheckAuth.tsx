import { useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // Removed import
import { useUserStore } from '@/store/user';

export const useCheckAuth = () => {
  // const router = useRouter(); // Removed router

  const { user, checkAuth, loading, checkingAuth } = useUserStore();

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

  // Removed redirect logic
  return { user, loading: loading || checkingAuth };
};
