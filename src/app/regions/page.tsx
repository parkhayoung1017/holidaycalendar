import { Metadata } from 'next';
import Link from 'next/link';
import { REGIONS, CURRENT_YEAR } from '@/lib/constants';
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: '대륙별 공휴일 비교 - World Holiday Calendar',
  description: '전세계 대륙별로 공휴일을 비교해보세요. 아시아, 유럽, 북미, 오세아니아 등 각 대륙의 국가별 공휴일을 한눈에 확인할 수 있습니다.',
  keywords: [
    '대륙별 공휴일',
    '공휴일 비교',
    '아시아 공휴일',
    '유럽 공휴일',
    '북미 공휴일',
    '해외 공휴일'
  ],
  openGraph: {
    title: '대륙별 공휴일 비교 - World Holiday Calendar',
    description: '전세계 대륙별로 공휴일을 비교해보세요.',
    type: 'website',
  },
};

export default function RegionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">홈</Link>
            <span>›</span>
            <span className="text-gray-900">대륙별 공휴일</span>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              대륙별 공휴일 비교
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              전세계 주요 대륙의 국가별 공휴일을 비교해보세요. 
              같은 대륙 내 국가들의 공휴일을 한눈에 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 지역 카드 그리드 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REGIONS
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((region) => {
              const regionSlug = region.name.toLowerCase().replace(/\s+/g, '-');
              
              return (
                <div
                  key={region.name}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {region.displayName}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {region.countries.length}개 국가
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {region.displayName} 대륙의 {region.countries.length}개 국가 공휴일을 비교해보세요.
                    </p>
                    
                    {/* 연도 선택 버튼들 */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                          <Link
                            key={year}
                            href={`/regions/${regionSlug}/${year}`}
                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                              year === CURRENT_YEAR
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {year}년
                          </Link>
                        ))}
                      </div>
                      
                      <Link
                        href={`/regions/${regionSlug}/${CURRENT_YEAR}`}
                        className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        {region.displayName} 공휴일 보기 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* 추가 정보 섹션 */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            대륙별 공휴일 비교 기능
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">국가별 테이블 비교</h3>
                <p className="text-sm text-gray-600">
                  같은 지역 내 국가들의 공휴일을 테이블 형태로 비교할 수 있습니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">같은 날짜 그룹화</h3>
                <p className="text-sm text-gray-600">
                  여러 국가에서 같은 날짜에 기념하는 공휴일을 그룹으로 표시합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">월별 필터링</h3>
                <p className="text-sm text-gray-600">
                  특정 월의 공휴일만 필터링하여 볼 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}