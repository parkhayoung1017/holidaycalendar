'use client';

import { useState, useEffect } from 'react';
import { MONTH_NAMES, DAY_NAMES, CURRENT_YEAR, SUPPORTED_COUNTRIES } from '@/lib/constants';
import { Holiday } from '@/types';
import { getCountrySlugFromCode, createHolidaySlug } from '@/lib/country-utils';
import { useI18nContext } from '@/lib/i18n-context';

interface CalendarHoliday {
  date: string;
  name: string;
  country: string;
  countryCode?: string;
  flag: string;
}

interface MonthlyCalendarProps {
  year?: number;
  month?: number; // 0-11 (JavaScript Date month format)
  holidays?: Holiday[];
  className?: string;
  locale?: string;
}

export default function MonthlyCalendar({ 
  year = CURRENT_YEAR, 
  month = new Date().getMonth(),
  holidays = [],
  className = "",
  locale = "ko"
}: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [showAllHolidays, setShowAllHolidays] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [displayYear, setDisplayYear] = useState(year);
  const [displayMonth, setDisplayMonth] = useState(month);
  const [dynamicHolidays, setDynamicHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [holidayCache, setHolidayCache] = useState<Record<string, Holiday[]>>({});
  const { translations } = useI18nContext();

  useEffect(() => {
    setCurrentDate(new Date());
    setIsClient(true);
  }, []);

  // 동적으로 공휴일 데이터 로드하는 함수 (캐싱 적용) - 모든 국가 포함
  const loadDynamicHolidays = async (year: number, month: number) => {
    const cacheKey = `${year}-${month}`;
    
    // 캐시에서 먼저 확인
    if (holidayCache[cacheKey]) {
      console.log('📅 캐시에서 공휴일 로드:', { year, month: month + 1, cached: true });
      setDynamicHolidays(holidayCache[cacheKey]);
      return;
    }

    setIsLoadingHolidays(true);
    try {
      // 모든 국가의 공휴일 데이터를 API로 로드
      const response = await fetch(`/api/holidays/monthly?year=${year}&month=${month + 1}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('📅 전세계 공휴일 로드 완료:', {
          year,
          month: month + 1,
          totalHolidays: result.total,
          message: result.message,
          sampleHolidays: result.data.slice(0, 5).map((h: any) => ({ 
            name: h.name, 
            date: h.date, 
            country: h.countryCode 
          }))
        });

        // 캐시에 저장
        setHolidayCache(prev => ({
          ...prev,
          [cacheKey]: result.data
        }));

        setDynamicHolidays(result.data);
      } else {
        throw new Error(result.error || '알 수 없는 에러');
      }
    } catch (error) {
      console.error('전세계 공휴일 로드 실패:', error);
      setDynamicHolidays([]);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  // displayYear나 displayMonth가 변경될 때마다 동적으로 공휴일 로드
  useEffect(() => {
    // 초기 월(props로 전달받은 월)이 아닌 경우에만 동적 로드
    if (displayYear !== year || displayMonth !== month) {
      loadDynamicHolidays(displayYear, displayMonth);
    }
  }, [displayYear, displayMonth, year, month]);

  // 이전달로 이동
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayYear(displayYear - 1);
      setDisplayMonth(11);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  // 다음달로 이동
  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayYear(displayYear + 1);
      setDisplayMonth(0);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  // 국가명 번역 함수
  const translateCountryName = (countryCode: string): string => {
    // 직접 번역 매핑 사용 (더 안정적)
    const countryTranslations: Record<string, { ko: string; en: string }> = {
      'KR': { ko: '대한민국', en: 'South Korea' },
      'JP': { ko: '일본', en: 'Japan' },
      'CN': { ko: '중국', en: 'China' },
      'US': { ko: '미국', en: 'United States' },
      'GB': { ko: '영국', en: 'United Kingdom' },
      'DE': { ko: '독일', en: 'Germany' },
      'FR': { ko: '프랑스', en: 'France' },
      'IT': { ko: '이탈리아', en: 'Italy' },
      'ES': { ko: '스페인', en: 'Spain' },
      'NL': { ko: '네덜란드', en: 'Netherlands' },
      'CA': { ko: '캐나다', en: 'Canada' },
      'AU': { ko: '호주', en: 'Australia' },
      'BR': { ko: '브라질', en: 'Brazil' },
      'AR': { ko: '아르헨티나', en: 'Argentina' },
      'SG': { ko: '싱가포르', en: 'Singapore' },
      'IN': { ko: '인도', en: 'India' },
      'MX': { ko: '멕시코', en: 'Mexico' },
      'NZ': { ko: '뉴질랜드', en: 'New Zealand' },
      'ZA': { ko: '남아프리카공화국', en: 'South Africa' },
      'EG': { ko: '이집트', en: 'Egypt' },
      'ME': { ko: '몬테네그로', en: 'Montenegro' },
      'CL': { ko: '칠레', en: 'Chile' },
      'LS': { ko: '레소토', en: 'Lesotho' },
      'GM': { ko: '감비아', en: 'Gambia' },
      'PR': { ko: '푸에르토리코', en: 'Puerto Rico' },
      'SM': { ko: '산마리노', en: 'San Marino' },
      'IE': { ko: '아일랜드', en: 'Ireland' },
      'RU': { ko: '러시아', en: 'Russia' },
      'MY': { ko: '말레이시아', en: 'Malaysia' }
    };
    
    const translation = countryTranslations[countryCode];
    if (translation) {
      return locale === 'ko' ? translation.ko : translation.en;
    }
    
    // 번역이 없으면 translations.countries에서 시도
    if (locale === 'ko' && translations?.countries?.[countryCode]) {
      return translations.countries[countryCode];
    }
    
    // SUPPORTED_COUNTRIES에서 영어 이름 찾기
    const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
    if (countryInfo) {
      return locale === 'en' ? countryInfo.name : countryInfo.name;
    }
    
    // 마지막으로 국가 코드 반환
    return countryCode;
  };
  
  // 월별 샘플 공휴일 데이터 생성 함수
  const generateSampleHolidays = (year: number, month: number): CalendarHoliday[] => {
    const holidays: CalendarHoliday[] = [];
    const isKorean = locale === 'ko';
    
    // 공휴일 이름 번역 매핑
    const holidayNames = {
      'new-years-day': { ko: '신정', en: "New Year's Day" },
      'australia-day': { ko: '호주의 날', en: 'Australia Day' },
      'valentines-day': { ko: '발렌타인데이', en: "Valentine's Day" },
      'foundation-day': { ko: '건국기념일', en: 'Foundation Day' },
      'independence-movement-day': { ko: '삼일절', en: 'Independence Movement Day' },
      'st-patricks-day': { ko: '성 패트릭의 날', en: "St. Patrick's Day" },
      'april-fools-day': { ko: '만우절', en: "April Fool's Day" },
      'st-georges-day': { ko: '성 조지의 날', en: "St. George's Day" },
      'labour-day': { ko: '근로자의 날', en: 'Labour Day' },
      'childrens-day': { ko: '어린이날', en: "Children's Day" },
      'victory-day': { ko: '승전기념일', en: 'Victory Day' },
      'memorial-day': { ko: '현충일', en: 'Memorial Day' },
      'flag-day': { ko: '국기의 날', en: 'Flag Day' },
      'independence-day': { ko: '독립기념일', en: 'Independence Day' },
      'canada-day': { ko: '캐나다 데이', en: 'Canada Day' }, // 누락된 캐나다 데이 추가
      'bastille-day': { ko: '바스티유 데이', en: 'Bastille Day' },
      'constitution-day': { ko: '제헌절', en: 'Constitution Day' },
      'liberation-day': { ko: '광복절', en: 'Liberation Day' },
      'chuseok': { ko: '추석', en: 'Chuseok (Harvest Festival)' },
      'double-ninth-festival': { ko: '중양절', en: 'Double Ninth Festival' },
      'national-foundation-day': { ko: '개천절', en: 'National Foundation Day' },
      'hangeul-day': { ko: '한글날', en: 'Hangeul Day' },
      'halloween': { ko: '할로윈', en: 'Halloween' },
      'veterans-day': { ko: '재향군인의 날', en: 'Veterans Day' },
      'thanksgiving': { ko: '추수감사절', en: 'Thanksgiving' },
      'christmas-day': { ko: '크리스마스', en: 'Christmas Day' },
      'new-years-eve': { ko: '신정 전야', en: "New Year's Eve" }
    };
    
    // 월별 공휴일 데이터
    const monthlyHolidays: Record<number, Array<{day: number, nameKey: string, country: string, flag: string}>> = {
      0: [ // 1월
        { day: 1, nameKey: 'new-years-day', country: 'KR', flag: '🇰🇷' },
        { day: 1, nameKey: 'new-years-day', country: 'US', flag: '🇺🇸' },
        { day: 26, nameKey: 'australia-day', country: 'AU', flag: '🇦🇺' }
      ],
      1: [ // 2월
        { day: 14, nameKey: 'valentines-day', country: 'US', flag: '🇺🇸' },
        { day: 11, nameKey: 'foundation-day', country: 'JP', flag: '🇯🇵' }
      ],
      2: [ // 3월
        { day: 1, nameKey: 'independence-movement-day', country: 'KR', flag: '🇰🇷' },
        { day: 17, nameKey: 'st-patricks-day', country: 'IE', flag: '🇮🇪' }
      ],
      3: [ // 4월
        { day: 1, nameKey: 'april-fools-day', country: 'US', flag: '🇺🇸' },
        { day: 23, nameKey: 'st-georges-day', country: 'GB', flag: '🇬🇧' }
      ],
      4: [ // 5월
        { day: 1, nameKey: 'labour-day', country: 'KR', flag: '🇰🇷' },
        { day: 5, nameKey: 'childrens-day', country: 'KR', flag: '🇰🇷' },
        { day: 8, nameKey: 'victory-day', country: 'RU', flag: '🇷🇺' }
      ],
      5: [ // 6월
        { day: 6, nameKey: 'memorial-day', country: 'KR', flag: '🇰🇷' },
        { day: 14, nameKey: 'flag-day', country: 'US', flag: '🇺🇸' }
      ],
      6: [ // 7월
        { day: 4, nameKey: 'independence-day', country: 'US', flag: '🇺🇸' },
        { day: 14, nameKey: 'bastille-day', country: 'FR', flag: '🇫🇷' },
        { day: 17, nameKey: 'constitution-day', country: 'KR', flag: '🇰🇷' }
      ],
      7: [ // 8월
        { day: 15, nameKey: 'liberation-day', country: 'KR', flag: '🇰🇷' },
        { day: 31, nameKey: 'independence-day', country: 'MY', flag: '🇲🇾' }
      ],
      8: [ // 9월
        { day: 3, nameKey: 'chuseok', country: 'KR', flag: '🇰🇷' },
        { day: 9, nameKey: 'double-ninth-festival', country: 'CN', flag: '🇨🇳' }
      ],
      9: [ // 10월
        { day: 3, nameKey: 'national-foundation-day', country: 'KR', flag: '🇰🇷' },
        { day: 9, nameKey: 'hangeul-day', country: 'KR', flag: '🇰🇷' },
        { day: 31, nameKey: 'halloween', country: 'US', flag: '🇺🇸' }
      ],
      10: [ // 11월
        { day: 11, nameKey: 'veterans-day', country: 'US', flag: '🇺🇸' },
        { day: 23, nameKey: 'thanksgiving', country: 'US', flag: '🇺🇸' }
      ],
      11: [ // 12월
        { day: 25, nameKey: 'christmas-day', country: 'US', flag: '🇺🇸' },
        { day: 25, nameKey: 'christmas-day', country: 'GB', flag: '🇬🇧' },
        { day: 31, nameKey: 'new-years-eve', country: 'US', flag: '🇺🇸' }
      ]
    };

    const currentMonthHolidays = monthlyHolidays[month] || [];
    
    currentMonthHolidays.forEach(holiday => {
      // 해당 월의 날짜가 실제로 존재하는지 확인
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      if (holiday.day <= lastDayOfMonth) {
        const holidayName = holidayNames[holiday.nameKey as keyof typeof holidayNames];
        const calendarHoliday = {
          date: getLocalDateString(new Date(year, month, holiday.day)),
          name: holidayName ? holidayName[isKorean ? 'ko' : 'en'] : holiday.nameKey,
          country: holiday.country,
          flag: holiday.flag
        };
        
        // 디버깅: 생성된 공휴일 객체 확인
        console.log('📅 샘플 공휴일 생성:', {
          originalHoliday: holiday,
          calendarHoliday,
          holidayName,
          isKorean,
          selectedName: holidayName ? holidayName[isKorean ? 'ko' : 'en'] : holiday.nameKey
        });
        
        holidays.push(calendarHoliday);
      }
    });

    console.log('📅 생성된 전체 샘플 공휴일:', {
      year,
      month,
      totalHolidays: holidays.length,
      holidays
    });

    return holidays;
  };

  // 로컬 시간대 기준으로 날짜 문자열 생성
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 공휴일 이름 번역 함수
  const translateHolidayName = (originalName: string, countryCode: string): string => {
    if (locale === 'en') return originalName;
    
    // 일반적인 공휴일 번역 매핑 (확장된 버전)
    const commonTranslations: Record<string, string> = {
      "New Year's Day": "신정",
      "Christmas Day": "크리스마스",
      "Christmas": "크리스마스",
      "Easter": "부활절",
      "Easter Sunday": "부활절",
      "Easter Monday": "부활절 월요일",
      "Good Friday": "성금요일",
      "Labour Day": "근로자의 날",
      "Labor Day": "근로자의 날",
      "Independence Day": "독립기념일",
      "National Day": "국경일",
      "Thanksgiving": "추수감사절",
      "Thanksgiving Day": "추수감사절",
      "Valentine's Day": "발렌타인데이",
      "Mother's Day": "어머니날",
      "Father's Day": "아버지날",
      "Children's Day": "어린이날",
      "Halloween": "할로윈",
      "New Year's Eve": "신정 전야",
      "Memorial Day": "현충일",
      "Veterans Day": "재향군인의 날",
      "Martin Luther King Jr. Day": "마틴 루터 킹 주니어 데이",
      "Presidents' Day": "대통령의 날",
      "Columbus Day": "콜럼버스 데이",
      "Boxing Day": "박싱 데이",
      "Australia Day": "호주의 날",
      "Canada Day": "캐나다 데이",
      "Bastille Day": "바스티유 데이",
      "St. Patrick's Day": "성 패트릭의 날",
      "St. George's Day": "성 조지의 날",
      "Victory Day": "승전기념일",
      "Constitution Day": "제헌절",
      "Liberation Day": "광복절",
      "Foundation Day": "건국기념일",
      "Flag Day": "국기의 날",
      "Carnival": "카니발",
      "Tiradentes": "티라덴치스",
      "Corpus Christi": "성체 성혈 대축일",
      "Our Lady of Aparecida": "아파레시다 성모 대축일",
      "All Souls' Day": "위령의 날",
      "Republic Proclamation Day": "공화국 선포일",
      "Black Awareness Day": "흑인 의식의 날",
      // 화면에 보이는 추가 공휴일들
      "Revolution Day": "혁명의 날",
      "Statehood Day": "주 설립일",
      "Constitutionalist Revolution of 1932": "1932년 입헌주의 혁명",
      "Orangemen's Day": "오렌지맨의 날",
      "Battle of the Boyne": "보인 전투 기념일",
      "Our Lady of Mount Carmel": "갈멜산의 성모 마리아",
      "King Letsie III's Birthday": "레치에 3세 국왕 탄신일",
      "Marine Day": "바다의 날",
      "Birthday of Don Luis Muñoz Rivera": "돈 루이스 무뇨스 리베라 탄신일",
      "Santiago Apóstol": "성 야고보 사도 축일",
      "Armed Forces Day": "국군의 날",
      "June 30 Revolution": "6월 30일 혁명",
      "Revolution Day 2011 National Police Day": "2011년 혁명의 날 국가경찰의 날",
      "Sinai Liberation Day": "시나이 해방의 날",
      "Saint Olav's Day": "성 올라프의 날",
      "Liberation from Fascism": "파시즘 해방의 날",
      "Day of the Cantabrian Institutions": "칸타브리아 기관의 날",
      "Birthday of Dr. José Celso Barbosa": "호세 셀소 바르보사 박사 탄신일",
      "Saint Olav's Eve": "성 올라프 전야",
      "Tynwald Day": "틴월드 데이"
    };
    
    // 정확한 매치 먼저 시도
    if (commonTranslations[originalName]) {
      return commonTranslations[originalName];
    }
    
    // 부분 매치 시도 (더 구체적인 것부터)
    const sortedKeys = Object.keys(commonTranslations).sort((a, b) => b.length - a.length);
    for (const english of sortedKeys) {
      if (originalName.toLowerCase().includes(english.toLowerCase())) {
        return commonTranslations[english];
      }
    }
    
    return originalName; // 번역을 찾지 못하면 원본 반환
  };

  // 실제 공휴일 데이터를 캘린더 형식으로 변환
  const convertToCalendarHolidays = (holidays: Holiday[]): CalendarHoliday[] => {
    return holidays.map(holiday => {
      // 국가 코드로 플래그 찾기
      const country = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
      return {
        date: holiday.date,
        name: translateHolidayName(holiday.name, holiday.countryCode),
        country: holiday.countryCode,
        flag: country?.flag || '🌍'
      };
    });
  };

  const sampleHolidays = generateSampleHolidays(displayYear, displayMonth);
  const realHolidays = convertToCalendarHolidays(holidays);
  const dynamicRealHolidays = convertToCalendarHolidays(dynamicHolidays);
  
  // 우선순위: 동적 공휴일 > 초기 공휴일 > 샘플 공휴일
  const displayHolidays = dynamicRealHolidays.length > 0 
    ? dynamicRealHolidays 
    : (realHolidays.length > 0 ? realHolidays : sampleHolidays);

  // 달력 데이터 생성
  const generateCalendarData = () => {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const startDate = new Date(firstDay);
    
    // 월요일부터 시작하도록 조정 (0=일요일, 1=월요일)
    const firstDayOfWeek = firstDay.getDay();
    const mondayStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - mondayStart);
    
    const days = [];
    
    // 6주 * 7일 = 42일 생성
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = getLocalDateString(date);
      const dayHolidays = displayHolidays.filter(h => h.date === dateString);
      
      days.push({
        date: date,
        dateString: dateString,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === displayMonth,
        isToday: isClient && currentDate ? date.toDateString() === currentDate.toDateString() : false,
        holidays: dayHolidays
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarData();

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="이전 달"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">
            {displayYear}년 {MONTH_NAMES.ko[displayMonth]}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="다음 달"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {isLoadingHolidays ? (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              전세계 공휴일 로딩 중...
            </span>
          ) : dynamicRealHolidays.length > 0 ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              전세계 {dynamicRealHolidays.length}개 공휴일
              <span className="text-xs text-gray-400 ml-1">
                ({new Set(dynamicRealHolidays.map(h => h.country)).size}개국)
              </span>
            </span>
          ) : realHolidays.length > 0 ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              전세계 {realHolidays.length}개 공휴일
              <span className="text-xs text-gray-400 ml-1">
                ({new Set(realHolidays.map(h => h.country)).size}개국)
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              샘플 데이터
            </span>
          )}
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
          <div 
            key={day} 
            className={`text-center text-sm font-medium py-2 ${
              index === 5 || index === 6 ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={`${day.dateString}-${index}`}
            className={`
              min-h-[80px] p-2 border border-gray-100 rounded-lg relative
              ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
              ${day.holidays.length > 0 ? 'bg-red-50 border-red-200' : ''}
              hover:bg-gray-50 transition-colors cursor-pointer
            `}
          >
            {/* 날짜 */}
            <div className={`text-sm font-medium mb-1 ${
              day.isToday ? 'text-blue-600' : 
              !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {day.day}
            </div>

            {/* 공휴일 표시 */}
            {day.holidays.length > 0 && (
              <div className="space-y-1">
                {day.holidays.slice(0, 2).map((holiday, holidayIndex) => (
                  <div
                    key={`${holiday.date}-${holidayIndex}`}
                    className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate hover:bg-red-200 cursor-pointer transition-colors"
                    title={`${holiday.country}: ${holiday.name} - 클릭하여 상세보기`}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // 디버깅을 위한 상세 로그
                      console.log('🔍 공휴일 클릭 디버깅:', {
                        holiday,
                        holidayName: holiday?.name,
                        holidayCountry: holiday?.country,
                        holidayFlag: holiday?.flag,
                        holidayType: typeof holiday,
                        holidayKeys: holiday ? Object.keys(holiday) : 'holiday is null/undefined',
                        isHolidayEmpty: Object.keys(holiday || {}).length === 0
                      });
                      
                      // holiday 객체 자체가 비어있는지 확인
                      if (!holiday || Object.keys(holiday).length === 0) {
                        console.error('❌ URL 생성 실패: holiday 객체가 비어있습니다', { holiday });
                        return;
                      }
                      
                      if (!holiday.name || !holiday.country) {
                        console.error('❌ URL 생성 실패: 공휴일 데이터가 불완전합니다', { 
                          holiday,
                          hasName: !!holiday.name,
                          hasCountry: !!holiday.country
                        });
                        return;
                      }
                      
                      const slug = createHolidaySlug(holiday.name);
                      const countrySlug = getCountrySlugFromCode(holiday.country);
                      
                      if (!countrySlug || !slug) {
                        console.error('❌ URL 생성 실패:', { 
                          holidayName: holiday.name, 
                          country: holiday.country, 
                          countrySlug, 
                          slug,
                          slugFunction: typeof createHolidaySlug,
                          countryFunction: typeof getCountrySlugFromCode
                        });
                        return;
                      }
                      
                      const targetUrl = `/${locale}/holiday/${countrySlug}/${slug}`;
                      console.log('✅ MonthlyCalendar 링크 클릭 성공:', {
                        locale,
                        holiday: holiday.name,
                        country: holiday.country,
                        countrySlug,
                        slug,
                        targetUrl
                      });
                      window.location.href = targetUrl;
                    }}
                  >
                    <span className="mr-1">{holiday.flag}</span>
                    {holiday.name.length > 8 ? 
                      `${holiday.name.substring(0, 8)}...` : 
                      holiday.name
                    }
                  </div>
                ))}
                {day.holidays.length > 2 && (
                  <div 
                    className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // 첫 번째 공휴일로 이동 (또는 모든 공휴일을 보여주는 페이지로 이동)
                      const firstHoliday = day.holidays[0];
                      
                      console.log('🔍 "더보기" 클릭 디버깅:', {
                        firstHoliday,
                        totalHolidays: day.holidays.length,
                        allHolidays: day.holidays
                      });
                      
                      if (!firstHoliday || !firstHoliday.name || !firstHoliday.country) {
                        console.error('❌ "더보기" URL 생성 실패: 첫 번째 공휴일 데이터가 불완전합니다', { firstHoliday });
                        return;
                      }
                      
                      const slug = createHolidaySlug(firstHoliday.name);
                      const countrySlug = getCountrySlugFromCode(firstHoliday.country);
                      
                      if (!countrySlug || !slug) {
                        console.error('❌ "더보기" URL 생성 실패:', { 
                          holidayName: firstHoliday.name, 
                          country: firstHoliday.country, 
                          countrySlug, 
                          slug 
                        });
                        return;
                      }
                      
                      const targetUrl = `/${locale}/holiday/${countrySlug}/${slug}`;
                      console.log('✅ "더보기" 링크 클릭 성공:', { targetUrl });
                      window.location.href = targetUrl;
                    }}
                  >
                    +{day.holidays.length - 2}개 더
                  </div>
                )}
              </div>
            )}

            {/* 오늘 표시 */}
            {day.isToday && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
          <span>공휴일</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
          <span>다른 달</span>
        </div>
      </div>

      {/* 이번 달 공휴일 목록 */}
      {displayHolidays.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200" data-component="MonthlyCalendar-HolidayList">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                이번 달 공휴일 ({displayHolidays.length}개)
              </h4>
              {displayHolidays.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  전세계 {new Set(displayHolidays.map(h => h.country || h.countryCode)).size}개국의 공휴일
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAllHolidays(!showAllHolidays)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showAllHolidays ? '접기' : '전체보기'}
              <svg 
                className={`w-3 h-3 transition-transform ${showAllHolidays ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {(showAllHolidays ? displayHolidays : displayHolidays.slice(0, 3))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((holiday, index) => {
                const holidayDate = new Date(holiday.date);
                const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.country);
                const countryName = translateCountryName(holiday.country);
                
                return (
                  <div 
                    key={`holiday-${index}`} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      // 공휴일 상세 페이지로 이동
                      const slug = createHolidaySlug(holiday.name);
                      // 국가 코드를 국가 슬러그로 변환
                      const countrySlug = getCountrySlugFromCode(holiday.country);
                      
                      if (!countrySlug || !slug) {
                        console.error('URL 생성 실패:', { holiday: holiday.name, country: holiday.country, countrySlug, slug });
                        return;
                      }
                      
                      const targetUrl = `/${locale}/holiday/${countrySlug}/${slug}`;
                      
                      // 디버깅: URL 생성 확인
                      console.log('🚀 하단 목록 클릭:', {
                        originalName: holiday.name,
                        country: holiday.country,
                        slug,
                        countrySlug,
                        targetUrl,
                        // 추가 디버깅 정보
                        slugValid: slug && slug.length > 0,
                        countrySlugValid: countrySlug && countrySlug.length > 0,
                        urlParts: targetUrl.split('/')
                      });
                      
                      window.location.href = targetUrl;
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[40px]">
                        <div className="text-lg font-semibold text-gray-900">
                          {holidayDate.getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {holidayDate.toLocaleDateString('ko-KR', { weekday: 'short' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{holiday.flag}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {holiday.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {countryName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {!showAllHolidays && displayHolidays.length > 3 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              {displayHolidays.length - 3}개 공휴일 더 보기
            </div>
          )}
        </div>
      )}
    </div>
  );
}