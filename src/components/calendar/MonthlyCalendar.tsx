'use client';

import { useState, useEffect } from 'react';
import { MONTH_NAMES, DAY_NAMES, CURRENT_YEAR } from '@/lib/constants';

interface Holiday {
  date: string;
  name: string;
  country: string;
  flag: string;
}

interface MonthlyCalendarProps {
  year?: number;
  month?: number; // 0-11 (JavaScript Date month format)
  holidays?: Holiday[];
  className?: string;
}

export default function MonthlyCalendar({ 
  year = CURRENT_YEAR, 
  month = new Date().getMonth(),
  holidays = [],
  className = ""
}: MonthlyCalendarProps) {
  const [currentDate] = useState(new Date());
  
  // 월별 샘플 공휴일 데이터 생성 함수
  const generateSampleHolidays = (year: number, month: number): Holiday[] => {
    const holidays: Holiday[] = [];
    
    // 월별 공휴일 데이터
    const monthlyHolidays: Record<number, Array<{day: number, name: string, country: string, flag: string}>> = {
      0: [ // 1월
        { day: 1, name: '신정', country: 'KR', flag: '🇰🇷' },
        { day: 1, name: 'New Year\'s Day', country: 'US', flag: '🇺🇸' },
        { day: 26, name: 'Australia Day', country: 'AU', flag: '🇦🇺' }
      ],
      1: [ // 2월
        { day: 14, name: 'Valentine\'s Day', country: 'US', flag: '🇺🇸' },
        { day: 11, name: '건국기념일', country: 'JP', flag: '🇯🇵' }
      ],
      2: [ // 3월
        { day: 1, name: '삼일절', country: 'KR', flag: '🇰🇷' },
        { day: 17, name: 'St. Patrick\'s Day', country: 'IE', flag: '🇮🇪' }
      ],
      3: [ // 4월
        { day: 1, name: 'April Fool\'s Day', country: 'US', flag: '🇺🇸' },
        { day: 23, name: 'St. George\'s Day', country: 'GB', flag: '🇬🇧' }
      ],
      4: [ // 5월
        { day: 1, name: '근로자의 날', country: 'KR', flag: '🇰🇷' },
        { day: 5, name: '어린이날', country: 'KR', flag: '🇰🇷' },
        { day: 8, name: 'Victory Day', country: 'RU', flag: '🇷🇺' }
      ],
      5: [ // 6월
        { day: 6, name: '현충일', country: 'KR', flag: '🇰🇷' },
        { day: 14, name: 'Flag Day', country: 'US', flag: '🇺🇸' }
      ],
      6: [ // 7월
        { day: 4, name: 'Independence Day', country: 'US', flag: '🇺🇸' },
        { day: 14, name: 'Bastille Day', country: 'FR', flag: '🇫🇷' },
        { day: 17, name: '제헌절', country: 'KR', flag: '🇰🇷' }
      ],
      7: [ // 8월
        { day: 15, name: '광복절', country: 'KR', flag: '🇰🇷' },
        { day: 31, name: 'Independence Day', country: 'MY', flag: '🇲🇾' }
      ],
      8: [ // 9월
        { day: 3, name: '추석', country: 'KR', flag: '🇰🇷' },
        { day: 9, name: '중양절', country: 'CN', flag: '🇨🇳' }
      ],
      9: [ // 10월
        { day: 3, name: '개천절', country: 'KR', flag: '🇰🇷' },
        { day: 9, name: '한글날', country: 'KR', flag: '🇰🇷' },
        { day: 31, name: 'Halloween', country: 'US', flag: '🇺🇸' }
      ],
      10: [ // 11월
        { day: 11, name: 'Veterans Day', country: 'US', flag: '🇺🇸' },
        { day: 23, name: 'Thanksgiving', country: 'US', flag: '🇺🇸' }
      ],
      11: [ // 12월
        { day: 25, name: 'Christmas Day', country: 'US', flag: '🇺🇸' },
        { day: 25, name: 'Christmas Day', country: 'GB', flag: '🇬🇧' },
        { day: 31, name: 'New Year\'s Eve', country: 'US', flag: '🇺🇸' }
      ]
    };

    const currentMonthHolidays = monthlyHolidays[month] || [];
    
    currentMonthHolidays.forEach(holiday => {
      // 해당 월의 날짜가 실제로 존재하는지 확인
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      if (holiday.day <= lastDayOfMonth) {
        holidays.push({
          date: new Date(year, month, holiday.day).toISOString().split('T')[0],
          name: holiday.name,
          country: holiday.country,
          flag: holiday.flag
        });
      }
    });

    return holidays;
  };

  const sampleHolidays = generateSampleHolidays(year, month);
  const displayHolidays = holidays.length > 0 ? holidays : sampleHolidays;

  // 달력 데이터 생성
  const generateCalendarData = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // 월요일부터 시작하도록 조정 (0=일요일, 1=월요일)
    const firstDayOfWeek = firstDay.getDay();
    const mondayStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - mondayStart);
    
    const days = [];
    const today = new Date();
    
    // 6주 * 7일 = 42일 생성
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayHolidays = displayHolidays.filter(h => h.date === dateString);
      
      days.push({
        date: date,
        dateString: dateString,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
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
        <h3 className="text-xl font-semibold text-gray-900">
          {year}년 {MONTH_NAMES.ko[month]}
        </h3>
        <div className="text-sm text-gray-500">
          오늘의 공휴일 확인
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
                    className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate"
                    title={`${holiday.country}: ${holiday.name}`}
                  >
                    <span className="mr-1">{holiday.flag}</span>
                    {holiday.name.length > 8 ? 
                      `${holiday.name.substring(0, 8)}...` : 
                      holiday.name
                    }
                  </div>
                ))}
                {day.holidays.length > 2 && (
                  <div className="text-xs text-gray-500">
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

      {/* 이번 달 주요 공휴일 요약 */}
      {displayHolidays.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            이번 달 주요 공휴일
          </h4>
          <div className="space-y-2">
            {displayHolidays.slice(0, 3).map((holiday, index) => (
              <div key={`summary-${index}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{holiday.flag}</span>
                  <span className="text-gray-900">{holiday.name}</span>
                </div>
                <span className="text-gray-500">
                  {new Date(holiday.date).getDate()}일
                </span>
              </div>
            ))}
            {displayHolidays.length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                총 {displayHolidays.length}개의 공휴일이 있습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}