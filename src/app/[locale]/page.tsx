import { notFound } from 'next/navigation';
import { Locale } from '@/types/i18n';
import { POPULAR_COUNTRIES, CURRENT_YEAR } from "@/lib/constants";
import { getAllAvailableData, getHolidaysByMonth } from "@/lib/data-loader";
import { conditionalWarmCache } from "@/lib/cache-warmer";
import HomePageContent from "@/components/home/HomePageContent";

// ISR 설정 - 6시간마다 재생성
export const revalidate = 21600;

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  
  // 언어 검증
  if (locale !== 'ko' && locale !== 'en') {
    notFound();
  }
  
  const validLocale = locale as Locale;
  
  // 병렬로 데이터 로딩 및 캐시 워밍 (성능 개선)
  const [availableData, monthlyHolidays] = await Promise.all([
    getAllAvailableData(),
    (async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      return await getHolidaysByMonth(currentYear, currentMonth);
    })(),
    // 백그라운드에서 캐시 워밍 실행 (페이지 로딩을 차단하지 않음)
    conditionalWarmCache().catch(error => {
      console.warn('캐시 워밍 실패 (무시됨):', error);
      return null;
    })
  ]);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // 인기 국가 중에서 실제 데이터가 있는 것들만 필터링
  const availablePopularCountries = POPULAR_COUNTRIES.filter(country => 
    availableData[country.code] && availableData[country.code].length > 0
  ).map(country => {
    const availableYears = availableData[country.code];
    // 현재 연도 데이터가 있으면 현재 연도, 없으면 가장 가까운 연도 사용
    let targetYear = CURRENT_YEAR;
    if (!availableYears.includes(CURRENT_YEAR)) {
      // 현재 연도가 없으면 가장 가까운 연도 찾기
      const sortedYears = availableYears.sort((a, b) => Math.abs(a - CURRENT_YEAR) - Math.abs(b - CURRENT_YEAR));
      targetYear = sortedYears[0];
    }
    
    return {
      ...country,
      displayYear: targetYear
    };
  });

  return (
    <HomePageContent
      availablePopularCountries={availablePopularCountries}
      availableData={availableData}
      currentYear={currentYear}
      currentMonth={currentMonth}
      monthlyHolidays={monthlyHolidays}
      locale={validLocale}
    />
  );
}