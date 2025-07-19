import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Holiday, Country } from '@/types';
import { loadHolidayData, loadCountryData } from '@/lib/data-loader';
import { generateHolidayDescription, generateCountryOverview } from '@/lib/ai-content-generator';
import HolidayDetailView from '@/components/holiday/HolidayDetailView';
import RelatedHolidays from '@/components/holiday/RelatedHolidays';

interface HolidayDetailPageProps {
  params: {
    country: string;
    slug: string;
  };
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

// 슬러그로부터 공휴일을 찾는 함수
async function findHolidayBySlug(countryCode: string, slug: string, year: number): Promise<Holiday | null> {
  try {
    const holidays = await loadHolidayData(countryCode, year);
    
    return holidays.find(holiday => {
      const holidaySlug = createHolidaySlug(holiday.name);
      return holidaySlug === slug;
    }) || null;
  } catch (error) {
    console.error('공휴일 데이터 로드 실패:', error);
    return null;
  }
}

// 관련 공휴일을 찾는 함수
async function findRelatedHolidays(holiday: Holiday, limit: number = 4): Promise<Holiday[]> {
  try {
    const currentYear = new Date().getFullYear();
    const holidays = await loadHolidayData(holiday.countryCode, currentYear);
    
    // 현재 공휴일 제외하고 같은 국가의 다른 공휴일들 반환
    return holidays
      .filter(h => h.id !== holiday.id)
      .slice(0, limit);
  } catch (error) {
    console.error('관련 공휴일 로드 실패:', error);
    return [];
  }
}

export async function generateMetadata({ params }: HolidayDetailPageProps): Promise<Metadata> {
  const { country, slug } = params;
  const currentYear = new Date().getFullYear();
  
  try {
    const holiday = await findHolidayBySlug(country, slug, currentYear);
    const countryData = await loadCountryData(country);
    
    if (!holiday || !countryData) {
      return {
        title: '공휴일을 찾을 수 없습니다 - World Holiday Calendar',
        description: '요청하신 공휴일 정보를 찾을 수 없습니다.'
      };
    }
    
    const title = `${holiday.name} - ${countryData.name} 공휴일 상세 정보`;
    const description = holiday.description || 
      `${countryData.name}의 ${holiday.name}에 대한 상세 정보를 확인하세요. 날짜, 의미, 문화적 배경 등을 자세히 알아보실 수 있습니다.`;
    
    return {
      title,
      description,
      keywords: [holiday.name, countryData.name, '공휴일', '상세정보', '문화', '전통'],
      openGraph: {
        title,
        description,
        type: 'article',
        locale: 'ko_KR',
      },
      alternates: {
        canonical: `/holiday/${country}/${slug}`
      }
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return {
      title: '공휴일 정보 - World Holiday Calendar',
      description: '전세계 공휴일 정보를 확인하세요.'
    };
  }
}

export default async function HolidayDetailPage({ params }: HolidayDetailPageProps) {
  const { country, slug } = params;
  const currentYear = new Date().getFullYear();
  
  try {
    // 공휴일과 국가 데이터 로드
    const [holiday, countryData] = await Promise.all([
      findHolidayBySlug(country, slug, currentYear),
      loadCountryData(country)
    ]);
    
    if (!holiday || !countryData) {
      notFound();
    }
    
    // AI 생성 설명이 없으면 생성
    let description = holiday.description;
    if (!description || description.trim().length < 30) {
      try {
        const aiResponse = await generateHolidayDescription({
          holidayId: holiday.id,
          holidayName: holiday.name,
          countryName: countryData.name,
          date: holiday.date,
          existingDescription: holiday.description
        });
        description = aiResponse.description;
      } catch (error) {
        console.error('AI 설명 생성 실패:', error);
        description = `${holiday.name}은(는) ${countryData.name}에서 기념하는 특별한 날입니다.`;
      }
    }
    
    // 국가 개요 생성
    let countryOverview = countryData.overview;
    if (!countryOverview) {
      try {
        countryOverview = await generateCountryOverview(countryData.code, countryData.name);
      } catch (error) {
        console.error('국가 개요 생성 실패:', error);
        countryOverview = `${countryData.name}의 공휴일 제도에 대한 정보입니다.`;
      }
    }
    
    // 관련 공휴일 로드
    const relatedHolidays = await findRelatedHolidays(holiday);
    
    // 공휴일 객체에 생성된 설명 추가
    const enrichedHoliday: Holiday = {
      ...holiday,
      description
    };
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 공휴일 상세 정보 */}
          <HolidayDetailView 
            holiday={enrichedHoliday} 
            country={countryData}
            countryOverview={countryOverview}
          />
          
          {/* 관련 공휴일 추천 */}
          {relatedHolidays.length > 0 && (
            <div className="mt-12">
              <RelatedHolidays 
                holidays={relatedHolidays}
                country={countryData}
              />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('공휴일 상세 페이지 로드 실패:', error);
    notFound();
  }
}

// 정적 생성을 위한 경로 생성
export async function generateStaticParams() {
  // 개발 단계에서는 빈 배열 반환 (필요시 주요 공휴일들만 사전 생성)
  return [];
}