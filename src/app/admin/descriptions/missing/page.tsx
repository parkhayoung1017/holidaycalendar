'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth-middleware';
import AdminNavigation from '@/components/admin/AdminNavigation';
import MissingDescriptionsList from '@/components/admin/MissingDescriptionsList';

interface MissingHoliday {
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  country_code: string;
  date: string;
  year: number;
}

export default function MissingDescriptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [missingHolidays, setMissingHolidays] = useState<MissingHoliday[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 50
  });
  const [filters, setFilters] = useState({
    country: '',
    year: '2025'  // 기본값을 현재 연도로 설정
  });

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
    fetchMissingHolidays();
  }, [isAuthenticated, filters, pagination.currentPage]);

  const fetchMissingHolidays = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.country) params.append('country', filters.country);
      if (filters.year) params.append('year', filters.year);
      params.append('page', pagination.currentPage.toString());
      params.append('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/admin/descriptions/missing?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('API 응답:', result);
        console.log('메타데이터:', result.metadata);
        setMissingHolidays(result.data);
        setPagination(prev => ({
          ...prev,
          totalPages: result.metadata?.totalPages || 1,
          total: result.metadata?.total || 0
        }));
      } else {
        throw new Error(result.error || '설명 없는 공휴일 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('설명 없는 공휴일 로딩 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMissingHolidays();
  };

  const handleDescriptionCreated = () => {
    // 새 설명이 생성되면 목록을 새로고침
    fetchMissingHolidays();
  };

  const handlePageChange = (page: number) => {
    console.log('페이지 변경 요청:', page);
    console.log('현재 페이지네이션 상태:', pagination);
    setPagination(prev => {
      const newPagination = { ...prev, currentPage: page };
      console.log('새로운 페이지네이션 상태:', newPagination);
      return newPagination;
    });
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // 필터가 변경되면 첫 페이지로 돌아가기
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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
        title="설명 없는 공휴일 관리"
        onRefresh={handleRefresh}
        refreshLoading={dataLoading}
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

          {/* 필터 섹션 */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">필터</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  국가 코드
                </label>
                <input
                  type="text"
                  id="country-filter"
                  value={filters.country}
                  onChange={(e) => handleFiltersChange({ ...filters, country: e.target.value })}
                  placeholder="예: US, KR, JP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  연도
                </label>
                <input
                  type="text"
                  id="year-filter"
                  value={filters.year}
                  onChange={(e) => handleFiltersChange({ ...filters, year: e.target.value })}
                  placeholder="예: 2024, 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 설명 없는 공휴일 목록 */}
          <MissingDescriptionsList
            holidays={missingHolidays}
            isLoading={dataLoading}
            onDescriptionCreated={handleDescriptionCreated}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </div>
  );
}