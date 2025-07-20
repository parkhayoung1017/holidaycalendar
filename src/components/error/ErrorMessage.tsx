import React from 'react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  showRetry = false,
  onRetry,
  className = ''
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getBorderColor()} ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-700">
            {message}
          </p>
          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm bg-white px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 특정 에러 상황에 맞는 미리 정의된 에러 메시지들
export const ErrorMessages = {
  // 요구사항 6.3: 데이터 없음 에러
  DataNotAvailable: ({ year, country }: { year: number; country: string }) => (
    <ErrorMessage
      type="info"
      title="데이터 준비 중"
      message={`${country} ${year}년 공휴일 데이터를 준비 중입니다. 잠시 후 다시 확인해주세요.`}
    />
  ),

  // 요구사항 7.3: API 실패 에러
  ApiFailure: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorMessage
      type="warning"
      title="데이터 로딩 실패"
      message="공휴일 정보를 불러오는 중 문제가 발생했습니다. 캐시된 데이터를 사용하거나 다시 시도해주세요."
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  ),

  // 요구사항 8.3: AI 콘텐츠 생성 실패
  ContentGenerationFailure: () => (
    <ErrorMessage
      type="info"
      title="설명 생성 중"
      message="공휴일 설명을 생성하는 중입니다. 기본 설명을 표시하고 있으며, 곧 더 자세한 내용으로 업데이트됩니다."
    />
  ),

  // 일반적인 네트워크 에러
  NetworkError: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorMessage
      type="error"
      title="연결 오류"
      message="인터넷 연결을 확인하고 다시 시도해주세요."
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  ),

  // 검색 결과 없음
  NoSearchResults: ({ query }: { query: string }) => (
    <ErrorMessage
      type="info"
      title="검색 결과 없음"
      message={`"${query}"에 대한 검색 결과가 없습니다. 다른 검색어를 시도해보세요.`}
    />
  ),

  // 페이지 로딩 에러
  PageLoadError: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorMessage
      type="error"
      title="페이지 로딩 실패"
      message="페이지를 불러오는 중 오류가 발생했습니다."
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  )
};

// 에러 상황별 사용자 친화적 메시지 생성 함수
export function getErrorMessage(error: Error, context?: Record<string, any>): {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
} {
  const errorMessage = error.message.toLowerCase();

  // API 관련 에러
  if (errorMessage.includes('api') || errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return {
      title: '데이터 로딩 오류',
      message: '공휴일 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      type: 'warning'
    };
  }

  // 데이터 없음 에러
  if (errorMessage.includes('not found') || errorMessage.includes('no data')) {
    return {
      title: '데이터 없음',
      message: '요청하신 정보를 찾을 수 없습니다. 다른 국가나 연도를 선택해보세요.',
      type: 'info'
    };
  }

  // 권한 에러
  if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return {
      title: '접근 권한 오류',
      message: '해당 정보에 접근할 권한이 없습니다.',
      type: 'error'
    };
  }

  // 타임아웃 에러
  if (errorMessage.includes('timeout')) {
    return {
      title: '요청 시간 초과',
      message: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      type: 'warning'
    };
  }

  // 기본 에러 메시지
  return {
    title: '오류 발생',
    message: '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요.',
    type: 'error'
  };
}