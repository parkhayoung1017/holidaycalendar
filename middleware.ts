import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 이미 locale이 포함된 경로는 그대로 통과 (pathname 헤더 추가)
  if (pathname.startsWith('/ko/') || pathname.startsWith('/en/')) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }
  
  // 정적 파일들은 그대로 통과
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/ads.txt'
  ) {
    return NextResponse.next();
  }
  
  // Accept-Language 헤더에서 언어 감지 함수
  const detectLocale = () => {
    const acceptLanguage = request.headers.get('accept-language') || '';
    return acceptLanguage.includes('ko') ? 'ko' : 'en';
  };
  
  // 루트 경로는 기본 언어로 리다이렉트
  if (pathname === '/') {
    const locale = detectLocale();
    const response = NextResponse.redirect(new URL(`/${locale}`, request.url));
    response.headers.set('x-pathname', `/${locale}`);
    return response;
  }
  
  // 특정 경로들 처리 (regions, today, holiday 등)
  const knownPaths = [
    '/regions',
    '/today',
    '/holiday'
  ];
  
  // 알려진 경로들에 대한 리다이렉트 (정확한 매치와 하위 경로 모두 처리)
  for (const knownPath of knownPaths) {
    if (pathname === knownPath || pathname.startsWith(knownPath + '/')) {
      const locale = detectLocale();
      const newPath = `/${locale}${pathname}`;
      const response = NextResponse.redirect(new URL(newPath, request.url));
      response.headers.set('x-pathname', newPath);
      return response;
    }
  }
  
  // country-year 패턴 감지 (예: /united-kingdom-2025, /china-2025)
  const countryYearPattern = /^\/([a-z-]+)-(\d{4})$/;
  if (countryYearPattern.test(pathname)) {
    const locale = detectLocale();
    const newPath = `/${locale}${pathname}`;
    const response = NextResponse.redirect(new URL(newPath, request.url));
    response.headers.set('x-pathname', newPath);
    return response;
  }
  
  // 지역 패턴 감지 (예: /asia, /europe)
  const regionPattern = /^\/(?:asia|europe|north-america|south-america|africa|oceania)(?:\/.*)?$/;
  if (regionPattern.test(pathname)) {
    const locale = detectLocale();
    const newPath = `/${locale}/regions${pathname}`;
    const response = NextResponse.redirect(new URL(newPath, request.url));
    response.headers.set('x-pathname', newPath);
    return response;
  }
  
  // 국가 이름 패턴 감지 (하이픈으로 연결된 단어들, 연도 없음)
  const countryPattern = /^\/([a-z-]+)$/;
  if (countryPattern.test(pathname)) {
    const locale = detectLocale();
    // 국가 이름으로 추정되는 경우 holiday 경로로 리다이렉트
    const newPath = `/${locale}/holiday${pathname}`;
    const response = NextResponse.redirect(new URL(newPath, request.url));
    response.headers.set('x-pathname', newPath);
    return response;
  }
  
  // 기타 모든 경로는 기본 언어 추가
  const locale = detectLocale();
  const newPath = `/${locale}${pathname}`;
  const response = NextResponse.redirect(new URL(newPath, request.url));
  response.headers.set('x-pathname', newPath);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)',
  ],
};