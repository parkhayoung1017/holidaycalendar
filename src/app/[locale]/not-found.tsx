import Link from 'next/link';
import { headers } from 'next/headers';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';

export default async function LocaleNotFound() {
  // 인기 국가 추천 (상위 6개)
  const popularCountries = SUPPORTED_COUNTRIES.slice(0, 6);
  const currentYear = new Date().getFullYear();
  
  // URL에서 locale 추출 시도
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const localeMatch = referer.match(/\/(?:ko|en)\//);
  const locale = localeMatch ? (referer.includes('/ko/') ? 'ko' : 'en') : 'ko';

  // 번역 텍스트 직접 정의
  const texts = {
    ko: {
      title: '페이지를 찾을 수 없습니다',
      description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
      goHome: '홈페이지로 이동',
      todayHolidays: '오늘의 공휴일',
      regionalHolidays: '지역별 공휴일',
      countryHolidays: '국가별 공휴일',
      popularCountries: '인기 국가',
      searchHelp: '원하는 국가나 공휴일을 찾으시려면',
      searchPage: '검색 페이지',
      searchHelpSuffix: '를 이용해보세요.'
    },
    en: {
      title: 'Page Not Found',
      description: 'The page you requested does not exist or has been moved.',
      goHome: 'Go to Homepage',
      todayHolidays: "Today's Holidays",
      regionalHolidays: 'Regional Holidays',
      countryHolidays: 'Country Holidays',
      popularCountries: 'Popular Countries',
      searchHelp: 'To find the country or holiday you want, try using the',
      searchPage: 'search page',
      searchHelpSuffix: '.'
    }
  };

  const t = texts[locale as keyof typeof texts] || texts.ko;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 아이콘 */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600">
            {t.description}
          </p>
        </div>

        {/* 홈으로 돌아가기 버튼 */}
        <div className="mb-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t.goHome}
          </Link>
        </div>

        {/* 빠른 링크 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}/today`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t.todayHolidays}
            </Link>
            <Link
              href={`/${locale}/regions`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t.regionalHolidays}
            </Link>
            <Link
              href={`/${locale}/holiday`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t.countryHolidays}
            </Link>
          </div>
        </div>

        {/* 인기 국가 추천 */}
        <div className="border-t pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t.popularCountries}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {popularCountries.map((country) => (
              <Link
                key={country.code}
                href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${currentYear}`}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-sm"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{country.flag}</span>
                  <span className="font-medium text-gray-900">{country.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            {t.searchHelp}{' '}
            <Link href={`/${locale}`} className="text-blue-600 hover:underline">
              {t.searchPage}
            </Link>
            {t.searchHelpSuffix}
          </p>
        </div>
      </div>
    </div>
  );
}