'use client';

import { useState, useMemo } from 'react';
import { Holiday, Country, Region } from '@/types';
import { MONTH_NAMES } from '@/lib/constants';
import MonthFilter from './MonthFilter';
import CountryHolidayTable from './CountryHolidayTable';
import SameDateHolidayGroups from './SameDateHolidayGroups';

interface RegionalHolidayComparisonProps {
  region: Region;
  year: number;
  countriesData: Array<{
    country: Country;
    holidays: Holiday[];
  }>;
}

export default function RegionalHolidayComparison({
  year,
  countriesData
}: RegionalHolidayComparisonProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  // 월별 필터링된 데이터
  const filteredCountriesData = useMemo(() => {
    if (!selectedMonth) return countriesData;

    return countriesData.map(({ country, holidays }) => ({
      country,
      holidays: holidays.filter(holiday => {
        const holidayMonth = new Date(holiday.date).getMonth() + 1;
        return holidayMonth === selectedMonth;
      })
    }));
  }, [countriesData, selectedMonth]);

  // 같은 날짜 공휴일 그룹화
  const sameDateGroups = useMemo(() => {
    const dateGroups: Record<string, Array<{ country: Country; holiday: Holiday }>> = {};

    filteredCountriesData.forEach(({ country, holidays }) => {
      holidays.forEach(holiday => {
        if (!dateGroups[holiday.date]) {
          dateGroups[holiday.date] = [];
        }
        dateGroups[holiday.date].push({ country, holiday });
      });
    });

    // 2개 이상의 국가에서 같은 날짜에 공휴일인 경우만 반환
    return Object.entries(dateGroups)
      .filter(([, group]) => group.length > 1)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [filteredCountriesData]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalHolidays = filteredCountriesData.reduce(
      (sum, { holidays }) => sum + holidays.length, 
      0
    );
    const countriesWithData = filteredCountriesData.filter(
      ({ holidays }) => holidays.length > 0
    ).length;

    return {
      totalHolidays,
      countriesWithData,
      sameDateCount: sameDateGroups.length
    };
  }, [filteredCountriesData, sameDateGroups]);

  return (
    <div className="space-y-6">
      {/* 통계 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 통계 정보 */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                총 <span className="font-semibold text-gray-900">{stats.totalHolidays}</span>개 공휴일
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{stats.countriesWithData}</span>개 국가
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{stats.sameDateCount}</span>개 공통 날짜
              </span>
            </div>
          </div>

          {/* 보기 모드 전환 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">보기:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                국가별 테이블
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                날짜별 그룹
              </button>
            </div>
          </div>
        </div>

        {/* 월별 필터 */}
        <div className="mt-6">
          <MonthFilter
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            year={year}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {viewMode === 'table' ? (
        <CountryHolidayTable
          countriesData={filteredCountriesData}
          selectedMonth={selectedMonth}
        />
      ) : (
        <SameDateHolidayGroups
          sameDateGroups={sameDateGroups}
          selectedMonth={selectedMonth}
        />
      )}

      {/* 데이터가 없는 경우 */}
      {stats.totalHolidays === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {selectedMonth ? `${MONTH_NAMES.ko[selectedMonth - 1]} 공휴일이 없습니다` : '공휴일 데이터가 없습니다'}
          </h3>
          <p className="text-gray-500">
            {selectedMonth 
              ? '다른 월을 선택해보세요.' 
              : '해당 지역의 공휴일 데이터를 준비 중입니다.'
            }
          </p>
        </div>
      )}
    </div>
  );
}