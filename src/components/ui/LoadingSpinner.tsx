'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
  progress?: number;
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  showProgress = false, 
  progress = 0,
  message,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* 메인 스피너 */}
      <div className="relative">
        <svg 
          className={`${sizeClasses[size]} animate-spin text-blue-500`}
          fill="none" 
          viewBox="0 0 24 24"
        >
          {/* 배경 원 */}
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="2"
            className="opacity-20"
          />
          {/* 회전하는 호 */}
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        
        {/* 진행률 표시 */}
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* 선택적 메시지 표시 (기본적으로는 숨김) */}
      {message && (
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">{message}</p>
          {showProgress && (
            <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 펄스 효과 */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

// 전체 화면 로딩 오버레이 컴포넌트
export function LoadingOverlay({ 
  isVisible = true, 
  message,
  showProgress = false,
  progress = 0 
}: {
  isVisible?: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        <LoadingSpinner 
          size="lg" 
          message={message}
          showProgress={showProgress}
          progress={progress}
        />
        
        {/* 추가 정보 - 깔끔하게 최소화 */}
        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-1">
            <span className="text-lg">🌍</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 인라인 로딩 컴포넌트 (페이지 내부용)
export function InlineLoading({ 
  message,
  className = 'py-12'
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoadingSpinner size="md" message={message} />
    </div>
  );
}

// 스켈레톤 로딩 컴포넌트
export function SkeletonLoader({ 
  lines = 3,
  className = ''
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="mb-4">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}