'use client';

import React from 'react';
import { HolidayDescription } from '@/types/admin';

interface RecentModificationsProps {
  modifications: HolidayDescription[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return '방금 전';
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInHours < 48) {
    return '어제';
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function ModificationItem({ modification }: { modification: HolidayDescription }) {
  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0">
        <div className={`w-2 h-2 rounded-full mt-2 ${
          modification.is_manual ? 'bg-yellow-400' : 'bg-blue-400'
        }`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {modification.holiday_name}
          </p>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            modification.is_manual 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {modification.is_manual ? '수동' : 'AI'}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {modification.country_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            {modification.modified_by}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(modification.modified_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingItem() {
  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0">
        <div className="w-2 h-2 rounded-full mt-2 bg-gray-200 animate-pulse"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecentModifications({ modifications, isLoading }: RecentModificationsProps) {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">최근 수정 내역</h3>
        <p className="text-sm text-gray-500">최근에 수정된 공휴일 설명들</p>
      </div>
      <div className="px-6 py-2">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingItem key={index} />
            ))}
          </div>
        ) : modifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {modifications.map((modification) => (
              <ModificationItem 
                key={modification.id} 
                modification={modification} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">최근 수정 내역이 없습니다.</p>
          </div>
        )}
      </div>
      {!isLoading && modifications.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            모든 수정 내역 보기 →
          </button>
        </div>
      )}
    </div>
  );
}