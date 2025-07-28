import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// 브라우저 언어 감지 함수
function detectLanguageFromHeaders(headersList: Headers): string {
  const acceptLanguage = headersList.get('accept-language');
  
  if (acceptLanguage) {
    // Accept-Language 헤더에서 언어 추출
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());
    
    // 한국어 감지
    if (languages.some(lang => lang.startsWith('ko'))) {
      return 'ko';
    }
    
    // 영어 감지
    if (languages.some(lang => lang.startsWith('en'))) {
      return 'en';
    }
  }
  
  // 기본값: 한국어
  return 'ko';
}

export default async function RootPage() {
  const headersList = headers();
  const detectedLanguage = detectLanguageFromHeaders(headersList);
  
  // 감지된 언어로 리다이렉트
  redirect(`/${detectedLanguage}`);
}