/**
 * 공휴일 번역을 위한 통합 유틸리티
 */

import { Locale } from '@/types/i18n';

// 포괄적인 공휴일 번역 매핑
const HOLIDAY_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  // 기본 공휴일
  "New Year's Day": { ko: "신정", en: "New Year's Day" },
  "Christmas Day": { ko: "크리스마스", en: "Christmas Day" },
  "Christmas": { ko: "크리스마스", en: "Christmas" },
  "Easter": { ko: "부활절", en: "Easter" },
  "Easter Sunday": { ko: "부활절", en: "Easter Sunday" },
  "Easter Monday": { ko: "부활절 월요일", en: "Easter Monday" },
  "Good Friday": { ko: "성금요일", en: "Good Friday" },
  "Labour Day": { ko: "근로자의 날", en: "Labour Day" },
  "Labor Day": { ko: "근로자의 날", en: "Labor Day" },
  "Workers' Day": { ko: "근로자의 날", en: "Workers' Day" },
  "Independence Day": { ko: "독립기념일", en: "Independence Day" },
  "National Day": { ko: "국경일", en: "National Day" },
  "Thanksgiving": { ko: "추수감사절", en: "Thanksgiving" },
  "Thanksgiving Day": { ko: "추수감사절", en: "Thanksgiving Day" },
  "Memorial Day": { ko: "현충일", en: "Memorial Day" },
  "Veterans Day": { ko: "재향군인의 날", en: "Veterans Day" },
  "Constitution Day": { ko: "제헌절", en: "Constitution Day" },
  "Liberation Day": { ko: "광복절", en: "Liberation Day" },
  "Foundation Day": { ko: "건국기념일", en: "Foundation Day" },
  "National Foundation Day": { ko: "개천절", en: "National Foundation Day" },
  
  // 미국 공휴일
  "Martin Luther King Jr. Day": { ko: "마틴 루터 킹 주니어 데이", en: "Martin Luther King Jr. Day" },
  "Martin Luther King, Jr. Day": { ko: "마틴 루터 킹 주니어 데이", en: "Martin Luther King, Jr. Day" },
  "Presidents' Day": { ko: "대통령의 날", en: "Presidents' Day" },
  "Presidents Day": { ko: "대통령의 날", en: "Presidents Day" },
  "Columbus Day": { ko: "콜럼버스 데이", en: "Columbus Day" },
  "Lincolns Birthday": { ko: "링컨 탄신일", en: "Lincoln's Birthday" },
  "Lincoln's Birthday": { ko: "링컨 탄신일", en: "Lincoln's Birthday" },
  "Washington's Birthday": { ko: "워싱턴 탄신일", en: "Washington's Birthday" },
  
  // 영국 공휴일
  "Boxing Day": { ko: "박싱 데이", en: "Boxing Day" },
  "Spring Bank Holiday": { ko: "봄 은행 휴일", en: "Spring Bank Holiday" },
  "Summer Bank Holiday": { ko: "여름 은행 휴일", en: "Summer Bank Holiday" },
  "May Day": { ko: "메이데이", en: "May Day" },
  "Queen's Birthday": { ko: "여왕 탄신일", en: "Queen's Birthday" },
  "King's Birthday": { ko: "국왕 탄신일", en: "King's Birthday" },
  
  // 한국 공휴일
  "Lunar New Year": { ko: "설날", en: "Lunar New Year" },
  "Independence Movement Day": { ko: "삼일절", en: "Independence Movement Day" },
  "Buddha's Birthday": { ko: "부처님오신날", en: "Buddha's Birthday" },
  "Children's Day": { ko: "어린이날", en: "Children's Day" },
  "Hangeul Day": { ko: "한글날", en: "Hangeul Day" },
  "Chuseok": { ko: "추석", en: "Chuseok" },
  "Mid-Autumn Festival": { ko: "추석", en: "Mid-Autumn Festival" },
  
  // 일본 공휴일
  "Coming of Age Day": { ko: "성인의 날", en: "Coming of Age Day" },
  "The Emperor's Birthday": { ko: "천황 탄생일", en: "The Emperor's Birthday" },
  "Emperor's Birthday": { ko: "천황 탄생일", en: "Emperor's Birthday" },
  "Showa Day": { ko: "쇼와의 날", en: "Showa Day" },
  "Greenery Day": { ko: "녹색의 날", en: "Greenery Day" },
  "Marine Day": { ko: "바다의 날", en: "Marine Day" },
  "Mountain Day": { ko: "산의 날", en: "Mountain Day" },
  "Respect for the Aged Day": { ko: "경로의 날", en: "Respect for the Aged Day" },
  "Health and Sports Day": { ko: "체육의 날", en: "Health and Sports Day" },
  "Culture Day": { ko: "문화의 날", en: "Culture Day" },
  "Labour Thanksgiving Day": { ko: "근로감사의 날", en: "Labour Thanksgiving Day" },
  "Vernal Equinox Day": { ko: "춘분의 날", en: "Vernal Equinox Day" },
  "Autumnal Equinox Day": { ko: "추분의 날", en: "Autumnal Equinox Day" },
  
  // 아시아 공휴일
  "Vesak Day": { ko: "웨삭데이", en: "Vesak Day" },
  "Chinese New Year": { ko: "중국 신정", en: "Chinese New Year" },
  "Hari Raya Puasa": { ko: "하리 라야 푸아사", en: "Hari Raya Puasa" },
  "Hari Raya Haji": { ko: "하리 라야 하지", en: "Hari Raya Haji" },
  "Deepavali": { ko: "디파발리", en: "Deepavali" },
  "Diwali": { ko: "디파발리", en: "Diwali" },
  "Thaipusam": { ko: "타이푸삼", en: "Thaipusam" },
  "Dragon Boat Festival": { ko: "단오절", en: "Dragon Boat Festival" },
  "Qingming Festival": { ko: "청명절", en: "Qingming Festival" },
  "Double Ninth Festival": { ko: "중양절", en: "Double Ninth Festival" },
  "Lantern Festival": { ko: "원소절", en: "Lantern Festival" },
  "Hungry Ghost Festival": { ko: "중원절", en: "Hungry Ghost Festival" },
  
  // 유럽 공휴일
  "Bastille Day": { ko: "바스티유 데이", en: "Bastille Day" },
  "Assumption of Mary": { ko: "성모승천일", en: "Assumption of Mary" },
  "All Saints' Day": { ko: "만성절", en: "All Saints' Day" },
  "Armistice Day": { ko: "휴전기념일", en: "Armistice Day" },
  "Epiphany": { ko: "주현절", en: "Epiphany" },
  "Ascension Day": { ko: "승천일", en: "Ascension Day" },
  "Whit Monday": { ko: "성령강림절 월요일", en: "Whit Monday" },
  "Corpus Christi": { ko: "성체성혈대축일", en: "Corpus Christi" },
  "St. Patrick's Day": { ko: "성 패트릭의 날", en: "St. Patrick's Day" },
  "St. George's Day": { ko: "성 조지의 날", en: "St. George's Day" },
  "Victory in Europe Day": { ko: "유럽 승전기념일", en: "Victory in Europe Day" },
  "German Unity Day": { ko: "독일 통일의 날", en: "German Unity Day" },
  "Day of German Unity": { ko: "독일 통일의 날", en: "Day of German Unity" },
  "International Women's Day": { ko: "세계 여성의 날", en: "International Women's Day" },
  
  // 남미 공휴일
  "Carnival": { ko: "카니발", en: "Carnival" },
  "Tiradentes": { ko: "티라덴치스", en: "Tiradentes" },
  "Day of Remembrance for Truth and Justice": { ko: "진실과 정의를 위한 기념일", en: "Day of Remembrance for Truth and Justice" },
  "Day of the Veterans and Fallen of the Malvinas War": { ko: "말비나스 전쟁 참전용사 및 전사자의 날", en: "Day of the Veterans and Fallen of the Malvinas War" },
  "Constitutionalist Revolution of 1932": { ko: "1932년 입헌주의 혁명", en: "Constitutionalist Revolution of 1932" },
  
  // 기타 공휴일
  "Australia Day": { ko: "호주의 날", en: "Australia Day" },
  "Canada Day": { ko: "캐나다 데이", en: "Canada Day" },
  "Victory Day": { ko: "승전기념일", en: "Victory Day" },
  "Flag Day": { ko: "국기의 날", en: "Flag Day" },
  "Human Rights Day": { ko: "인권의 날", en: "Human Rights Day" },
  "Freedom Day": { ko: "자유의 날", en: "Freedom Day" },
  "Family Day": { ko: "가족의 날", en: "Family Day" },
  "Youth Day": { ko: "청년의 날", en: "Youth Day" },
  "National Women's Day": { ko: "여성의 날", en: "National Women's Day" },
  "Heritage Day": { ko: "문화유산의 날", en: "Heritage Day" },
  "Day of Reconciliation": { ko: "화해의 날", en: "Day of Reconciliation" },
  "Day of Goodwill": { ko: "선의의 날", en: "Day of Goodwill" },
  "Revolution Day": { ko: "혁명의 날", en: "Revolution Day" },
  "Statehood Day": { ko: "주 설립일", en: "Statehood Day" },
  "Armed Forces Day": { ko: "국군의 날", en: "Armed Forces Day" },
  "Valentine's Day": { ko: "발렌타인데이", en: "Valentine's Day" },
  "Mother's Day": { ko: "어머니날", en: "Mother's Day" },
  "Father's Day": { ko: "아버지날", en: "Father's Day" },
  "Halloween": { ko: "할로윈", en: "Halloween" },
  "New Year's Eve": { ko: "신정 전야", en: "New Year's Eve" }
};

// 공휴일 타입 번역
const HOLIDAY_TYPE_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  'public': { ko: '공휴일', en: 'Public Holiday' },
  'national': { ko: '국경일', en: 'National Holiday' },
  'religious': { ko: '종교 휴일', en: 'Religious Holiday' },
  'observance': { ko: '기념일', en: 'Observance' },
  'season': { ko: '절기', en: 'Season' },
  'local': { ko: '지역 휴일', en: 'Local Holiday' },
  'bank': { ko: '은행 휴일', en: 'Bank Holiday' },
  'optional': { ko: '선택 휴일', en: 'Optional Holiday' }
};

/**
 * 공휴일 이름을 번역합니다
 */
export function translateHolidayName(name: string, locale: Locale): string {
  // 정확한 매치 먼저 시도
  if (HOLIDAY_TRANSLATIONS[name]) {
    return HOLIDAY_TRANSLATIONS[name][locale] || name;
  }
  
  // 대소문자 무시하고 매치 시도
  const lowerName = name.toLowerCase();
  for (const [key, translations] of Object.entries(HOLIDAY_TRANSLATIONS)) {
    if (key.toLowerCase() === lowerName) {
      return translations[locale] || name;
    }
  }
  
  // 부분 매치 시도 (긴 것부터)
  const sortedKeys = Object.keys(HOLIDAY_TRANSLATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      const translation = HOLIDAY_TRANSLATIONS[key][locale];
      if (translation && translation !== key) {
        return translation;
      }
    }
  }
  
  return name;
}

/**
 * 공휴일 타입을 번역합니다
 */
export function translateHolidayType(type: string, locale: Locale): string {
  return HOLIDAY_TYPE_TRANSLATIONS[type]?.[locale] || type;
}

/**
 * 공휴일 객체에 번역 정보를 추가합니다
 */
export function enrichHolidayWithTranslation(holiday: any, locale: Locale) {
  return {
    ...holiday,
    translatedName: translateHolidayName(holiday.name, locale),
    translatedType: translateHolidayType(holiday.type, locale)
  };
}

/**
 * 공휴일 배열에 번역 정보를 추가합니다
 */
export function enrichHolidaysWithTranslation(holidays: any[], locale: Locale) {
  return holidays.map(holiday => enrichHolidayWithTranslation(holiday, locale));
}

/**
 * 번역 가능한 공휴일 이름 목록을 반환합니다
 */
export function getTranslatableHolidayNames(): string[] {
  return Object.keys(HOLIDAY_TRANSLATIONS);
}

/**
 * 특정 언어로 번역된 모든 공휴일 이름을 반환합니다
 */
export function getAllTranslatedHolidayNames(locale: Locale): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [original, translations] of Object.entries(HOLIDAY_TRANSLATIONS)) {
    result[original] = translations[locale] || original;
  }
  return result;
}