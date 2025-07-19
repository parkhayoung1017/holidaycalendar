'use client';

import { useEffect } from 'react';
import { Holiday } from '@/types';
import { HOLIDAY_TYPE_LABELS, SUPPORTED_COUNTRIES } from '@/lib/constants';

interface HolidayDetailModalProps {
  holiday: Holiday;
  isOpen: boolean;
  onClose: () => void;
}

// 날짜 포맷팅 함수
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

// 공휴일 타입에 따른 스타일 클래스
function getTypeStyle(type: Holiday['type']): string {
  switch (type) {
    case 'public':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'bank':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'school':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'optional':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function HolidayDetailModal({ holiday, isOpen, onClose }: HolidayDetailModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
  const typeStyle = getTypeStyle(holiday.type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              {countryInfo && (
                <span className="text-2xl" role="img" aria-label={`${countryInfo.name} flag`}>
                  {countryInfo.flag}
                </span>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                공휴일 상세 정보
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 본문 */}
          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {holiday.name}
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                {formatFullDate(holiday.date)}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${typeStyle}`}>
                  {HOLIDAY_TYPE_LABELS[holiday.type] || holiday.type}
                </span>
                
                {!holiday.global && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    지역별 공휴일
                  </span>
                )}
                
                {holiday.global && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    전국 공휴일
                  </span>
                )}
              </div>
            </div>
            
            {/* 설명 */}
            {holiday.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">설명</h4>
                <p className="text-gray-700 leading-relaxed">
                  {holiday.description}
                </p>
              </div>
            )}
            
            {/* 지역 정보 */}
            {!holiday.global && holiday.counties && holiday.counties.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">적용 지역</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {holiday.counties.map((county, index) => (
                      <span key={index} className="text-sm text-gray-700 bg-white px-2 py-1 rounded border">
                        {county}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    총 {holiday.counties.length}개 지역에서 적용
                  </p>
                </div>
              </div>
            )}
            
            {/* 추가 정보 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">추가 정보</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>국가: {countryInfo?.name || holiday.countryCode}</p>
                <p>공휴일 유형: {HOLIDAY_TYPE_LABELS[holiday.type] || holiday.type}</p>
                <p>적용 범위: {holiday.global ? '전국' : '지역별'}</p>
                {holiday.updatedAt && (
                  <p>정보 업데이트: {new Date(holiday.updatedAt).toLocaleDateString('ko-KR')}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 푸터 */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}