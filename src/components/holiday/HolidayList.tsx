'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { HolidayCard } from './HolidayCard';
import { enrichHolidaysWithTranslation } from '@/lib/holiday-translation';
import { useI18nContext } from '@/lib/i18n-context';

interface Holiday {
  id: string;
  name: string;
  date: string;
  country?: string;
  countryCode: string;
  type: string;
  global?: boolean;
}

interface HolidayListProps {
  holidays: Holiday[];
  country?: any;
  locale?: string;
  title?: string;
  showCountry?: boolean;
  showFilters?: boolean;
  className?: string;
  onHolidayClick?: (holiday: Holiday) => void;
}

/**
 * 휴일 목록을 표시하는 컴포넌트
 * 필터링, 정렬, 검색 기능을 포함합니다.
 */
export function HolidayList({ 
  holidays, 
  country,
  locale: propLocale,
  title,
  showCountry = false,
  showFilters = true,
  className = '',
  onHolidayClick 
}: HolidayListProps) {
  const { t, locale } = useTranslation();
  const { translations } = useI18nContext();

  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  // 번역된 휴일 데이터
  const enrichedHolidays = useMemo(() => {
    return enrichHolidaysWithTranslation(holidays, locale);
  }, [holidays, locale]);

  // 필터링 및 정렬된 휴일 목록
  const filteredAndSortedHolidays = useMemo(() => {
    let filtered = enrichedHolidays;

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(holiday => holiday.type === typeFilter);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(holiday => 
        (holiday.translatedName || holiday.name).toLowerCase().includes(query) ||
        holiday.name.toLowerCase().includes(query) ||
        (holiday.translatedCountry || holiday.countryCode).toLowerCase().includes(query)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        const nameA = (a.translatedName || a.name).toLowerCase();
        const nameB = (b.translatedName || b.name).toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });

    return filtered;
  }, [enrichedHolidays, typeFilter, searchQuery, sortBy]);

  // 사용 가능한 휴일 타입 목록
  const availableTypes = useMemo(() => {
    const types = new Set(holidays.map(h => h.type));
    return Array.from(types);
  }, [holidays]);

  // 휴일 타입 번역
  const translateType = (type: string) => {
    return translations?.holidays?.types?.[type] || type;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-500">
            {t('holidays.ui.totalHolidays')}: {filteredAndSortedHolidays.length}
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('actions.search')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('holidays.ui.searchHolidays', '휴일 검색...')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* 타입 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('holidays.ui.filterByType', '타입별 필터')}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">{t('common.all', '전체')}</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {translateType(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('holidays.ui.sortBy', '정렬 기준')}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="date">{t('time.date')}</option>
                <option value="name">{t('holidays.ui.name', '이름')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 휴일 목록 */}
      {filteredAndSortedHolidays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedHolidays.map((holiday) => (
            <HolidayCard
              key={holiday.id}
              holiday={holiday}
              showCountry={showCountry}
              onClick={onHolidayClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('holidays.ui.noHolidays')}
          </h3>
          <p className="text-gray-500">
            {searchQuery || typeFilter !== 'all' 
              ? t('holidays.ui.noMatchingHolidays', '검색 조건에 맞는 휴일이 없습니다.')
              : t('holidays.ui.noHolidaysAvailable', '표시할 휴일이 없습니다.')
            }
          </p>
          {(searchQuery || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('holidays.ui.clearFilters', '필터 초기화')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default HolidayList;