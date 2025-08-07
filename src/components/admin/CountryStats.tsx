'use client';

import React from 'react';
import { AdminDashboardStats } from '@/types/admin';

interface CountryStatsProps {
  stats: AdminDashboardStats;
  isLoading?: boolean;
}

interface CountryStatItemProps {
  country: string;
  total: number;
  completed: number;
  rate: number;
}

function CountryStatItem({ country, total, completed, rate }: CountryStatItemProps) {
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100';
    if (rate >= 60) return 'bg-yellow-100';
    if (rate >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {country}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{completed}/{total}</span>
            <span className="font-medium">{rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className={`w-full ${getProgressBgColor(rate)} rounded-full h-2`}>
          <div
            className={`h-2 rounded-full ${getProgressColor(rate)} transition-all duration-300`}
            style={{ width: `${rate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function LoadingCountryItem() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-1">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"></div>
        </div>
      </div>
    </div>
  );
}

export default function CountryStats({ stats, isLoading }: CountryStatsProps) {
  // 완료율 기준으로 정렬 (낮은 순서대로)
  const sortedCountryStats = stats?.countryStats?.slice().sort((a, b) => a.rate - b.rate) || [];
  
  // 상위 10개 국가만 표시
  const topCountries = sortedCountryStats.slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">국가별 완료율</h3>
        <p className="text-sm text-gray-500">완료율이 낮은 국가 순으로 표시</p>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <LoadingCountryItem key={index} />
            ))}
          </div>
        ) : topCountries.length > 0 ? (
          <div className="space-y-1">
            {topCountries.map((countryStat, index) => (
              <CountryStatItem
                key={countryStat.country}
                country={countryStat.country}
                total={countryStat.total}
                completed={countryStat.completed}
                rate={countryStat.rate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">국가별 통계 데이터가 없습니다.</p>
          </div>
        )}
      </div>
      {!isLoading && topCountries.length > 0 && sortedCountryStats.length > 10 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            {sortedCountryStats.length - 10}개 국가 더 있음
          </p>
        </div>
      )}
    </div>
  );
}