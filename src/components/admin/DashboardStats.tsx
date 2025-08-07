'use client';

import React from 'react';
import { AdminDashboardStats } from '@/types/admin';

interface DashboardStatsProps {
  stats: AdminDashboardStats;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, color = 'blue', isLoading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <div className="w-6 h-6">
            {color === 'blue' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {color === 'green' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {color === 'yellow' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            {color === 'purple' && (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="전체 공휴일"
        value={stats?.totalHolidays || 0}
        subtitle="등록된 공휴일 수"
        color="blue"
        isLoading={isLoading}
      />
      <StatCard
        title="설명 완료"
        value={stats?.totalDescriptions || 0}
        subtitle="설명이 있는 공휴일"
        color="green"
        isLoading={isLoading}
      />
      <StatCard
        title="완료율"
        value={stats ? `${stats.completionRate.toFixed(1)}%` : '0%'}
        subtitle="전체 대비 설명 완료율"
        color="purple"
        isLoading={isLoading}
      />
      <StatCard
        title="수동 작성"
        value={stats?.manualCount || 0}
        subtitle="어드민이 직접 작성한 설명"
        color="yellow"
        isLoading={isLoading}
      />
    </div>
  );
}