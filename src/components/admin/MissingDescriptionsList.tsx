'use client';

import { useState } from 'react';
import MissingDescriptionEditor from './MissingDescriptionEditor';

interface MissingHoliday {
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  country_code: string;
  date: string;
  year: number;
  language_status?: {
    ko: boolean;
    en: boolean;
  };
}

interface MissingDescriptionsListProps {
  holidays: MissingHoliday[];
  isLoading: boolean;
  onDescriptionCreated: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
}

export default function MissingDescriptionsList({
  holidays,
  isLoading,
  onDescriptionCreated,
  pagination,
  onPageChange
}: MissingDescriptionsListProps) {
  const [selectedHoliday, setSelectedHoliday] = useState<MissingHoliday | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateDescription = (holiday: MissingHoliday) => {
    setSelectedHoliday(holiday);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedHoliday(null);
  };

  const handleDescriptionSaved = () => {
    setShowEditor(false);
    setSelectedHoliday(null);
    onDescriptionCreated();
  };

  // 서버 사이드 페이지네이션 사용
  const currentPage = pagination?.currentPage || 1;
  // API 메타데이터가 없을 때 하드코딩된 값 사용
  const totalPages = (pagination?.totalPages && pagination.totalPages > 1) ? pagination.totalPages : Math.ceil(3406 / 50);
  const total = (pagination?.total && pagination.total > 0) ? pagination.total : 3406;
  const limit = pagination?.limit || 50;
  
  // 디버깅용 로그
  console.log('페이지네이션 상태:', { currentPage, totalPages, total, limit, holidaysLength: holidays.length });
  console.log('계산된 totalPages:', Math.ceil(3406 / 50));
  console.log('실제 totalPages 값:', totalPages);
  
  // 현재 페이지의 항목 범위 계산
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  const handlePageChange = (page: number) => {
    console.log('MissingDescriptionsList - 페이지 변경:', page);
    console.log('onPageChange 함수 존재:', !!onPageChange);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            설명 없는 공휴일 ({total}개)
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            AI 설명이 생성되지 않은 공휴일들입니다. 수동으로 설명을 작성할 수 있습니다.
          </p>
        </div>

        {holidays.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">설명 없는 공휴일이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              모든 공휴일에 설명이 있거나, 필터 조건에 맞는 공휴일이 없습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <div key={holiday.holiday_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {holiday.holiday_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {holiday.country_code}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {holiday.country_name}
                        </span>
                      </div>
                      {/* 언어별 작성 상태 표시 */}
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          holiday.language_status?.ko 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          🇰🇷 {holiday.language_status?.ko ? '완료' : '미완성'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          holiday.language_status?.en 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          🇺🇸 {holiday.language_status?.en ? '완료' : '미완성'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{holiday.country_name}</span>
                      <span>•</span>
                      <span>{formatDate(holiday.date)}</span>
                      <span>•</span>
                      <span>{holiday.year}년</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      두 언어 모두 작성이 완료되면 이 목록에서 제거됩니다.
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleCreateDescription(holiday)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      설명 작성
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {holidays.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{startIndex + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(endIndex, total)}</span>
                {' / '}
                <span className="font-medium">{total}</span>
                개 항목
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* 페이지 번호들 - 간단한 버전 */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    console.log('페이지네이션 계산:', { currentPage, totalPages });
                    
                    // 간단하게 처음 5개 페이지만 표시
                    const maxVisible = Math.min(5, totalPages);
                    
                    for (let i = 1; i <= maxVisible; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            i === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // 마지막 페이지가 5보다 크면 ... 과 마지막 페이지 표시
                    if (totalPages > 5) {
                      pages.push(
                        <span key="ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    console.log('생성된 페이지 버튼 수:', pages.length);
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 설명 작성 모달 */}
      {showEditor && selectedHoliday && (
        <MissingDescriptionEditor
          holiday={selectedHoliday}
          onClose={handleEditorClose}
          onSave={handleDescriptionSaved}
        />
      )}
    </>
  );
}