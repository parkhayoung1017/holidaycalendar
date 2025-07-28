'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = params?.locale as string || 'ko';
  const isKorean = locale === 'ko';

  useEffect(() => {
    console.error('Locale error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 에러 아이콘 */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-red-300 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isKorean ? '문제가 발생했습니다' : 'Something went wrong'}
          </h1>
          <p className="text-gray-600">
            {isKorean 
              ? '페이지를 로드하는 중 오류가 발생했습니다.'
              : 'An error occurred while loading the page.'
            }
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isKorean ? '다시 시도' : 'Try Again'}
          </button>
          
          <Link
            href={`/${locale}`}
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isKorean ? '홈페이지로 이동' : 'Go to Homepage'}
          </Link>
          
          <Link
            href={`/${locale}/today`}
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isKorean ? '오늘의 공휴일' : "Today's Holidays"}
          </Link>
        </div>

        {/* 에러 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              {isKorean ? '개발 정보:' : 'Development Info:'}
            </h3>
            <pre className="text-xs text-red-700 overflow-auto">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}