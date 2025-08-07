'use client';

import React, { useEffect, useState } from 'react';

interface SystemStatusProps {
  isLoading?: boolean;
}

interface StatusItem {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  responseTime?: number;
}

export default function SystemStatus({ isLoading }: SystemStatusProps) {
  const [statusItems, setStatusItems] = useState<StatusItem[]>([
    {
      name: 'Supabase 연결',
      status: 'checking',
      message: '연결 상태 확인 중...',
    },
    {
      name: 'API 응답',
      status: 'checking',
      message: '응답 시간 측정 중...',
    },
    {
      name: '데이터베이스',
      status: 'checking',
      message: '데이터베이스 상태 확인 중...',
    },
  ]);

  useEffect(() => {
    if (isLoading) return;

    const checkSystemStatus = async () => {
      const updatedItems: StatusItem[] = [];

      // Supabase 연결 상태 확인
      try {
        const startTime = Date.now();
        const response = await fetch('/api/admin/dashboard/stats');
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          updatedItems.push({
            name: 'Supabase 연결',
            status: 'healthy',
            message: '정상 연결됨',
            responseTime,
          });

          updatedItems.push({
            name: 'API 응답',
            status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'error',
            message: `${responseTime}ms`,
            responseTime,
          });

          updatedItems.push({
            name: '데이터베이스',
            status: 'healthy',
            message: '정상 작동 중',
          });
        } else {
          updatedItems.push({
            name: 'Supabase 연결',
            status: 'error',
            message: '연결 실패',
          });

          updatedItems.push({
            name: 'API 응답',
            status: 'error',
            message: '응답 없음',
          });

          updatedItems.push({
            name: '데이터베이스',
            status: 'error',
            message: '연결 불가',
          });
        }
      } catch (error) {
        updatedItems.push({
          name: 'Supabase 연결',
          status: 'error',
          message: '네트워크 오류',
        });

        updatedItems.push({
          name: 'API 응답',
          status: 'error',
          message: '요청 실패',
        });

        updatedItems.push({
          name: '데이터베이스',
          status: 'error',
          message: '상태 불명',
        });
      }

      setStatusItems(updatedItems);
    };

    checkSystemStatus();
    
    // 30초마다 상태 확인
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          </div>
        );
      case 'warning':
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        );
      case 'checking':
        return (
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
        );
    }
  };

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">시스템 상태</h3>
        <p className="text-sm text-gray-500">실시간 시스템 모니터링</p>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {statusItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor(item.status)}`}>
                    {item.message}
                  </span>
                  {item.responseTime && (
                    <span className="text-xs text-gray-500">
                      ({item.responseTime}ms)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </p>
      </div>
    </div>
  );
}