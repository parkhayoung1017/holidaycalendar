import { Holiday, Country } from '@/types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface RelatedHolidaysProps {
  holidays: Holiday[];
  country: Country;
}

// 공휴일 슬러그를 생성하는 함수
function createHolidaySlug(holidayName: string): string {
  return holidayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 정리
    .trim();
}

export default function RelatedHolidays({ holidays, country }: RelatedHolidaysProps) {
  if (holidays.length === 0) {
    return null;
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return {
        monthDay: format(date, 'M월 d일', { locale: ko }),
        weekday: format(date, 'EEE', { locale: ko })
      };
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return {
        monthDay: dateString,
        weekday: ''
      };
    }
  };

  // 공휴일 타입별 색상
  const getTypeColor = (type: Holiday['type']) => {
    const colorMap = {
      'public': 'bg-blue-100 text-blue-800',
      'bank': 'bg-green-100 text-green-800',
      'school': 'bg-purple-100 text-purple-800',
      'optional': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <section className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">{country.flag}</span>
        <h2 className="text-2xl font-bold text-gray-900">
          {country.name}의 다른 공휴일
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((holiday) => {
          const dateInfo = formatDate(holiday.date);
          const slug = createHolidaySlug(holiday.name);
          
          return (
            <Link
              key={holiday.id}
              href={`/holiday/${country.code.toLowerCase()}/${slug}`}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {holiday.name}
                  </h3>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">
                      {dateInfo.monthDay} ({dateInfo.weekday})
                    </span>
                    {holiday.global && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        전국
                      </span>
                    )}
                  </div>
                  
                  {holiday.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {holiday.description.length > 80 
                        ? `${holiday.description.substring(0, 80)}...`
                        : holiday.description
                      }
                    </p>
                  )}
                </div>
                
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                    {holiday.type === 'public' ? '공휴일' : 
                     holiday.type === 'bank' ? '은행휴무' :
                     holiday.type === 'school' ? '학교휴무' : '선택휴일'}
                  </span>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {dateInfo.monthDay.split(' ')[1]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dateInfo.monthDay.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* 전체 공휴일 보기 링크 */}
      <div className="mt-6 pt-4 border-t">
        <Link
          href={`/${country.code.toLowerCase()}-${new Date().getFullYear()}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {country.name} 전체 공휴일 보기
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}