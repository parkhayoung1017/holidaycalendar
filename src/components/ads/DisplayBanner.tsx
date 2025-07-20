'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function DisplayBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="display" className={className} />;
  }

  return (
    <AdBanner
      slot="9723277859"
      style={{
        display: 'inline-block',
        width: '728px',
        height: '90px'
      }}
      className={`display-banner ${className}`}
    />
  );
}