import { Locale } from '@/types/i18n';

/**
 * 쿠키 관련 유틸리티 함수들
 */

/**
 * 쿠키에서 언어 설정을 가져오는 함수
 * @returns 저장된 언어 코드 또는 null
 */
export function getLanguageFromCookie(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cookies = document.cookie.split(';');
    const languageCookie = cookies.find(cookie => 
      cookie.trim().startsWith('preferred-language=')
    );

    if (languageCookie) {
      const value = languageCookie.split('=')[1]?.trim();
      if (value === 'ko' || value === 'en') {
        return value as Locale;
      }
    }
  } catch (error) {
    console.warn('쿠키에서 언어 설정을 가져올 수 없습니다:', error);
  }

  return null;
}

/**
 * 쿠키에 언어 설정을 저장하는 함수
 * @param locale 저장할 언어 코드
 */
export function saveLanguageToCookie(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // 쿠키 만료일을 1년으로 설정
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    const cookieString = [
      `preferred-language=${locale}`,
      `expires=${expires.toUTCString()}`,
      'path=/',
      'SameSite=Lax'
    ].join('; ');

    document.cookie = cookieString;
  } catch (error) {
    console.warn('쿠키에 언어 설정을 저장할 수 없습니다:', error);
  }
}

/**
 * 언어 설정 쿠키를 삭제하는 함수
 */
export function removeLanguageCookie(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    document.cookie = 'preferred-language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } catch (error) {
    console.warn('언어 설정 쿠키를 삭제할 수 없습니다:', error);
  }
}