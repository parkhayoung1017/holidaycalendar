'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, checkAuthStatus } from '@/lib/auth-middleware';
import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // 이미 로그인된 상태인지 확인
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (authStatus.isAuthenticated) {
          router.replace('/admin/dashboard');
          return;
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 로그인 시도 횟수 확인 (로컬 스토리지에서)
    const attempts = localStorage.getItem('admin_login_attempts');
    const lastAttempt = localStorage.getItem('admin_last_attempt');
    
    if (attempts && lastAttempt) {
      const attemptCount = parseInt(attempts);
      const lastAttemptTime = parseInt(lastAttempt);
      const now = Date.now();
      
      // 5분 후 초기화
      if (now - lastAttemptTime > 5 * 60 * 1000) {
        localStorage.removeItem('admin_login_attempts');
        localStorage.removeItem('admin_last_attempt');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(attemptCount);
        // 5회 이상 실패 시 5분간 차단
        if (attemptCount >= 5) {
          setIsBlocked(true);
          setTimeout(() => {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('admin_login_attempts');
            localStorage.removeItem('admin_last_attempt');
          }, 5 * 60 * 1000 - (now - lastAttemptTime));
        }
      }
    }
  }, [router]);

  const handleLogin = async (password: string) => {
    // 차단된 상태에서는 로그인 시도 불가
    if (isBlocked) {
      return {
        success: false,
        error: '너무 많은 로그인 시도로 인해 5분간 차단되었습니다.'
      };
    }

    try {
      const result = await login(password);
      
      if (result.success) {
        // 로그인 성공 시 시도 횟수 초기화
        localStorage.removeItem('admin_login_attempts');
        localStorage.removeItem('admin_last_attempt');
        setLoginAttempts(0);
        
        router.replace('/admin/dashboard');
        return { success: true };
      } else {
        // 로그인 실패 시 시도 횟수 증가
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('admin_login_attempts', newAttempts.toString());
        localStorage.setItem('admin_last_attempt', Date.now().toString());
        
        // 5회 실패 시 차단
        if (newAttempts >= 5) {
          setIsBlocked(true);
          setTimeout(() => {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('admin_login_attempts');
            localStorage.removeItem('admin_last_attempt');
          }, 5 * 60 * 1000);
          
          return {
            success: false,
            error: '5회 연속 로그인 실패로 5분간 차단되었습니다.'
          };
        }
        
        const remainingAttempts = 5 - newAttempts;
        return { 
          success: false, 
          error: `${result.error || '로그인에 실패했습니다.'} (남은 시도: ${remainingAttempts}회)`
        };
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      return { 
        success: false, 
        error: '로그인 중 오류가 발생했습니다.' 
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            어드민 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            공휴일 설명 관리 시스템에 접근하려면 로그인이 필요합니다.
          </p>
          {isBlocked && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                시스템 차단 상태
              </div>
            </div>
          )}
        </div>
        
        <LoginForm 
          onLogin={handleLogin} 
          isBlocked={isBlocked}
          loginAttempts={loginAttempts}
        />
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            이 페이지는 관리자 전용입니다. 무단 접근을 금지합니다.
          </p>
        </div>
      </div>
    </div>
  );
}