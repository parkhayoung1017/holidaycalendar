'use client';

import { Holiday } from '@/types';
import { HOLIDAY_TYPE_LABELS } from '@/lib/constants';
import Link from 'next/link';

interface HolidayWithCountryInfo extends Holiday {
  countryName: string;
  countryFlag: string;
}

interface TodayHolidaysViewProps {
  holidays: HolidayWithCountryInfo[];
  date: string;
}

export default function TodayHolidaysView({ holidays, date }: TodayHolidaysViewProps) {
  // 날짜를 한국어 형식으로 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 공휴일을 국가별로 그룹화
  const holidaysByCountry = holidays.reduce((acc, holiday) => {
    const key = holiday.countryCode;
    if (!acc[key]) {
      acc[key] = {
        countryCode: holiday.countryCode,
        countryName: holiday.countryName,
        countryFlag: holiday.countryFlag,
        holidays: []
      };
    }
    acc[key].holidays.push(holiday);
    return acc;
  }, {} as Record<string, {
    countryCode: string;
    countryName: string;
    countryFlag: string;
    holidays: HolidayWithCountryInfo[];
  }>);

  const countryGroups = Object.values(holidaysByCountry);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          오늘의 공휴일
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          {formatDate(date)}
        </p>
        <div className="w-24 h-1 bg-blue-500 mx-auto rounded"></div>
      </div>

      {/* 공휴일 목록 또는 빈 상태 메시지 */}
      {countryGroups.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              오늘은 <span className="font-semibold text-blue-600">{countryGroups.length}개 국가</span>에서 
              <span className="font-semibold text-blue-600"> {holidays.length}개의 공휴일</span>이 있습니다.
            </p>
          </div>

          {/* 국가별 공휴일 카드 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countryGroups.map((group) => (
              <div
                key={group.countryCode}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
              >
                {/* 국가 헤더 */}
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{group.countryFlag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.countryName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {group.holidays.length}개의 공휴일
                    </p>
                  </div>
                </div>

                {/* 공휴일 목록 */}
                <div className="space-y-3">
                  {group.holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">
                        {holiday.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {HOLIDAY_TYPE_LABELS[holiday.type]}
                        </span>
                        {holiday.global && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            전국
                          </span>
                        )}
                      </div>
                      {holiday.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* 국가 페이지 링크 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/${group.countryCode.toLowerCase()}-${new Date().getFullYear()}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                  >
                    {group.countryName} 전체 공휴일 보기
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 공휴일이 없는 경우 */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            오늘은 공휴일인 국가가 없습니다
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            오늘 {formatDate(date)}은 저희가 지원하는 국가 중 공휴일로 지정된 곳이 없습니다.
          </p>
          
          {/* 다른 페이지로 이동하는 링크들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              홈페이지로 이동
            </Link>
            <Link
              href="/regions"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              지역별 공휴일 보기
            </Link>
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">알아두세요</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 공휴일 정보는 매일 자동으로 업데이트됩니다</li>
              <li>• 지역별 공휴일은 해당 지역에서만 적용될 수 있습니다</li>
              <li>• 정확한 공휴일 정보는 해당 국가의 공식 발표를 확인해주세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}