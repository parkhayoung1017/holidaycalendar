/**
 * 캐시 워밍 시스템
 * 
 * 인기 국가와 공휴일의 설명을 미리 로딩하여 초기 페이지 로딩 속도를 개선합니다.
 * 빌드 시점과 런타임에서 모두 사용 가능합니다.
 */

import { POPULAR_COUNTRIES, CURRENT_YEAR } from './constants';
import { loadHolidayData, getAllAvailableData } from './data-loader';
import { getHybridCache } from './hybrid-cache';
import { logInfo, logWarning, logError } from './error-logger';

export interface CacheWarmingOptions {
  maxCountries?: number;
  maxHolidaysPerCountry?: number;
  includeCurrentYear?: boolean;
  includeNextYear?: boolean;
  locales?: string[];
  timeoutMs?: number;
}

export interface CacheWarmingResult {
  success: boolean;
  countriesProcessed: number;
  holidaysProcessed: number;
  descriptionsFound: number;
  errors: string[];
  duration: number;
}

/**
 * 캐시 워밍 실행
 */
export async function warmCache(options: CacheWarmingOptions = {}): Promise<CacheWarmingResult> {
  const startTime = Date.now();
  const result: CacheWarmingResult = {
    success: false,
    countriesProcessed: 0,
    holidaysProcessed: 0,
    descriptionsFound: 0,
    errors: [],
    duration: 0
  };

  const {
    maxCountries = 10,
    maxHolidaysPerCountry = 20,
    includeCurrentYear = true,
    includeNextYear = false,
    locales = ['ko', 'en'],
    timeoutMs = 30000 // 30초 타임아웃
  } = options;

  try {
    logInfo('캐시 워밍 시작', { options });

    // 타임아웃 설정
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('캐시 워밍 타임아웃')), timeoutMs);
    });

    // 실제 워밍 작업
    const warmingPromise = performCacheWarming({
      maxCountries,
      maxHolidaysPerCountry,
      includeCurrentYear,
      includeNextYear,
      locales
    });

    // 타임아웃과 경쟁
    const warmingResult = await Promise.race([warmingPromise, timeoutPromise]);
    
    Object.assign(result, warmingResult);
    result.success = true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    result.errors.push(errorMessage);
    logError(error as Error, { operation: 'warmCache', options });
  } finally {
    result.duration = Date.now() - startTime;
    logInfo('캐시 워밍 완료', result);
  }

  return result;
}

/**
 * 실제 캐시 워밍 작업 수행
 */
async function performCacheWarming(options: Required<Omit<CacheWarmingOptions, 'timeoutMs'>>): Promise<Omit<CacheWarmingResult, 'success' | 'duration'>> {
  const result = {
    countriesProcessed: 0,
    holidaysProcessed: 0,
    descriptionsFound: 0,
    errors: []
  };

  try {
    // 사용 가능한 데이터 확인
    const availableData = await getAllAvailableData();
    
    // 인기 국가 중에서 실제 데이터가 있는 것들만 필터링
    const targetCountries = POPULAR_COUNTRIES
      .filter(country => availableData[country.code] && availableData[country.code].length > 0)
      .slice(0, options.maxCountries);

    logInfo(`캐시 워밍 대상 국가: ${targetCountries.length}개`, {
      countries: targetCountries.map(c => `${c.name}(${c.code})`)
    });

    // 각 국가별로 처리
    for (const country of targetCountries) {
      try {
        await warmCountryCache(country, availableData[country.code], options, result);
        result.countriesProcessed++;
      } catch (error) {
        const errorMessage = `${country.name} 캐시 워밍 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        result.errors.push(errorMessage);
        logWarning(errorMessage, { countryCode: country.code });
      }
    }

  } catch (error) {
    const errorMessage = `캐시 워밍 전체 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    result.errors.push(errorMessage);
    logError(error as Error, { operation: 'performCacheWarming' });
  }

  return result;
}

/**
 * 특정 국가의 캐시 워밍
 */
async function warmCountryCache(
  country: { code: string; name: string },
  availableYears: number[],
  options: Required<Omit<CacheWarmingOptions, 'timeoutMs'>>,
  result: Omit<CacheWarmingResult, 'success' | 'duration'>
): Promise<void> {
  const targetYears: number[] = [];

  // 현재 연도 포함
  if (options.includeCurrentYear && availableYears.includes(CURRENT_YEAR)) {
    targetYears.push(CURRENT_YEAR);
  }

  // 다음 연도 포함
  if (options.includeNextYear && availableYears.includes(CURRENT_YEAR + 1)) {
    targetYears.push(CURRENT_YEAR + 1);
  }

  // 대상 연도가 없으면 가장 최근 연도 사용
  if (targetYears.length === 0 && availableYears.length > 0) {
    targetYears.push(availableYears[0]); // 이미 정렬되어 있음 (최신순)
  }

  logInfo(`${country.name} 캐시 워밍 시작`, {
    countryCode: country.code,
    targetYears,
    locales: options.locales
  });

  // 각 연도별로 처리
  for (const year of targetYears) {
    for (const locale of options.locales) {
      try {
        await warmCountryYearCache(country, year, locale, options.maxHolidaysPerCountry, result);
      } catch (error) {
        const errorMessage = `${country.name} ${year}년 ${locale} 캐시 워밍 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        result.errors.push(errorMessage);
        logWarning(errorMessage, { countryCode: country.code, year, locale });
      }
    }
  }
}

/**
 * 특정 국가의 특정 연도 캐시 워밍
 */
async function warmCountryYearCache(
  country: { code: string; name: string },
  year: number,
  locale: string,
  maxHolidays: number,
  result: Omit<CacheWarmingResult, 'success' | 'duration'>
): Promise<void> {
  try {
    // 공휴일 데이터 로드 (이미 배치 처리가 적용됨)
    const holidays = await loadHolidayData(country.code, year, locale);
    
    if (holidays.length === 0) {
      logWarning(`${country.name} ${year}년 공휴일 데이터 없음`, {
        countryCode: country.code,
        year,
        locale
      });
      return;
    }

    // 최대 개수 제한
    const targetHolidays = holidays.slice(0, maxHolidays);
    
    // 설명이 있는 공휴일 개수 카운트
    const holidaysWithDescriptions = targetHolidays.filter(holiday => 
      holiday.description && holiday.description.trim().length > 0
    ).length;

    result.holidaysProcessed += targetHolidays.length;
    result.descriptionsFound += holidaysWithDescriptions;

    logInfo(`${country.name} ${year}년 ${locale} 캐시 워밍 완료`, {
      countryCode: country.code,
      year,
      locale,
      totalHolidays: targetHolidays.length,
      withDescriptions: holidaysWithDescriptions
    });

  } catch (error) {
    logError(error as Error, {
      operation: 'warmCountryYearCache',
      countryCode: country.code,
      year,
      locale
    });
    throw error;
  }
}

/**
 * 빠른 캐시 워밍 (핵심 데이터만)
 */
export async function quickWarmCache(): Promise<CacheWarmingResult> {
  return await warmCache({
    maxCountries: 5,
    maxHolidaysPerCountry: 10,
    includeCurrentYear: true,
    includeNextYear: false,
    locales: ['ko'],
    timeoutMs: 10000 // 10초
  });
}

/**
 * 전체 캐시 워밍 (모든 인기 국가)
 */
export async function fullWarmCache(): Promise<CacheWarmingResult> {
  return await warmCache({
    maxCountries: 20,
    maxHolidaysPerCountry: 50,
    includeCurrentYear: true,
    includeNextYear: true,
    locales: ['ko', 'en'],
    timeoutMs: 60000 // 60초
  });
}

/**
 * 캐시 상태 확인
 */
export async function getCacheWarmingStatus(): Promise<{
  isWarmed: boolean;
  lastWarmingTime: string | null;
  cacheStats: any;
}> {
  try {
    const { getCacheStatus } = await import('./hybrid-cache');
    const cacheStats = await getCacheStatus();
    
    // 캐시에 데이터가 있으면 워밍된 것으로 간주
    const isWarmed = cacheStats.local.totalEntries > 0 || 
                     cacheStats.hybrid.supabaseHits > 0 || 
                     cacheStats.hybrid.localHits > 0;

    return {
      isWarmed,
      lastWarmingTime: cacheStats.local.lastModified,
      cacheStats
    };
  } catch (error) {
    logError(error as Error, { operation: 'getCacheWarmingStatus' });
    return {
      isWarmed: false,
      lastWarmingTime: null,
      cacheStats: null
    };
  }
}

/**
 * 조건부 캐시 워밍 (필요한 경우에만)
 */
export async function conditionalWarmCache(): Promise<CacheWarmingResult | null> {
  try {
    const status = await getCacheWarmingStatus();
    
    // 이미 워밍되어 있으면 스킵
    if (status.isWarmed) {
      logInfo('캐시가 이미 워밍되어 있음, 스킵', status);
      return null;
    }

    // 빠른 워밍 실행
    logInfo('캐시가 비어있음, 빠른 워밍 실행');
    return await quickWarmCache();

  } catch (error) {
    logError(error as Error, { operation: 'conditionalWarmCache' });
    return null;
  }
}