import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CountryFlag: React.FC<CountryFlagProps> = ({ 
  countryCode, 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-8 h-6'
  };

  // 윈도우에서 국기 이모지가 깨지는 경우를 대비한 폴백
  const getFlagEmoji = (code: string) => {
    const flagMap: { [key: string]: string } = {
      'KR': '🇰🇷',
      'JP': '🇯🇵', 
      'CN': '🇨🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'SG': '🇸🇬'
    };
    return flagMap[code] || '🏳️';
  };

  // 브라우저가 국기 이모지를 지원하는지 확인
  const supportsFlags = () => {
    if (typeof window === 'undefined') return true;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    ctx.fillText('🇰🇷', 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 픽셀 데이터가 있으면 지원함
    return imageData.data.some(pixel => pixel !== 0);
  };

  // SVG 폴백 사용
  if (typeof window !== 'undefined' && !supportsFlags()) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded ${sizeClasses[size]} ${className}`}
        title={`${countryCode} flag`}
      >
        {countryCode}
      </div>
    );
  }

  return (
    <span 
      className={`inline-block ${className}`}
      style={{ fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : '24px' }}
      title={`${countryCode} flag`}
    >
      {getFlagEmoji(countryCode)}
    </span>
  );
};

export default CountryFlag;