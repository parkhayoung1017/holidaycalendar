import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Holiday, Country } from '@/types';
import { Locale } from '@/types/i18n';
import { loadHolidayData, loadCountryData } from '@/lib/data-loader';
import { generateHolidayDescription, generateCountryOverview } from '@/lib/ai-content-generator-enhanced';
import { generateImprovedHolidayDescription } from '@/lib/ai-content-generator-improved';
import { getCountryCodeFromSlug, createHolidaySlug } from '@/lib/country-utils';
import HolidayDetailView from '@/components/holiday/HolidayDetailView';
import RelatedHolidays from '@/components/holiday/RelatedHolidays';
import StructuredData from '@/components/seo/StructuredData';

interface HolidayDetailPageProps {
  params: Promise<{
    locale: string;
    country: string;
    slug: string;
  }>;
}



// 슬러그로부터 공휴일을 찾는 함수
async function findHolidayBySlug(countryCode: string, slug: string, year: number): Promise<Holiday | null> {
  try {
    const holidays = await loadHolidayData(countryCode, year);
    
    console.log('findHolidayBySlug 디버깅:', {
      countryCode,
      slug,
      year,
      totalHolidays: holidays.length,
      holidayNames: holidays.slice(0, 5).map(h => h.name),
      holidaySlugs: holidays.slice(0, 5).map(h => createHolidaySlug(h.name))
    });
    
    const found = holidays.find(holiday => {
      const holidaySlug = createHolidaySlug(holiday.name);
      const isMatch = holidaySlug === slug;
      if (isMatch) {
        console.log('공휴일 매칭 성공:', { holidayName: holiday.name, holidaySlug, targetSlug: slug });
      }
      return isMatch;
    });
    
    if (!found) {
      console.log('공휴일 매칭 실패:', {
        targetSlug: slug,
        availableSlugs: holidays.map(h => createHolidaySlug(h.name))
      });
    }
    
    return found || null;
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
  const { locale, country, slug } = await params;
  const currentYear = new Date().getFullYear();
  
  // 언어 검증
  const validLocale = (locale === 'ko' || locale === 'en') ? locale as Locale : 'ko';
  
  // 국가 슬러그를 국가 코드로 변환
  const countryCode = getCountryCodeFromSlug(country);
  if (!countryCode) {
    return {
      title: (validLocale === 'ko' ? '찾을 수 없음' : 'Not Found') + ' - World Holiday Calendar',
      description: validLocale === 'ko' ? '찾을 수 없음' : 'Not Found'
    };
  }
  
  try {
    const holiday = await findHolidayBySlug(countryCode, slug, currentYear);
    const countryData = await loadCountryData(countryCode);
    
    if (!holiday || !countryData) {
      return {
        title: (validLocale === 'ko' ? '찾을 수 없음' : 'Not Found') + ' - World Holiday Calendar',
        description: validLocale === 'ko' ? '찾을 수 없음' : 'Not Found'
      };
    }
    
    const holidayDetailsText = validLocale === 'ko' ? '공휴일 상세정보' : 'Holiday Details';
    const publicHolidayText = validLocale === 'ko' ? '공휴일' : 'Public Holiday';
    
    const title = `${holiday.name} - ${countryData.name} ${holidayDetailsText}`;
    const description = holiday.description || 
      (validLocale === 'ko' 
        ? `${countryData.name}의 ${holiday.name}에 대한 상세 정보를 확인하세요.`
        : `Check detailed information about ${holiday.name} in ${countryData.name}.`
      );
    
    return {
      title,
      description,
      keywords: [holiday.name, countryData.name, publicHolidayText],
      openGraph: {
        title,
        description,
        type: 'article',
        locale: validLocale === 'ko' ? 'ko_KR' : 'en_US',
      },
      alternates: {
        canonical: `/${validLocale}/holiday/${country}/${slug}`,
        languages: {
          'ko': `/ko/holiday/${country}/${slug}`,
          'en': `/en/holiday/${country}/${slug}`,
        }
      }
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return {
      title: 'Holiday Information - World Holiday Calendar',
      description: 'Check worldwide holiday information.'
    };
  }
}

export default async function HolidayDetailPage({ params }: HolidayDetailPageProps) {
  const { locale, country, slug } = await params;
  const currentYear = new Date().getFullYear();
  
  // 언어 검증
  const validLocale = (locale === 'ko' || locale === 'en') ? locale as Locale : 'ko';
  
  // 국가 슬러그를 국가 코드로 변환
  const countryCode = getCountryCodeFromSlug(country);
  if (!countryCode) {
    notFound();
  }
  
  try {
    // 공휴일과 국가 데이터 로드
    const [holiday, countryData] = await Promise.all([
      findHolidayBySlug(countryCode, slug, currentYear),
      loadCountryData(countryCode)
    ]);
    
    if (!holiday || !countryData) {
      notFound();
    }
    
    // 개선된 AI 생성 설명 시스템 사용 (다국어 지원)
    let description = holiday.description;
    console.log('🔍 공휴일 설명 생성 디버깅:', {
      holidayName: holiday.name,
      countryName: countryData.name,
      existingDescription: description,
      existingLength: description?.length || 0
    });
    
    if (!description || description.trim().length < 100) {
      try {
        console.log('📝 AI 설명 생성 시작...');
        
        // 먼저 개선된 시스템 시도
        const improvedResponse = await generateImprovedHolidayDescription({
          holidayId: holiday.id,
          holidayName: holiday.name,
          countryName: countryData.name,
          date: holiday.date,
          existingDescription: holiday.description
        }, validLocale);
        
        description = improvedResponse.description;
        console.log('✅ 개선된 AI 시스템 응답:', {
          confidence: improvedResponse.confidence,
          descriptionLength: description.length,
          preview: description.substring(0, 100) + '...'
        });
        
        // 개선된 시스템에서도 충분한 설명을 얻지 못한 경우 기존 시스템 시도
        if (description.length < 100) {
          console.log('⚠️ 개선된 시스템 결과 부족, 기존 시스템 시도...');
          const fallbackResponse = await generateHolidayDescription({
            holidayId: holiday.id,
            holidayName: holiday.name,
            countryName: countryData.name,
            date: holiday.date,
            existingDescription: holiday.description
          }, validLocale);
          
          if (fallbackResponse.description.length > description.length) {
            description = fallbackResponse.description;
            console.log('✅ 기존 시스템 사용:', {
              confidence: fallbackResponse.confidence,
              descriptionLength: description.length
            });
          }
        }
      } catch (error) {
        console.error('❌ AI 설명 생성 실패:', error);
        // 다국어 폴백 메시지
        if (validLocale === 'en') {
          description = `${holiday.name} is a special day celebrated in ${countryData.name}. This holiday holds cultural significance and is observed with traditional ceremonies and family gatherings.`;
        } else {
          description = `${holiday.name}은(는) ${countryData.name}에서 기념하는 특별한 날입니다. 이 날에는 전통적인 의식과 함께 가족들이 모여 의미 있는 시간을 보내며, 문화적 가치를 이어가는 소중한 기회가 됩니다.`;
        }
        console.log('🔄 폴백 설명 사용:', description.substring(0, 100) + '...');
      }
    } else {
      console.log('✅ 기존 설명 사용 (충분한 길이)');
    }
    
    // 국가 개요 생성 (다국어 지원)
    let countryOverview = countryData.overview;
    if (!countryOverview) {
      try {
        countryOverview = await generateCountryOverview(countryData.code, countryData.name, validLocale);
      } catch (error) {
        console.error('국가 개요 생성 실패:', error);
        // 다국어 폴백 메시지
        if (validLocale === 'en') {
          countryOverview = `Information about ${countryData.name}'s holiday system.`;
        } else {
          countryOverview = `${countryData.name}의 공휴일 제도에 대한 정보입니다.`;
        }
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
        {/* 구조화된 데이터 추가 */}
        <StructuredData 
          type="holiday" 
          data={{
            holiday: enrichedHoliday,
            country: countryData
          }}
          locale={validLocale}
        />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 공휴일 상세 정보 */}
          <HolidayDetailView 
            holiday={enrichedHoliday} 
            country={countryData}
            countryOverview={countryOverview}
            locale={validLocale}
          />
          
          {/* 관련 공휴일 추천 */}
          {relatedHolidays.length > 0 && (
            <div className="mt-12">
              <RelatedHolidays 
                holidays={relatedHolidays}
                country={countryData}
                locale={validLocale}
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

// 정적 생성을 위한 경로 생성 (SSG)
export async function generateStaticParams() {
  const params: Array<{ locale: string; country: string; slug: string }> = [];
  
  try {
    const { getAllAvailableData } = await import('@/lib/data-loader');
    const { getCountrySlugFromCode } = await import('@/lib/country-utils');
    const availableData = await getAllAvailableData();
    const currentYear = new Date().getFullYear();
    const locales = ['ko', 'en'];
    
    // 인기 국가들의 현재 연도 공휴일만 사전 생성
    const popularCountries = ['US', 'GB', 'DE', 'FR', 'JP', 'KR'];
    
    for (const locale of locales) {
      for (const countryCode of popularCountries) {
        if (availableData[countryCode]?.includes(currentYear)) {
          try {
            const holidays = await loadHolidayData(countryCode, currentYear);
            const countrySlug = getCountrySlugFromCode(countryCode);
            
            // 각 공휴일에 대한 경로 생성
            for (const holiday of holidays.slice(0, 10)) { // 국가당 최대 10개 공휴일만
              const slug = createHolidaySlug(holiday.name);
              params.push({
                locale,
                country: countrySlug,
                slug
              });
            }
          } catch (error) {
            console.error(`Failed to generate params for ${countryCode}:`, error);
          }
        }
      }
    }
    
    console.log(`✅ Generated ${params.length} static paths for localized holiday detail pages`);
  } catch (error) {
    console.error('Failed to generate holiday detail static params:', error);
  }
  
  return params;
}

// ISR 설정 - 24시간마다 재생성
export const revalidate = 86400;