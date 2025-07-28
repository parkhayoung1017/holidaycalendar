/**
 * 번역 데이터 로더
 * 언어별 번역 파일을 동적으로 로드하고 캐싱합니다.
 */

import { Locale } from '@/types/i18n';

// 번역 데이터 캐시
const translationCache = new Map<string, any>();

/**
 * 단일 네임스페이스 번역 데이터를 로드합니다
 * @param locale 언어 코드
 * @param namespace 네임스페이스 (common, countries, holidays, navigation)
 * @returns 번역 데이터
 */
export async function loadTranslation(
  locale: Locale,
  namespace: string
): Promise<any> {
  const cacheKey = `${locale}-${namespace}`;
  
  // 캐시에서 확인
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const module = await import(`@/locales/${locale}/${namespace}.json`);
    const translations = module.default || module;

    // 캐시에 저장
    translationCache.set(cacheKey, translations);
    return translations;

  } catch (error) {
    console.warn(`번역 파일 로드 실패: ${locale}/${namespace}`, error);
    
    // 기본 언어로 fallback
    if (locale !== 'ko') {
      return loadTranslation('ko', namespace);
    }
    
    return {};
  }
}

/**
 * 여러 네임스페이스 번역 데이터를 로드합니다
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
    const cacheKey = `${locale}-${namespaces.join(',')}`;
    
    // 캐시에서 확인
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    const translations: any = {};
    
    for (const namespace of namespaces) {
      translations[namespace] = await loadTranslation(locale, namespace);
    }

    // 캐시에 저장
    translationCache.set(cacheKey, translations);
    return translations;
  }

  // 모든 네임스페이스 로드
  const cacheKey = `${locale}-all`;
  
  // 캐시에서 확인
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const [common, countries, holidays, navigation] = await Promise.all([
      import(`@/locales/${locale}/common.json`).catch(() => ({})),
      import(`@/locales/${locale}/countries.json`).catch(() => ({})),
      import(`@/locales/${locale}/holidays.json`).catch(() => ({})),
      import(`@/locales/${locale}/navigation.json`).catch(() => ({}))
    ]);

    const translations = {
      common: common.default || common,
      countries: countries.default || countries,
      holidays: holidays.default || holidays,
      navigation: navigation.default || navigation
    };

    // 캐시에 저장
    translationCache.set(cacheKey, translations);
    return translations;

  } catch (error) {
    console.warn(`번역 파일 로드 실패: ${locale}/all`, error);
    
    // 기본 언어로 fallback
    if (locale !== 'ko') {
      return loadTranslations('ko', namespaces);
    }
    
    return {};
  }
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
 * 번역 캐시를 초기화합니다
 * @param locale 특정 언어만 클리어할 경우 언어 코드
 * @param namespace 특정 네임스페이스만 클리어할 경우 네임스페이스
 */
export function clearTranslationCache(locale?: Locale, namespace?: string): void {
  if (locale && namespace) {
    // 특정 언어의 특정 네임스페이스만 클리어
    const cacheKey = `${locale}-${namespace}`;
    translationCache.delete(cacheKey);
  } else if (locale) {
    // 특정 언어의 모든 캐시 클리어
    const keysToDelete = Array.from(translationCache.keys())
      .filter(key => key.startsWith(`${locale}-`));
    
    keysToDelete.forEach(key => translationCache.delete(key));
  } else {
    // 전체 캐시 클리어
    translationCache.clear();
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
 * 캐시 정보를 반환합니다
 * @returns 캐시 크기와 키 목록
 */
export function getCacheInfo(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys())
  };
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