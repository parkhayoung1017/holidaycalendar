'use client';

import Link from 'next/link';
import { Locale } from '@/types/i18n';

interface HolidayPreparationMessageProps {
  locale: Locale;
  holidayName?: string;
  countryName?: string;
  className?: string;
}

export default function HolidayPreparationMessage({ 
  locale, 
  holidayName, 
  countryName,
  className = "" 
}: HolidayPreparationMessageProps) {
  const isKorean = locale === 'ko';

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8">
            <svg 
              className="w-12 h-12 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
          </div>

          {/* 제목 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isKorean ? '공휴일 정보 준비중' : 'Holiday Information Coming Soon'}
          </h1>

          {/* 설명 */}
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-lg text-gray-600 mb-4">
              {holidayName && countryName ? (
                isKorean ? (
                  <>
                    <span className="font-medium text-gray-800">{countryName}</span>의{' '}
                    <span className="font-medium text-gray-800">{holidayName}</span>에 대한 
                    상세한 정보를 준비하고 있습니다.
                  </>
                ) : (
                  <>
                    We are preparing detailed information about{' '}
                    <span className="font-medium text-gray-800">{holidayName}</span> in{' '}
                    <span className="font-medium text-gray-800">{countryName}</span>.
                  </>
                )
              ) : (
                isKorean ? 
                  '요청하신 공휴일에 대한 상세한 정보를 준비하고 있습니다.' :
                  'We are preparing detailed information about the requested holiday.'
              )}
            </p>
            <p className="text-gray-500">
              {isKorean ? 
                '곧 더 풍부한 내용으로 찾아뵙겠습니다. 양해 부탁드립니다.' :
                'We will be back with richer content soon. Thank you for your patience.'
              }
            </p>
          </div>

          {/* 대안 링크들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={`/${locale}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isKorean ? '홈페이지로 돌아가기' : 'Back to Home'}
            </Link>
            <Link
              href={`/${locale}/today`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {isKorean ? '오늘의 공휴일 보기' : "View Today's Holidays"}
            </Link>
            <Link
              href={`/${locale}/regions`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {isKorean ? '지역별 공휴일 보기' : 'View Regional Holidays'}
            </Link>
          </div>

          {/* 추가 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {isKorean ? '알려드립니다' : 'Please Note'}
            </h3>
            <p className="text-blue-800 text-sm">
              {isKorean ? (
                <>
                  저희는 전세계 200개 이상 국가의 공휴일 정보를 지속적으로 업데이트하고 있습니다. 
                  일부 공휴일의 상세 정보는 순차적으로 추가되고 있으니, 
                  정기적으로 방문해 주시면 더 많은 정보를 확인하실 수 있습니다.
                </>
              ) : (
                <>
                  We are continuously updating holiday information for over 200 countries worldwide. 
                  Detailed information for some holidays is being added gradually, 
                  so please visit regularly to access more comprehensive content.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}