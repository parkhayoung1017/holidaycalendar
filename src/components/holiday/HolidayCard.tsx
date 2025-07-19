'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Holiday } from '@/types';
import { HOLIDAY_TYPE_LABELS } from '@/lib/constants';
import HolidayDetailModal from './HolidayDetailModal';

interface HolidayCardProps {
  holiday: Holiday;
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

// 날짜 포맷팅 함수
function formatDate(dateString: string): { day: string; weekday: string; fullDate: string } {
  const date = new Date(dateString);
  const day = date.getDate().toString();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  const fullDate = `${date.getMonth() + 1}월 ${day}일`;
  
  return { day, weekday, fullDate };
}

// 공휴일 타입에 따른 스타일 클래스
function getTypeStyle(type: Holiday['type']): string {
  switch (type) {
    case 'public':
      return 'bg-green-100 text-green-800';
    case 'bank':
      return 'bg-blue-100 text-blue-800';
    case 'school':
      return 'bg-yellow-100 text-yellow-800';
    case 'optional':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function HolidayCard({ holiday }: HolidayCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { day, weekday } = formatDate(holiday.date);
  const typeStyle = getTypeStyle(holiday.type);
  const slug = createHolidaySlug(holiday.name);
  const detailUrl = `/holiday/${holiday.countryCode.toLowerCase()}/${slug}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // 모달 버튼 클릭 시에는 상세 페이지로 이동하지 않음
    if ((e.target as HTMLElement).closest('.modal-trigger')) {
      e.preventDefault();
      setIsModalOpen(true);
      return;
    }
  };

  return (
    <>
      <Link href={detailUrl} className="block">
        <div 
          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-start gap-4">
            {/* 날짜 표시 */}
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl font-bold text-gray-900">{day}</div>
              <div className="text-sm text-gray-500">{weekday}</div>
            </div>
            
            {/* 공휴일 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                    {holiday.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle}`}>
                      {HOLIDAY_TYPE_LABELS[holiday.type] || holiday.type}
                    </span>
                    
                    {!holiday.global && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        지역별
                      </span>
                    )}
                  </div>
                  
                  {holiday.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {holiday.description.length > 100 
                        ? `${holiday.description.substring(0, 100)}...`
                        : holiday.description
                      }
                    </p>
                  )}
                  
                  {!holiday.global && holiday.counties && holiday.counties.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      적용 지역: {holiday.counties.slice(0, 3).join(', ')}
                      {holiday.counties.length > 3 && ` 외 ${holiday.counties.length - 3}곳`}
                    </p>
                  )}
                </div>
                
                {/* 액션 버튼들 */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {/* 빠른 보기 버튼 (모달) */}
                  <button
                    className="modal-trigger p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    title="빠른 보기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  
                  {/* 상세 보기 화살표 */}
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* 상세 정보 모달 (빠른 보기용) */}
      <HolidayDetailModal 
        holiday={holiday}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}