'use client';

import { Holiday, Country } from '@/types';
import { MONTH_NAMES } from '@/lib/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CountryFlag from '@/components/ui/CountryFlag';

interface SameDateHolidayGroupsProps {
  sameDateGroups: Array<[string, Array<{ country: Country; holiday: Holiday }>]>;
  selectedMonth: number | null;
}

export default function SameDateHolidayGroups({ 
  sameDateGroups, 
  selectedMonth 
}: SameDateHolidayGroupsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            같은 날짜 공휴일 그룹
            {selectedMonth && (
              <span className="text-base font-normal text-gray-600 ml-2">
                - {MONTH_NAMES.ko[selectedMonth - 1]}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            여러 국가에서 같은 날짜에 공휴일인 경우를 보여줍니다.
          </p>
        </div>

        <div className="p-6">
          {sameDateGroups.length > 0 ? (
            <div className="space-y-6">
              {sameDateGroups.map(([date, group]) => (
                <div key={date} className="border rounded-lg p-4 bg-gray-50">
                  {/* 날짜 헤더 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                      <span className="text-blue-600 font-bold text-sm">
                        {format(new Date(date), 'd', { locale: ko })}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {format(new Date(date), 'M월 d일', { locale: ko })}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(date), 'EEEE', { locale: ko })} • {group.length}개 국가
                      </p>
                    </div>
                  </div>

                  {/* 국가별 공휴일 목록 */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map(({ country, holiday }, index) => (
                      <div
                        key={`${country.code}-${index}`}
                        className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const slug = holiday.name.toLowerCase()
                            .replace(/[^a-z0-9\s]/g, '')
                            .replace(/\s+/g, '-');
                          window.location.href = `/holiday/${holiday.countryCode.toLowerCase()}/${slug}`;
                        }}
                        title={`${holiday.name} - 클릭하여 상세보기`}
                      >
                        <div className="flex items-start gap-3">
                          <CountryFlag countryCode={country.code} size="lg" className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {country.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 break-words">
                              {holiday.name}
                            </p>
                            {holiday.description && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {holiday.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                holiday.type === 'public' 
                                  ? 'bg-green-100 text-green-800'
                                  : holiday.type === 'bank'
                                  ? 'bg-blue-100 text-blue-800'
                                  : holiday.type === 'school'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {holiday.type === 'public' && '공휴일'}
                                {holiday.type === 'bank' && '은행휴무'}
                                {holiday.type === 'school' && '학교휴무'}
                                {holiday.type === 'optional' && '선택휴무'}
                              </span>
                              {holiday.global && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  전국
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 공통 특징 분석 */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-1">
                      공통 특징
                    </h5>
                    <div className="text-xs text-blue-700 space-y-1">
                      {(() => {
                        const holidayNames = group.map(g => g.holiday.name.toLowerCase());
                        const commonKeywords = ['new year', 'christmas', 'easter', 'labor', 'independence'];
                        const foundKeywords = commonKeywords.filter(keyword => 
                          holidayNames.some(name => name.includes(keyword))
                        );
                        
                        if (foundKeywords.length > 0) {
                          return (
                            <p>
                              {foundKeywords.includes('new year') && '신정 관련 공휴일'}
                              {foundKeywords.includes('christmas') && '크리스마스 관련 공휴일'}
                              {foundKeywords.includes('easter') && '부활절 관련 공휴일'}
                              {foundKeywords.includes('labor') && '노동절 관련 공휴일'}
                              {foundKeywords.includes('independence') && '독립기념일 관련 공휴일'}
                            </p>
                          );
                        }
                        
                        return <p>여러 국가에서 동시에 기념하는 날입니다.</p>;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                같은 날짜 공휴일이 없습니다
              </h3>
              <p className="text-gray-500">
                {selectedMonth 
                  ? `${MONTH_NAMES.ko[selectedMonth - 1]}에는 여러 국가가 공통으로 기념하는 공휴일이 없습니다.`
                  : '이 지역의 국가들이 공통으로 기념하는 공휴일이 없습니다.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}