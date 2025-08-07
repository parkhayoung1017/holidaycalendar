'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth-middleware';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        
        if (authStatus.isAuthenticated) {
          // 이미 로그인된 경우 대시보드로 리다이렉트
          router.replace('/admin/dashboard');
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        // 오류 발생 시 로그인 페이지로 리다이렉트
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}