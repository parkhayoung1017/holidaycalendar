'use client';

import { Holiday, Country } from '@/types';
import { MONTH_NAMES } from '@/lib/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CountryHolidayTableProps {
  countriesData: Array<{
    country: Country;
    holidays: Holiday[];
  }>;
  selectedMonth: number | null;
}

export default function CountryHolidayTable({ 
  countriesData, 
  selectedMonth 
}: CountryHolidayTableProps) {
  // 날짜별로 정렬된 모든 공휴일 목록 생성
  const allHolidays = countriesData
    .flatMap(({ country, holidays }) => 
      holidays.map(holiday => ({ ...holiday, country }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // 고유한 날짜 목록 생성
  const uniqueDates = Array.from(
    new Set(allHolidays.map(h => h.date))
  ).sort();

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          국가별 공휴일 비교
          {selectedMonth && (
            <span className="text-base font-normal text-gray-600 ml-2">
              - {MONTH_NAMES.ko[selectedMonth - 1]}
            </span>
          )}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                날짜
              </th>
              {countriesData.map(({ country }) => (
                <th
                  key={country.code}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {uniqueDates.map((date, index) => {
              const holidaysOnDate = allHolidays.filter(h => h.date === date);
              
              return (
                <tr key={date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {format(new Date(date), 'M월 d일', { locale: ko })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(date), 'EEEE', { locale: ko })}
                      </span>
                    </div>
                  </td>
                  {countriesData.map(({ country }) => {
                    const countryHolidays = holidaysOnDate.filter(
                      h => h.country.code === country.code
                    );
                    
                    return (
                      <td key={country.code} className="px-4 py-4 text-center">
                        {countryHolidays.length > 0 ? (
                          <div className="space-y-1">
                            {countryHolidays.map((holiday, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium hover:bg-blue-200 cursor-pointer transition-colors"
                                title={`${holiday.name} - 클릭하여 상세보기`}
                                onClick={() => {
                                  const slug = holiday.name.toLowerCase()
                                    .replace(/[^a-z0-9\s]/g, '')
                                    .replace(/\s+/g, '-');
                                  window.location.href = `/holiday/${holiday.countryCode.toLowerCase()}/${slug}`;
                                }}
                              >
                                {holiday.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {uniqueDates.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">
            {selectedMonth 
              ? `${MONTH_NAMES.ko[selectedMonth - 1]}에는 공휴일이 없습니다.`
              : '공휴일 데이터가 없습니다.'
            }
          </p>
        </div>
      )}
    </div>
  );
}