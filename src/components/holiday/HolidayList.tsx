import { Holiday } from '@/types';
import { HOLIDAY_TYPE_LABELS, MONTH_NAMES } from '@/lib/constants';
import HolidayCard from './HolidayCard';

interface HolidayListProps {
  holidays: Holiday[];
}

// 월별로 공휴일을 그룹화하는 함수
function groupHolidaysByMonth(holidays: Holiday[]): Record<number, Holiday[]> {
  return holidays.reduce((groups, holiday) => {
    const month = new Date(holiday.date).getMonth() + 1; // 1-12
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(holiday);
    return groups;
  }, {} as Record<number, Holiday[]>);
}

// 날짜 포맷팅 함수
function formatDate(dateString: string): { day: string; weekday: string } {
  const date = new Date(dateString);
  const day = date.getDate().toString();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  
  return { day, weekday };
}

export default function HolidayList({ holidays }: HolidayListProps) {
  if (!holidays || holidays.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">공휴일 정보가 없습니다</h3>
        <p className="text-gray-500">해당 연도의 공휴일 데이터를 준비 중입니다.</p>
      </div>
    );
  }

  const holidaysByMonth = groupHolidaysByMonth(holidays);
  const months = Object.keys(holidaysByMonth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {months.map(month => (
        <div key={month} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {MONTH_NAMES.ko[month - 1]}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({holidaysByMonth[month].length}개)
              </span>
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {holidaysByMonth[month].map(holiday => (
              <HolidayCard key={holiday.id} holiday={holiday} />
            ))}
          </div>
        </div>
      ))}
      
      {/* 통계 정보 */}
      <div className="bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          총 {holidays.length}개의 공휴일
        </h3>
        <div className="flex justify-center gap-6 text-sm text-blue-700">
          <span>
            공휴일: {holidays.filter(h => h.type === 'public').length}개
          </span>
          <span>
            선택휴무일: {holidays.filter(h => h.type === 'optional').length}개
          </span>
          <span>
            기타: {holidays.filter(h => !['public', 'optional'].includes(h.type)).length}개
          </span>
        </div>
      </div>
    </div>
  );
}