import SearchBar from "@/components/search/SearchBar";
import MonthlyCalendar from "@/components/calendar/MonthlyCalendar";
import { POPULAR_COUNTRIES, CURRENT_YEAR, DEFAULT_METADATA } from "@/lib/constants";
import { getAllAvailableData } from "@/lib/data-loader";
import Link from "next/link";

// ISR 설정 - 6시간마다 재생성
export const revalidate = 21600;

export default async function Home() {
  // 실제 사용 가능한 데이터 확인
  const availableData = await getAllAvailableData();
  
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 메인 컨테이너 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            World Holiday Calendar
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            전세계 공휴일 정보를 한눈에 확인하세요
          </p>
          
          {/* 검색창 */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar 
              placeholder="국가명 또는 '미국 2025' 형태로 검색하세요"
              className="w-full"
            />
          </div>
          
          {/* 빠른 링크 */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/today" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              오늘의 공휴일
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href="/regions/asia/2025" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              아시아 지역
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href="/regions/europe/2025" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              유럽 지역
            </Link>
          </div>
        </div>

        {/* 이번 달 캘린더 섹션 */}
        <div className="mb-8">
          <MonthlyCalendar />
        </div>

        {/* 인기 국가 바로가기 섹션 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            인기 국가 공휴일 보기
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availablePopularCountries.map((country) => (
              <Link
                key={country.code}
                href={`/${country.name.toLowerCase().replace(/\s+/g, '-')}-${country.displayYear}`}
                className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {country.flag}
                </span>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {country.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {country.displayYear}년
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 12월인 경우 다음 연도 섹션 - 다음 연도 데이터가 있는 경우만 표시 */}
        {new Date().getMonth() === 11 && (() => {
          const nextYearCountries = availablePopularCountries.filter(country => 
            availableData[country.code] && availableData[country.code].includes(CURRENT_YEAR + 1)
          );
          
          return nextYearCountries.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-8 mb-8 text-white">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                🎉 {CURRENT_YEAR + 1}년 공휴일 미리보기
              </h2>
              <p className="text-center mb-6 opacity-90">
                새해 계획을 세우기 위해 내년 공휴일을 미리 확인해보세요
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {nextYearCountries.slice(0, 8).map((country) => (
                  <Link
                    key={`${country.code}-next-year`}
                    href={`/${country.name.toLowerCase().replace(/\s+/g, '-')}-${CURRENT_YEAR + 1}`}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium truncate">
                      {country.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 기능 소개 섹션 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">빠른 검색</h3>
            <p className="text-sm text-gray-600">
              국가명과 연도를 입력하면 즉시 해당 공휴일 정보를 확인할 수 있습니다
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-semibold text-gray-900 mb-2">전세계 정보</h3>
            <p className="text-sm text-gray-600">
              주요 30개국의 정확한 공휴일 정보를 지역별로 비교해서 볼 수 있습니다
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibent text-gray-900 mb-2">실시간 업데이트</h3>
            <p className="text-sm text-gray-600">
              매일 업데이트되는 최신 공휴일 정보로 정확한 일정 계획을 세우세요
            </p>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            여행 계획, 업무 일정, 해외 거주를 위한 필수 정보
          </p>
          <p className="text-xs text-gray-400">
            정확한 공휴일 정보로 더 나은 계획을 세우세요
          </p>
        </div>
      </div>
    </div>
  );
}