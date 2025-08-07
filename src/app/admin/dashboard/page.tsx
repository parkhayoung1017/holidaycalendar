'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthStatus, logout } from '@/lib/auth-middleware';
import { AdminDashboardStats } from '@/types/admin';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentModifications from '@/components/admin/RecentModifications';
import CountryStats from '@/components/admin/CountryStats';
import SystemStatus from '@/components/admin/SystemStatus';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        
        if (authStatus.isAuthenticated) {
          setIsAuthenticated(true);
        } else {
          router.replace('/admin/login');
          return;
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        router.replace('/admin/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/dashboard/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setDashboardStats(result.data);
        } else {
          throw new Error(result.error || '대시보드 통계를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('대시보드 통계 로딩 오류:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/admin/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 오류가 발생해도 로그인 페이지로 이동
      router.replace('/admin/login');
    }
  };

  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    
    try {
      setStatsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardStats(result.data);
      } else {
        throw new Error(result.error || '대시보드 통계를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('대시보드 통계 새로고침 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation 
        title="어드민 대시보드"
        onRefresh={handleRefresh}
        refreshLoading={statsLoading}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    오류가 발생했습니다
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 통계 카드 */}
          <DashboardStats 
            stats={dashboardStats!} 
            isLoading={statsLoading} 
          />

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 최근 수정 내역 */}
            <RecentModifications 
              modifications={dashboardStats?.recentModifications || []} 
              isLoading={statsLoading} 
            />

            {/* 시스템 상태 */}
            <SystemStatus isLoading={statsLoading} />
          </div>

          {/* 국가별 통계 */}
          <CountryStats 
            stats={dashboardStats!} 
            isLoading={statsLoading} 
          />
        </div>
      </main>
    </div>
  );
}