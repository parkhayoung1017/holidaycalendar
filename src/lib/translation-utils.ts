/**
 * 번역 관련 유틸리티 함수들
 */

import { Locale } from '@/types/i18n';

// 휴일 이름 매핑 (영어 -> 번역 키)
const HOLIDAY_NAME_MAPPING: Record<string, string> = {
  "New Year's Day": "common.newYear",
  "Christmas Day": "common.christmas",
  "Christmas": "common.christmas",
  "Easter Sunday": "common.easter",
  "Easter": "common.easter",
  "Easter Monday": "common.easterMonday",
  "Good Friday": "common.goodFriday",
  "Labor Day": "common.laborDay",
  "Labour Day": "common.laborDay",
  "Workers' Day": "common.laborDay",
  "Independence Day": "common.independenceDay",
  "National Day": "common.nationalDay",
  "Thanksgiving": "common.thanksgiving",
  "Thanksgiving Day": "common.thanksgiving",
  "Valentine's Day": "common.valentinesDay",
  "Mother's Day": "common.mothersDay",
  "Father's Day": "common.fathersDay",
  "Children's Day": "common.childrensDay",
  "Halloween": "common.halloween",
  "New Year's Eve": "common.newYearsEve",
  "Lunar New Year": "korean.lunarNewYear",
  "Buddha's Birthday": "korean.buddhasBirthday",
  "Memorial Day": "korean.memorialDay",
  "Constitution Day": "korean.constitutionDay",
  "Liberation Day": "korean.liberationDay",
  "National Foundation Day": "korean.nationalFoundationDay",
  "Hangeul Day": "korean.hangeulDay",
  "Chuseok": "korean.chuseok",
  "Mid-Autumn Festival": "korean.chuseok",
  // 아프리카 및 기타 국가 공휴일
  "Human Rights Day": "common.humanRightsDay",
  "Freedom Day": "common.freedomDay",
  "Family Day": "common.familyDay",
  "Youth Day": "common.youthDay",
  "National Women's Day": "common.nationalWomensDay",
  "Heritage Day": "common.heritageDay",
  "Day of Reconciliation": "common.dayOfReconciliation",
  "Day of Goodwill": "common.dayOfGoodwill"
};

// 국가별 특별 휴일 번역 키
const COUNTRY_SPECIFIC_HOLIDAYS: Record<string, Record<string, string>> = {
  KR: {
    "Lunar New Year": "korean.lunarNewYear",
    "Buddha's Birthday": "korean.buddhasBirthday",
    "Memorial Day": "korean.memorialDay",
    "Constitution Day": "korean.constitutionDay",
    "Liberation Day": "korean.liberationDay",
    "National Foundation Day": "korean.nationalFoundationDay",
    "Hangeul Day": "korean.hangeulDay",
    "Chuseok": "korean.chuseok",
    "Mid-Autumn Festival": "korean.chuseok"
  },
  US: {
    "Martin Luther King Jr. Day": "american.mlkDay",
    "Presidents' Day": "american.presidentsDay",
    "Memorial Day": "american.memorialDay",
    "Independence Day": "american.independenceDay",
    "Labor Day": "american.laborDay",
    "Columbus Day": "american.columbusDay",
    "Veterans Day": "american.veteransDay",
    "Thanksgiving": "american.thanksgiving"
  },
  GB: {
    "Boxing Day": "british.boxingDay",
    "Spring Bank Holiday": "british.springBankHoliday",
    "Summer Bank Holiday": "british.summerBankHoliday",
    "Queen's Birthday": "british.queensBirthday",
    "King's Birthday": "british.kingsBirthday"
  }
};

/**
 * 휴일 이름을 번역합니다
 * @param holidayName 원본 휴일 이름 (영어)
 * @param countryCode 국가 코드
 * @param translations 번역 데이터
 * @param locale 현재 언어
 * @returns 번역된 휴일 이름
 */
export function translateHolidayName(
  holidayName: string,
  countryCode: string,
  translations: any,
  locale: Locale
): string {
  if (!holidayName || !translations?.holidays) {
    return holidayName;
  }

  // 1. 국가별 특별 휴일 확인
  const countryHolidays = COUNTRY_SPECIFIC_HOLIDAYS[countryCode];
  if (countryHolidays && countryHolidays[holidayName]) {
    const translationKey = countryHolidays[holidayName];
    const translated = getNestedTranslation(translations.holidays, translationKey);
    if (translated) return translated;
  }

  // 2. 공통 휴일 확인
  const commonKey = HOLIDAY_NAME_MAPPING[holidayName];
  if (commonKey) {
    const translated = getNestedTranslation(translations.holidays, commonKey);
    if (translated) return translated;
  }

  // 3. 부분 매칭 시도 (예: "Christmas Eve" -> "Christmas")
  for (const [englishName, translationKey] of Object.entries(HOLIDAY_NAME_MAPPING)) {
    if (holidayName.includes(englishName) || englishName.includes(holidayName)) {
      const translated = getNestedTranslation(translations.holidays, translationKey);
      if (translated) {
        // 부분 매칭인 경우 원본 이름도 함께 표시
        return locale === 'ko' 
          ? `${translated} (${holidayName})`
          : translated;
      }
    }
  }

  // 4. 번역을 찾지 못한 경우 원본 이름 반환
  return holidayName;
}

/**
 * 국가명을 번역합니다
 * @param countryCode 국가 코드 (예: 'KR', 'US')
 * @param translations 번역 데이터
 * @returns 번역된 국가명
 */
export function translateCountryName(
  countryCode: string,
  translations: any
): string {
  if (!countryCode || !translations?.countries?.countries) {
    return countryCode;
  }

  return translations.countries.countries[countryCode] || countryCode;
}

/**
 * 휴일 타입을 번역합니다
 * @param type 휴일 타입 (예: 'public', 'religious')
 * @param translations 번역 데이터
 * @returns 번역된 휴일 타입
 */
export function translateHolidayType(
  type: string,
  translations: any
): string {
  if (!type || !translations?.holidays?.types) {
    return type;
  }

  return translations.holidays.types[type] || type;
}

/**
 * 중첩된 객체에서 번역 값을 가져옵니다
 * @param obj 번역 객체
 * @param key 점으로 구분된 키 (예: 'common.newYear')
 * @returns 번역된 값
 */
function getNestedTranslation(obj: any, key: string): string | null {
  if (!obj || !key) return null;

  const keys = key.split('.');
  let current = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
}

/**
 * 휴일 데이터에 번역 정보를 추가합니다
 * @param holiday 원본 휴일 데이터
 * @param translations 번역 데이터
 * @param locale 현재 언어
 * @returns 번역 정보가 추가된 휴일 데이터
 */
export function enrichHolidayWithTranslations(
  holiday: any,
  translations: any,
  locale: Locale
) {
  if (!holiday) return holiday;

  return {
    ...holiday,
    translatedName: translateHolidayName(
      holiday.name,
      holiday.countryCode,
      translations,
      locale
    ),
    translatedType: translateHolidayType(holiday.type, translations),
    translatedCountry: translateCountryName(holiday.countryCode, translations)
  };
}

/**
 * 휴일 목록에 번역 정보를 추가합니다
 * @param holidays 휴일 목록
 * @param translations 번역 데이터
 * @param locale 현재 언어
 * @returns 번역 정보가 추가된 휴일 목록
 */
export function enrichHolidaysWithTranslations(
  holidays: any[],
  translations: any,
  locale: Locale
) {
  if (!Array.isArray(holidays)) return holidays;

  return holidays.map(holiday => 
    enrichHolidayWithTranslations(holiday, translations, locale)
  );
}

/**
 * 날짜를 현지화된 형식으로 포맷합니다
 * @param date 날짜 (Date 객체 또는 문자열)
 * @param locale 언어 코드
 * @param options 포맷 옵션
 * @returns 포맷된 날짜 문자열
 */
export function formatLocalizedDate(
  date: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return typeof date === 'string' ? date : date.toString();
    }

    const localeCode = locale === 'ko' ? 'ko-KR' : 'en-US';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    return dateObj.toLocaleDateString(localeCode, defaultOptions);
  } catch (error) {
    console.warn('날짜 포맷 오류:', error);
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * 번역 키가 존재하는지 확인합니다
 * @param translations 번역 객체
 * @param key 번역 키
 * @returns 키 존재 여부
 */
export function hasTranslationKey(translations: any, key: string): boolean {
  return getNestedTranslation(translations, key) !== null;
}

/**
 * 번역 키를 사용하여 번역된 텍스트를 가져옵니다
 * @param translations 번역 객체
 * @param key 번역 키
 * @param options 옵션 (params, fallback 등)
 * @returns 번역된 텍스트
 */
export function translateKey(
  translations: any,
  key: string,
  options: {
    params?: Record<string, string>;
    fallback?: string;
  } = {}
): string {
  const { params = {}, fallback = key } = options;
  
  let translated = getNestedTranslation(translations, key);
  
  // 키를 직접 찾지 못한 경우, common 네임스페이스에서 찾아보기
  if (!translated && translations.common) {
    translated = getNestedTranslation(translations.common, key);
  }
  
  // 여전히 찾지 못한 경우, 다른 네임스페이스들에서 찾아보기
  if (!translated) {
    for (const namespace of ['countries', 'holidays', 'navigation']) {
      if (translations[namespace]) {
        translated = getNestedTranslation(translations[namespace], key);
        if (translated) break;
      }
    }
  }
  
  if (!translated) {
    return fallback;
  }

  // 파라미터 치환
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      const placeholder = `{{${paramKey}}}`;
      translated = translated!.replace(new RegExp(placeholder, 'g'), paramValue);
    });
  }

  return translated;
}

/**
 * 복수형 번역을 처리합니다
 * @param count 개수
 * @param translations 번역 객체
 * @param keyPrefix 키 접두사
 * @param params 추가 파라미터
 * @returns 번역된 텍스트
 */
export function translatePlural(
  count: number,
  translations: any,
  keyPrefix: string,
  params: Record<string, string> = {}
): string {
  const pluralKey = count === 0 ? 'zero' : count === 1 ? 'one' : 'other';
  const key = `${keyPrefix}.${pluralKey}`;
  
  return translateKey(translations, key, {
    params: { count: count.toString(), ...params },
    fallback: `${count} items`
  });
}