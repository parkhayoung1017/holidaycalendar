import { Metadata } from 'next';
import { getHolidaysByDate } from '@/lib/data-loader';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import TodayHolidaysView from '@/components/today/TodayHolidaysView';
import { generateTodayHolidaysMetadata } from '@/lib/seo-utils';
import StructuredData from '@/components/seo/StructuredData';
import { ErrorMessages } from '@/components/error/ErrorMessage';
import { logError } from '@/lib/error-logger';
import ResponsiveBanner from '@/components/ads/ResponsiveBanner';
import InlineBanner from '@/components/ads/InlineBanner';

// 현재 날짜를 ISO 형식으로 가져오는 함수
function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
}

// 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  const todayISO = getTodayISO();
  
  try {
    // 오늘의 공휴일 데이터를 로드하여 정확한 메타데이터 생성
    const todayHolidays = await getHolidaysByDate(todayISO);
    return generateTodayHolidaysMetadata(todayHolidays);
  } catch (error) {
    console.error('오늘의 공휴일 메타데이터 생성 중 오류:', error);
    
    // 폴백 메타데이터
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      title: `오늘의 공휴일 (${todayFormatted}) - World Holiday Calendar`,
      description: `${todayFormatted} 오늘 공휴일인 국가들을 확인하세요. 전세계 공휴일 정보를 실시간으로 제공합니다.`,
      keywords: ['오늘의 공휴일', '오늘 휴일', '실시간 공휴일', '전세계 공휴일', 'today holiday']
    };
  }
}

export default async function TodayPage() {
  const todayISO = getTodayISO();
  
  try {
    // 오늘 날짜의 공휴일 데이터 로드
    const todayHolidays = await getHolidaysByDate(todayISO);
    
    // 국가 정보 매핑
    const holidaysWithCountryInfo = todayHolidays.map(holiday => {
      const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
      return {
        ...holiday,
        countryName: countryInfo?.name || holiday.country,
        countryFlag: countryInfo?.flag || '🏳️',
      };
    });

    return (
      <div className="min-h-screen bg-gray-50">
        {holidaysWithCountryInfo.length > 0 && (
          <StructuredData 
            type="holiday" 
            data={{
              holidays: holidaysWithCountryInfo,
              date: todayISO,
              type: 'today'
            }}
          />
        )}
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 상단 광고 */}
          <div className="mb-8 flex justify-center">
            <ResponsiveBanner />
          </div>
          
          <TodayHolidaysView 
            holidays={holidaysWithCountryInfo}
            date={todayISO}
          />
          
          {/* 하단 광고 */}
          <div className="mt-8 flex justify-center">
            <InlineBanner />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // 에러 로깅
    logError(error as Error, {
      operation: 'TodayPage',
      date: todayISO,
      timestamp: new Date().toISOString()
    });

    // 에러 발생 시 폴백 UI 표시
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              오늘의 공휴일
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <ErrorMessages.ApiFailure 
            onRetry={() => window.location.reload()} 
          />
        </div>
      </div>
    );
  }
}

// 페이지를 매시간 재생성하도록 설정 (ISR)
export const revalidate = 3600; // 1시간