'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function DisplayBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="display" className={className} />;
  }

  return (
    <div className={`w-full max-w-[728px] min-w-[320px] ${className}`}>
      <AdBanner
        slot="9723277859"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '728px',
          minWidth: '320px',
          height: '90px'
        }}
        className="display-banner"
      />
    </div>
  );
}