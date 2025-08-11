/**
 * 윈도우 환경에서 국기 이모지 호환성을 위한 유틸리티
 */

// 브라우저가 국기 이모지를 지원하는지 확인
export const supportsFlagEmojis = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return false;
    
    // 한국 국기 이모지로 테스트
    ctx.font = '16px Arial';
    ctx.fillText('🇰🇷', 0, 16);
    
    const imageData = ctx.getImageData(0, 0, 20, 20);
    
    // 픽셀 데이터가 있으면 지원함
    return imageData.data.some(pixel => pixel !== 0);
  } catch (error) {
    console.warn('Flag emoji support detection failed:', error);
    return false;
  }
};

// 국가 코드를 국기 이모지로 변환
export const getCountryFlag = (countryCode: string): string => {
  const code = countryCode.toUpperCase();
  
  // 국가 코드를 유니코드 국기 이모지로 변환
  const codePoints = code
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

// 폴백 국기 표시 (윈도우용)
export const getFallbackFlag = (countryCode: string, countryName: string): string => {
  return `[${countryCode}]`;
};

// 국기 표시 (자동 폴백 포함)
export const displayFlag = (countryCode: string, countryName: string): string => {
  if (supportsFlagEmojis()) {
    return getCountryFlag(countryCode);
  } else {
    return getFallbackFlag(countryCode, countryName);
  }
};

// 주요 국가들의 국기 이모지 매핑 (성능 최적화용)
export const POPULAR_FLAGS: { [key: string]: string } = {
  'KR': '🇰🇷',
  'JP': '🇯🇵',
  'CN': '🇨🇳',
  'US': '🇺🇸',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'SG': '🇸🇬',
  'TH': '🇹🇭',
  'VN': '🇻🇳',
  'MY': '🇲🇾',
  'PH': '🇵🇭',
  'ID': '🇮🇩',
  'IN': '🇮🇳',
  'TW': '🇹🇼',
  'HK': '🇭🇰'
};

// 빠른 국기 조회
export const getPopularFlag = (countryCode: string): string | null => {
  return POPULAR_FLAGS[countryCode.toUpperCase()] || null;
};