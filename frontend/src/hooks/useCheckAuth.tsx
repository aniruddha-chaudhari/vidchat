import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';

export const useCheckAuth = (redirectTo: string = '/login') => {
  const router = useRouter();
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

  useEffect(() => {
    if (!checkingAuth && !loading && !user) {
      router.push(redirectTo);
    }
  }, [checkingAuth, loading, user, router, redirectTo]);

  return { user, loading: loading || checkingAuth };
};
