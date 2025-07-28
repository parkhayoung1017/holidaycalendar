/**
 * 번역 데이터 로더
 * 언어별 번역 파일을 동적으로 로드하고 캐싱합니다.
 */

import { Locale } from '@/types/i18n';

// 번역 데이터 캐시 (메모리 캐시)
const translationCache = new Map<string, any>();

// 로딩 중인 번역 파일들을 추적하여 중복 로딩 방지
const loadingPromises = new Map<string, Promise<any>>();

// 캐시 만료 시간 (밀리초) - 개발 환경에서는 짧게, 프로덕션에서는 길게
const CACHE_EXPIRY_TIME = process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5분 vs 1시간

// 캐시 엔트리 인터페이스
interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// 향상된 캐시 맵
const enhancedCache = new Map<string, CacheEntry>();

// 캐시 통계
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  totalRequests: 0
};

/**
 * 향상된 캐시에서 데이터를 가져옵니다
 * @param cacheKey 캐시 키
 * @returns 캐시된 데이터 또는 null
 */
function getFromEnhancedCache(cacheKey: string): any | null {
  cacheStats.totalRequests++;
  
  const entry = enhancedCache.get(cacheKey);
  if (!entry) {
    cacheStats.misses++;
    return null;
  }

  // 캐시 만료 확인
  const now = Date.now();
  if (now - entry.timestamp > CACHE_EXPIRY_TIME) {
    enhancedCache.delete(cacheKey);
    cacheStats.evictions++;
    cacheStats.misses++;
    return null;
  }

  // 캐시 히트 - 접근 정보 업데이트
  entry.accessCount++;
  entry.lastAccessed = now;
  cacheStats.hits++;
  
  return entry.data;
}

/**
 * 향상된 캐시에 데이터를 저장합니다
 * @param cacheKey 캐시 키
 * @param data 저장할 데이터
 */
function setToEnhancedCache(cacheKey: string, data: any): void {
  const now = Date.now();
  
  enhancedCache.set(cacheKey, {
    data,
    timestamp: now,
    accessCount: 1,
    lastAccessed: now
  });

  // 캐시 크기 제한 (LRU 방식으로 정리)
  if (enhancedCache.size > 100) { // 최대 100개 엔트리
    cleanupCache();
  }
}

/**
 * LRU 방식으로 캐시를 정리합니다
 */
function cleanupCache(): void {
  const entries = Array.from(enhancedCache.entries());
  
  // 마지막 접근 시간 기준으로 정렬 (오래된 것부터)
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // 가장 오래된 20% 제거
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    enhancedCache.delete(entries[i][0]);
    cacheStats.evictions++;
  }
}

/**
 * 단일 네임스페이스 번역 데이터를 로드합니다 (성능 최적화)
 * @param locale 언어 코드
 * @param namespace 네임스페이스 (common, countries, holidays, navigation)
 * @returns 번역 데이터
 */
export async function loadTranslation(
  locale: Locale,
  namespace: string
): Promise<any> {
  const cacheKey = `${locale}-${namespace}`;
  
  // 1. 향상된 메모리 캐시에서 확인
  const cachedData = getFromEnhancedCache(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  // 2. 클라이언트 캐시에서 확인 (브라우저 환경에서만)
  const clientCachedData = getFromClientCache(cacheKey);
  if (clientCachedData !== null) {
    // 클라이언트 캐시에서 가져온 데이터를 메모리 캐시에도 저장
    setToEnhancedCache(cacheKey, clientCachedData);
    translationCache.set(cacheKey, clientCachedData);
    return clientCachedData;
  }

  // 3. 이미 로딩 중인지 확인 (중복 로딩 방지)
  if (loadingPromises.has(cacheKey)) {
    return await loadingPromises.get(cacheKey)!;
  }

  // 4. 새로 로딩
  const loadingPromise = (async () => {
    try {
      const module = await import(`@/locales/${locale}/${namespace}.json`);
      const translations = module.default || module;

      // 모든 캐시에 저장
      setToEnhancedCache(cacheKey, translations);
      translationCache.set(cacheKey, translations);
      setToClientCache(cacheKey, translations);
      
      return translations;

    } catch (error) {
      console.warn(`번역 파일 로드 실패: ${locale}/${namespace}`, error);
      
      // 기본 언어로 fallback
      if (locale !== 'ko') {
        return loadTranslation('ko', namespace);
      }
      
      return {};
    } finally {
      // 로딩 완료 후 프로미스 제거
      loadingPromises.delete(cacheKey);
    }
  })();

  // 로딩 프로미스 저장
  loadingPromises.set(cacheKey, loadingPromise);
  
  return await loadingPromise;
}

/**
 * 여러 네임스페이스 번역 데이터를 로드합니다 (성능 최적화)
 * @param locale 언어 코드
 * @param namespaces 네임스페이스 배열 또는 단일 네임스페이스
 * @returns 번역 데이터
 */
export async function loadTranslations(
  locale: Locale,
  namespaces?: string | string[]
): Promise<any> {
  // 단일 네임스페이스인 경우
  if (typeof namespaces === 'string') {
    return await loadTranslation(locale, namespaces);
  }

  // 배열인 경우
  if (Array.isArray(namespaces)) {
    const cacheKey = `${locale}-${namespaces.sort().join(',')}`;
    
    // 1. 향상된 메모리 캐시에서 확인
    const cachedData = getFromEnhancedCache(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // 2. 클라이언트 캐시에서 확인 (브라우저 환경에서만)
    const clientCachedData = getFromClientCache(cacheKey);
    if (clientCachedData !== null) {
      // 클라이언트 캐시에서 가져온 데이터를 메모리 캐시에도 저장
      setToEnhancedCache(cacheKey, clientCachedData);
      translationCache.set(cacheKey, clientCachedData);
      return clientCachedData;
    }

    // 3. 이미 로딩 중인지 확인
    if (loadingPromises.has(cacheKey)) {
      return await loadingPromises.get(cacheKey)!;
    }

    const loadingPromise = (async () => {
      try {
        const translations: any = {};
        
        // 병렬로 로드하여 성능 향상
        const loadPromises = namespaces.map(async (namespace) => {
          const data = await loadTranslation(locale, namespace);
          return { namespace, data };
        });

        const results = await Promise.all(loadPromises);
        
        results.forEach(({ namespace, data }) => {
          translations[namespace] = data;
        });

        // 모든 캐시에 저장
        setToEnhancedCache(cacheKey, translations);
        translationCache.set(cacheKey, translations);
        setToClientCache(cacheKey, translations);
        
        return translations;
      } finally {
        loadingPromises.delete(cacheKey);
      }
    })();

    loadingPromises.set(cacheKey, loadingPromise);
    return await loadingPromise;
  }

  // 모든 네임스페이스 로드
  const cacheKey = `${locale}-all`;
  
  // 1. 향상된 메모리 캐시에서 확인
  const cachedData = getFromEnhancedCache(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  // 2. 클라이언트 캐시에서 확인 (브라우저 환경에서만)
  const clientCachedData = getFromClientCache(cacheKey);
  if (clientCachedData !== null) {
    // 클라이언트 캐시에서 가져온 데이터를 메모리 캐시에도 저장
    setToEnhancedCache(cacheKey, clientCachedData);
    translationCache.set(cacheKey, clientCachedData);
    return clientCachedData;
  }

  // 3. 이미 로딩 중인지 확인
  if (loadingPromises.has(cacheKey)) {
    return await loadingPromises.get(cacheKey)!;
  }

  const loadingPromise = (async () => {
    try {
      // 병렬로 모든 네임스페이스 로드
      const [common, countries, holidays, navigation] = await Promise.all([
        loadTranslation(locale, 'common'),
        loadTranslation(locale, 'countries'),
        loadTranslation(locale, 'holidays'),
        loadTranslation(locale, 'navigation')
      ]);

      const translations = {
        common,
        countries,
        holidays,
        navigation
      };

      // 모든 캐시에 저장
      setToEnhancedCache(cacheKey, translations);
      translationCache.set(cacheKey, translations);
      setToClientCache(cacheKey, translations);
      
      return translations;

    } catch (error) {
      console.warn(`번역 파일 로드 실패: ${locale}/all`, error);
      
      // 기본 언어로 fallback
      if (locale !== 'ko') {
        return loadTranslations('ko', namespaces);
      }
      
      return {};
    } finally {
      loadingPromises.delete(cacheKey);
    }
  })();

  loadingPromises.set(cacheKey, loadingPromise);
  return await loadingPromise;
}

/**
 * 서버 사이드에서 번역 데이터를 동기적으로 로드합니다
 * @param locale 언어 코드
 * @param namespace 네임스페이스
 * @returns 번역 데이터
 */
export function loadTranslationsSync(
  locale: Locale,
  namespace?: string
): any {
  const cacheKey = `${locale}-${namespace || 'all'}`;
  
  // 캐시에서 확인
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    let translations: any = {};

    if (namespace) {
      // 특정 네임스페이스만 로드
      translations = require(`@/locales/${locale}/${namespace}.json`);
    } else {
      // 모든 네임스페이스 로드
      try {
        translations = {
          common: require(`@/locales/${locale}/common.json`),
          countries: require(`@/locales/${locale}/countries.json`),
          holidays: require(`@/locales/${locale}/holidays.json`),
          navigation: require(`@/locales/${locale}/navigation.json`)
        };
      } catch (error) {
        console.warn(`일부 번역 파일 로드 실패: ${locale}`, error);
        // 개별적으로 로드 시도
        translations = {
          common: safeRequire(`@/locales/${locale}/common.json`),
          countries: safeRequire(`@/locales/${locale}/countries.json`),
          holidays: safeRequire(`@/locales/${locale}/holidays.json`),
          navigation: safeRequire(`@/locales/${locale}/navigation.json`)
        };
      }
    }

    // 캐시에 저장
    translationCache.set(cacheKey, translations);
    return translations;

  } catch (error) {
    console.warn(`번역 파일 로드 실패: ${locale}/${namespace}`, error);
    
    // 기본 언어로 fallback
    if (locale !== 'ko') {
      return loadTranslationsSync('ko', namespace);
    }
    
    return {};
  }
}

/**
 * 안전하게 require를 실행합니다
 * @param path 파일 경로
 * @returns 로드된 데이터 또는 빈 객체
 */
function safeRequire(path: string): any {
  try {
    return require(path);
  } catch (error) {
    return {};
  }
}

/**
 * 번역 캐시를 초기화합니다 (향상된 캐시 시스템)
 * @param locale 특정 언어만 클리어할 경우 언어 코드
 * @param namespace 특정 네임스페이스만 클리어할 경우 네임스페이스
 */
export function clearTranslationCache(locale?: Locale, namespace?: string): void {
  if (locale && namespace) {
    // 특정 언어의 특정 네임스페이스만 클리어
    const cacheKey = `${locale}-${namespace}`;
    enhancedCache.delete(cacheKey);
    translationCache.delete(cacheKey);
    cacheStats.evictions++;
  } else if (locale) {
    // 특정 언어의 모든 캐시 클리어
    const keysToDelete = Array.from(enhancedCache.keys())
      .filter(key => key.startsWith(`${locale}-`));
    
    keysToDelete.forEach(key => {
      enhancedCache.delete(key);
      translationCache.delete(key);
      cacheStats.evictions++;
    });
  } else {
    // 전체 캐시 클리어
    enhancedCache.clear();
    translationCache.clear();
    cacheStats.evictions += enhancedCache.size;
  }
}

/**
 * 특정 언어의 번역 캐시를 제거합니다
 * @param locale 언어 코드
 */
export function clearLocaleCache(locale: Locale): void {
  clearTranslationCache(locale);
}

/**
 * 향상된 캐시 정보를 반환합니다
 * @returns 캐시 크기, 키 목록, 통계 정보
 */
export function getCacheInfo(): { 
  size: number; 
  keys: string[];
  stats: CacheStats;
  hitRate: number;
  entries: Array<{
    key: string;
    accessCount: number;
    lastAccessed: Date;
    age: number;
  }>;
} {
  const entries = Array.from(enhancedCache.entries()).map(([key, entry]) => ({
    key,
    accessCount: entry.accessCount,
    lastAccessed: new Date(entry.lastAccessed),
    age: Date.now() - entry.timestamp
  }));

  const hitRate = cacheStats.totalRequests > 0 
    ? (cacheStats.hits / cacheStats.totalRequests) * 100 
    : 0;

  return {
    size: enhancedCache.size,
    keys: Array.from(enhancedCache.keys()),
    stats: { ...cacheStats },
    hitRate: Math.round(hitRate * 100) / 100,
    entries: entries.sort((a, b) => b.accessCount - a.accessCount)
  };
}

/**
 * 캐시 통계를 리셋합니다
 */
export function resetCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
  cacheStats.totalRequests = 0;
}

/**
 * 캐시 성능을 최적화합니다
 * - 오래된 엔트리 제거
 * - 사용 빈도가 낮은 엔트리 제거
 */
export function optimizeCache(): void {
  const now = Date.now();
  const entries = Array.from(enhancedCache.entries());
  
  // 만료된 엔트리 제거
  const expiredKeys = entries
    .filter(([_, entry]) => now - entry.timestamp > CACHE_EXPIRY_TIME)
    .map(([key]) => key);
  
  expiredKeys.forEach(key => {
    enhancedCache.delete(key);
    translationCache.delete(key);
    cacheStats.evictions++;
  });

  // 사용 빈도가 낮은 엔트리 제거 (캐시 크기가 80개를 초과할 때)
  if (enhancedCache.size > 80) {
    const sortedEntries = Array.from(enhancedCache.entries())
      .sort((a, b) => {
        // 접근 빈도와 최근 접근 시간을 고려한 점수 계산
        const scoreA = a[1].accessCount * (1 + (now - a[1].lastAccessed) / 1000000);
        const scoreB = b[1].accessCount * (1 + (now - b[1].lastAccessed) / 1000000);
        return scoreA - scoreB;
      });

    const toRemove = Math.floor(enhancedCache.size * 0.3); // 30% 제거
    for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
      const key = sortedEntries[i][0];
      enhancedCache.delete(key);
      translationCache.delete(key);
      cacheStats.evictions++;
    }
  }
}

/**
 * 번역 데이터를 미리 로드합니다 (성능 최적화)
 * @param locales 로드할 언어 목록
 */
export async function preloadTranslations(locales: Locale[]): Promise<void> {
  const loadPromises = locales.map(locale => 
    loadTranslations(locale).catch(error => 
      console.warn(`번역 미리 로드 실패: ${locale}`, error)
    )
  );

  await Promise.all(loadPromises);
}

/**
 * 번역 키가 존재하는지 확인합니다
 * @param locale 언어 코드
 * @param key 번역 키 (점으로 구분된 경로)
 * @param namespace 네임스페이스
 * @returns 키 존재 여부
 */
export async function hasTranslationKey(
  locale: Locale,
  key: string,
  namespace?: string
): Promise<boolean> {
  const translations = await loadTranslations(locale, namespace);
  return getNestedValue(translations, key) !== undefined;
}

/**
 * 중첩된 객체에서 값을 가져옵니다
 * @param obj 객체
 * @param key 점으로 구분된 키
 * @returns 값 또는 undefined
 */
function getNestedValue(obj: any, key: string): any {
  if (!obj || !key) return undefined;

  const keys = key.split('.');
  let current = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }

  return current;
}
/**

 * 서버 컴포넌트에서 사용할 번역 함수를 생성합니다
 * @param locale 언어 코드
 * @returns 번역 함수
 */
export async function getTranslations(locale: Locale) {
  const translations = await loadTranslations(locale);
  
  return (key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key);
    return value || fallback || key;
  };
}/**

 * 번역 함수를 생성합니다
 * @param locale 언어 코드
 * @param translations 번역 데이터
 * @returns 번역 함수 객체
 */
export function createTranslationFunction(locale: Locale, translations: any) {
  const t = (key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key);
    return value || fallback || key;
  };

  return { t, locale };
}

// ============================================================================
// 클라이언트 사이드 캐싱 시스템
// ============================================================================

// 클라이언트 캐시 설정
const CLIENT_CACHE_CONFIG = {
  localStorage: {
    enabled: true,
    keyPrefix: 'translation_cache_',
    maxSize: 5 * 1024 * 1024, // 5MB
    expiry: 24 * 60 * 60 * 1000, // 24시간
  },
  sessionStorage: {
    enabled: true,
    keyPrefix: 'translation_session_',
    maxSize: 2 * 1024 * 1024, // 2MB
    expiry: 60 * 60 * 1000, // 1시간
  }
};

// 클라이언트 캐시 엔트리 인터페이스
interface ClientCacheEntry {
  data: any;
  timestamp: number;
  version: string;
  size: number;
}

/**
 * 브라우저 환경인지 확인합니다
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * 데이터 크기를 계산합니다 (대략적)
 */
function calculateDataSize(data: any): number {
  return JSON.stringify(data).length * 2; // UTF-16 기준 대략적 계산
}

/**
 * localStorage에서 번역 데이터를 가져옵니다
 */
function getFromLocalStorage(cacheKey: string): any | null {
  if (!isBrowser() || !CLIENT_CACHE_CONFIG.localStorage.enabled) {
    return null;
  }

  try {
    const key = CLIENT_CACHE_CONFIG.localStorage.keyPrefix + cacheKey;
    const cached = localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const entry: ClientCacheEntry = JSON.parse(cached);
    const now = Date.now();

    // 만료 확인
    if (now - entry.timestamp > CLIENT_CACHE_CONFIG.localStorage.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('localStorage에서 번역 데이터 로드 실패:', error);
    return null;
  }
}

/**
 * localStorage에 번역 데이터를 저장합니다
 */
function setToLocalStorage(cacheKey: string, data: any): void {
  if (!isBrowser() || !CLIENT_CACHE_CONFIG.localStorage.enabled) {
    return;
  }

  try {
    const key = CLIENT_CACHE_CONFIG.localStorage.keyPrefix + cacheKey;
    const size = calculateDataSize(data);
    
    // 크기 제한 확인
    if (size > CLIENT_CACHE_CONFIG.localStorage.maxSize) {
      console.warn('번역 데이터가 localStorage 크기 제한을 초과합니다:', size);
      return;
    }

    const entry: ClientCacheEntry = {
      data,
      timestamp: Date.now(),
      version: '1.0',
      size
    };

    localStorage.setItem(key, JSON.stringify(entry));

    // 전체 캐시 크기 확인 및 정리
    cleanupLocalStorageCache();
  } catch (error) {
    console.warn('localStorage에 번역 데이터 저장 실패:', error);
    
    // 저장 공간 부족 시 캐시 정리 후 재시도
    if (error.name === 'QuotaExceededError') {
      cleanupLocalStorageCache(true);
      try {
        const entry: ClientCacheEntry = {
          data,
          timestamp: Date.now(),
          version: '1.0',
          size: calculateDataSize(data)
        };
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.warn('localStorage 재시도 실패:', retryError);
      }
    }
  }
}

/**
 * sessionStorage에서 번역 데이터를 가져옵니다
 */
function getFromSessionStorage(cacheKey: string): any | null {
  if (!isBrowser() || !CLIENT_CACHE_CONFIG.sessionStorage.enabled) {
    return null;
  }

  try {
    const key = CLIENT_CACHE_CONFIG.sessionStorage.keyPrefix + cacheKey;
    const cached = sessionStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const entry: ClientCacheEntry = JSON.parse(cached);
    const now = Date.now();

    // 만료 확인
    if (now - entry.timestamp > CLIENT_CACHE_CONFIG.sessionStorage.expiry) {
      sessionStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('sessionStorage에서 번역 데이터 로드 실패:', error);
    return null;
  }
}

/**
 * sessionStorage에 번역 데이터를 저장합니다
 */
function setToSessionStorage(cacheKey: string, data: any): void {
  if (!isBrowser() || !CLIENT_CACHE_CONFIG.sessionStorage.enabled) {
    return;
  }

  try {
    const key = CLIENT_CACHE_CONFIG.sessionStorage.keyPrefix + cacheKey;
    const size = calculateDataSize(data);
    
    // 크기 제한 확인
    if (size > CLIENT_CACHE_CONFIG.sessionStorage.maxSize) {
      console.warn('번역 데이터가 sessionStorage 크기 제한을 초과합니다:', size);
      return;
    }

    const entry: ClientCacheEntry = {
      data,
      timestamp: Date.now(),
      version: '1.0',
      size
    };

    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('sessionStorage에 번역 데이터 저장 실패:', error);
    
    // 저장 공간 부족 시 캐시 정리 후 재시도
    if (error.name === 'QuotaExceededError') {
      cleanupSessionStorageCache(true);
      try {
        const entry: ClientCacheEntry = {
          data,
          timestamp: Date.now(),
          version: '1.0',
          size: calculateDataSize(data)
        };
        sessionStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.warn('sessionStorage 재시도 실패:', retryError);
      }
    }
  }
}

/**
 * localStorage 캐시를 정리합니다
 */
function cleanupLocalStorageCache(aggressive = false): void {
  if (!isBrowser()) return;

  try {
    const prefix = CLIENT_CACHE_CONFIG.localStorage.keyPrefix;
    const keysToCheck: string[] = [];
    
    // 번역 캐시 키들 수집
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToCheck.push(key);
      }
    }

    const now = Date.now();
    const entries: Array<{ key: string; entry: ClientCacheEntry }> = [];

    // 만료된 항목 제거 및 유효한 항목 수집
    keysToCheck.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry: ClientCacheEntry = JSON.parse(cached);
          
          // 만료된 항목 제거
          if (now - entry.timestamp > CLIENT_CACHE_CONFIG.localStorage.expiry) {
            localStorage.removeItem(key);
          } else {
            entries.push({ key, entry });
          }
        }
      } catch (error) {
        // 파싱 실패한 항목 제거
        localStorage.removeItem(key);
      }
    });

    // 적극적 정리가 필요한 경우 (저장 공간 부족 등)
    if (aggressive && entries.length > 0) {
      // 타임스탬프 기준으로 정렬 (오래된 것부터)
      entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
      
      // 절반 제거
      const toRemove = Math.floor(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    }
  } catch (error) {
    console.warn('localStorage 캐시 정리 실패:', error);
  }
}

/**
 * sessionStorage 캐시를 정리합니다
 */
function cleanupSessionStorageCache(aggressive = false): void {
  if (!isBrowser()) return;

  try {
    const prefix = CLIENT_CACHE_CONFIG.sessionStorage.keyPrefix;
    const keysToCheck: string[] = [];
    
    // 번역 캐시 키들 수집
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToCheck.push(key);
      }
    }

    const now = Date.now();
    const entries: Array<{ key: string; entry: ClientCacheEntry }> = [];

    // 만료된 항목 제거 및 유효한 항목 수집
    keysToCheck.forEach(key => {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          const entry: ClientCacheEntry = JSON.parse(cached);
          
          // 만료된 항목 제거
          if (now - entry.timestamp > CLIENT_CACHE_CONFIG.sessionStorage.expiry) {
            sessionStorage.removeItem(key);
          } else {
            entries.push({ key, entry });
          }
        }
      } catch (error) {
        // 파싱 실패한 항목 제거
        sessionStorage.removeItem(key);
      }
    });

    // 적극적 정리가 필요한 경우
    if (aggressive && entries.length > 0) {
      // 타임스탬프 기준으로 정렬 (오래된 것부터)
      entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
      
      // 절반 제거
      const toRemove = Math.floor(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        sessionStorage.removeItem(entries[i].key);
      }
    }
  } catch (error) {
    console.warn('sessionStorage 캐시 정리 실패:', error);
  }
}

/**
 * 클라이언트 캐시에서 번역 데이터를 가져옵니다
 * sessionStorage -> localStorage 순으로 확인
 */
function getFromClientCache(cacheKey: string): any | null {
  // 1. sessionStorage에서 먼저 확인 (더 빠름)
  const sessionData = getFromSessionStorage(cacheKey);
  if (sessionData !== null) {
    return sessionData;
  }

  // 2. localStorage에서 확인
  const localData = getFromLocalStorage(cacheKey);
  if (localData !== null) {
    // localStorage에서 가져온 데이터를 sessionStorage에도 저장 (성능 향상)
    setToSessionStorage(cacheKey, localData);
    return localData;
  }

  return null;
}

/**
 * 클라이언트 캐시에 번역 데이터를 저장합니다
 * sessionStorage와 localStorage 모두에 저장
 */
function setToClientCache(cacheKey: string, data: any): void {
  // sessionStorage에 저장 (빠른 접근)
  setToSessionStorage(cacheKey, data);
  
  // localStorage에 저장 (영구 보관)
  setToLocalStorage(cacheKey, data);
}

/**
 * 클라이언트 캐시 정보를 반환합니다
 */
export function getClientCacheInfo(): {
  localStorage: {
    enabled: boolean;
    size: number;
    entries: number;
    maxSize: number;
  };
  sessionStorage: {
    enabled: boolean;
    size: number;
    entries: number;
    maxSize: number;
  };
} {
  const result = {
    localStorage: {
      enabled: CLIENT_CACHE_CONFIG.localStorage.enabled,
      size: 0,
      entries: 0,
      maxSize: CLIENT_CACHE_CONFIG.localStorage.maxSize
    },
    sessionStorage: {
      enabled: CLIENT_CACHE_CONFIG.sessionStorage.enabled,
      size: 0,
      entries: 0,
      maxSize: CLIENT_CACHE_CONFIG.sessionStorage.maxSize
    }
  };

  if (!isBrowser()) {
    return result;
  }

  try {
    // localStorage 정보
    const localPrefix = CLIENT_CACHE_CONFIG.localStorage.keyPrefix;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(localPrefix)) {
        result.localStorage.entries++;
        const item = localStorage.getItem(key);
        if (item) {
          result.localStorage.size += item.length * 2; // UTF-16 기준
        }
      }
    }

    // sessionStorage 정보
    const sessionPrefix = CLIENT_CACHE_CONFIG.sessionStorage.keyPrefix;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(sessionPrefix)) {
        result.sessionStorage.entries++;
        const item = sessionStorage.getItem(key);
        if (item) {
          result.sessionStorage.size += item.length * 2; // UTF-16 기준
        }
      }
    }
  } catch (error) {
    console.warn('클라이언트 캐시 정보 수집 실패:', error);
  }

  return result;
}

/**
 * 클라이언트 캐시를 초기화합니다
 */
export function clearClientCache(): void {
  if (!isBrowser()) return;

  try {
    // localStorage 클리어
    const localPrefix = CLIENT_CACHE_CONFIG.localStorage.keyPrefix;
    const localKeysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(localPrefix)) {
        localKeysToRemove.push(key);
      }
    }
    
    localKeysToRemove.forEach(key => localStorage.removeItem(key));

    // sessionStorage 클리어
    const sessionPrefix = CLIENT_CACHE_CONFIG.sessionStorage.keyPrefix;
    const sessionKeysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(sessionPrefix)) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

  } catch (error) {
    console.warn('클라이언트 캐시 초기화 실패:', error);
  }
}

// ============================================================================
// 성능 최적화 추가 기능
// ============================================================================

/**
 * 백그라운드에서 주기적으로 캐시를 정리합니다
 */
let cacheCleanupInterval: NodeJS.Timeout | null = null;

/**
 * 자동 캐시 정리를 시작합니다
 * @param intervalMs 정리 주기 (밀리초, 기본값: 10분)
 */
export function startAutoCacheCleanup(intervalMs: number = 10 * 60 * 1000): void {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }

  cacheCleanupInterval = setInterval(() => {
    try {
      optimizeCache();
      
      // 브라우저 환경에서만 클라이언트 캐시 정리
      if (isBrowser()) {
        cleanupLocalStorageCache();
        cleanupSessionStorageCache();
      }
      
      console.debug('자동 캐시 정리 완료', getCacheInfo());
    } catch (error) {
      console.warn('자동 캐시 정리 실패:', error);
    }
  }, intervalMs);
}

/**
 * 자동 캐시 정리를 중지합니다
 */
export function stopAutoCacheCleanup(): void {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
}

/**
 * 캐시 워밍업 - 자주 사용되는 번역 데이터를 미리 로드합니다
 * @param priority 우선순위 ('high' | 'normal' | 'low')
 */
export async function warmupCache(priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
  const locales: Locale[] = ['ko', 'en'];
  
  try {
    if (priority === 'high') {
      // 높은 우선순위: 모든 번역 데이터를 즉시 로드
      await Promise.all(locales.map(locale => loadTranslations(locale)));
      console.debug('고우선순위 캐시 워밍업 완료');
      
    } else if (priority === 'normal') {
      // 일반 우선순위: 공통 번역 데이터만 먼저 로드
      await Promise.all(locales.map(locale => 
        Promise.all([
          loadTranslation(locale, 'common'),
          loadTranslation(locale, 'navigation')
        ])
      ));
      
      // 나머지는 백그라운드에서 로드
      setTimeout(() => {
        Promise.all(locales.map(locale => 
          Promise.all([
            loadTranslation(locale, 'countries'),
            loadTranslation(locale, 'holidays')
          ])
        )).catch(error => console.warn('백그라운드 캐시 워밍업 실패:', error));
      }, 1000);
      
      console.debug('일반 우선순위 캐시 워밍업 완료');
      
    } else {
      // 낮은 우선순위: 백그라운드에서 천천히 로드
      setTimeout(() => {
        locales.forEach((locale, index) => {
          setTimeout(() => {
            loadTranslations(locale).catch(error => 
              console.warn(`저우선순위 캐시 워밍업 실패 (${locale}):`, error)
            );
          }, index * 2000); // 2초 간격으로 로드
        });
      }, 5000);
      
      console.debug('저우선순위 캐시 워밍업 시작');
    }
    
  } catch (error) {
    console.warn('캐시 워밍업 실패:', error);
  }
}

/**
 * 사용자의 언어 선호도에 따라 스마트 캐시 워밍업을 수행합니다
 * @param userLocale 사용자 언어
 * @param fallbackLocale 대체 언어
 */
export async function smartWarmupCache(
  userLocale: Locale, 
  fallbackLocale: Locale = 'ko'
): Promise<void> {
  try {
    // 1. 사용자 언어의 핵심 번역 데이터를 최우선으로 로드
    await Promise.all([
      loadTranslation(userLocale, 'common'),
      loadTranslation(userLocale, 'navigation')
    ]);

    // 2. 사용자 언어의 나머지 데이터를 백그라운드에서 로드
    setTimeout(() => {
      Promise.all([
        loadTranslation(userLocale, 'countries'),
        loadTranslation(userLocale, 'holidays')
      ]).catch(error => console.warn('사용자 언어 백그라운드 로드 실패:', error));
    }, 500);

    // 3. 대체 언어 데이터를 더 낮은 우선순위로 로드
    if (userLocale !== fallbackLocale) {
      setTimeout(() => {
        loadTranslations(fallbackLocale).catch(error => 
          console.warn('대체 언어 로드 실패:', error)
        );
      }, 2000);
    }

    console.debug(`스마트 캐시 워밍업 완료 (사용자: ${userLocale}, 대체: ${fallbackLocale})`);
    
  } catch (error) {
    console.warn('스마트 캐시 워밍업 실패:', error);
  }
}

/**
 * 메모리 사용량을 모니터링하고 필요시 캐시를 정리합니다
 */
export function monitorMemoryUsage(): void {
  if (!isBrowser() || !('memory' in performance)) {
    return;
  }

  const checkMemory = () => {
    try {
      const memInfo = (performance as any).memory;
      const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
      const limitMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
      const usagePercent = (usedMB / limitMB) * 100;

      // 메모리 사용량이 80%를 초과하면 적극적으로 캐시 정리
      if (usagePercent > 80) {
        console.warn(`높은 메모리 사용량 감지 (${usagePercent.toFixed(1)}%), 캐시 정리 시작`);
        
        // 메모리 캐시 적극적 정리
        const entries = Array.from(enhancedCache.entries());
        const toRemove = Math.floor(entries.length * 0.5); // 50% 제거
        
        entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, toRemove)
          .forEach(([key]) => {
            enhancedCache.delete(key);
            translationCache.delete(key);
            cacheStats.evictions++;
          });

        // 클라이언트 캐시도 정리
        cleanupLocalStorageCache(true);
        cleanupSessionStorageCache(true);
        
        console.debug('메모리 부족으로 인한 캐시 정리 완료');
      }
    } catch (error) {
      console.warn('메모리 모니터링 실패:', error);
    }
  };

  // 30초마다 메모리 사용량 확인
  setInterval(checkMemory, 30000);
}

/**
 * 캐시 성능 리포트를 생성합니다
 */
export function generateCachePerformanceReport(): {
  memory: {
    size: number;
    hitRate: number;
    stats: CacheStats;
    topEntries: Array<{ key: string; accessCount: number; age: number }>;
  };
  client: {
    localStorage: { enabled: boolean; size: number; entries: number };
    sessionStorage: { enabled: boolean; size: number; entries: number };
  };
  recommendations: string[];
} {
  const cacheInfo = getCacheInfo();
  const clientInfo = getClientCacheInfo();
  const recommendations: string[] = [];

  // 성능 분석 및 권장사항 생성
  if (cacheInfo.hitRate < 70) {
    recommendations.push('캐시 히트율이 낮습니다. 캐시 워밍업을 고려해보세요.');
  }

  if (cacheInfo.size > 80) {
    recommendations.push('메모리 캐시 크기가 큽니다. 자동 정리 주기를 단축하는 것을 고려해보세요.');
  }

  if (clientInfo.localStorage.size > clientInfo.localStorage.maxSize * 0.8) {
    recommendations.push('localStorage 사용량이 높습니다. 클라이언트 캐시 정리가 필요합니다.');
  }

  if (cacheInfo.stats.evictions > cacheInfo.stats.hits * 0.1) {
    recommendations.push('캐시 제거율이 높습니다. 캐시 크기 제한을 늘리는 것을 고려해보세요.');
  }

  return {
    memory: {
      size: cacheInfo.size,
      hitRate: cacheInfo.hitRate,
      stats: cacheInfo.stats,
      topEntries: cacheInfo.entries.slice(0, 10).map(entry => ({
        key: entry.key,
        accessCount: entry.accessCount,
        age: entry.age
      }))
    },
    client: {
      localStorage: {
        enabled: clientInfo.localStorage.enabled,
        size: clientInfo.localStorage.size,
        entries: clientInfo.localStorage.entries
      },
      sessionStorage: {
        enabled: clientInfo.sessionStorage.enabled,
        size: clientInfo.sessionStorage.size,
        entries: clientInfo.sessionStorage.entries
      }
    },
    recommendations
  };
}

/**
 * 개발 환경에서 캐시 성능을 디버깅합니다
 */
export function debugCachePerformance(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group('🚀 번역 캐시 성능 리포트');
  
  const report = generateCachePerformanceReport();
  
  console.log('📊 메모리 캐시:', {
    크기: report.memory.size,
    히트율: `${report.memory.hitRate}%`,
    통계: report.memory.stats
  });
  
  console.log('💾 클라이언트 캐시:', report.client);
  
  if (report.recommendations.length > 0) {
    console.log('💡 권장사항:', report.recommendations);
  }
  
  if (report.memory.topEntries.length > 0) {
    console.table(report.memory.topEntries);
  }
  
  console.groupEnd();
}

// 브라우저 환경에서 자동으로 성능 모니터링 시작
if (isBrowser() && process.env.NODE_ENV === 'development') {
  // 개발 환경에서만 디버그 정보 출력
  setTimeout(() => {
    debugCachePerformance();
  }, 5000);
}