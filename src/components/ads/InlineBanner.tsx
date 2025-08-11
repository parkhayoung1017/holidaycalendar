'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function InlineBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="inline" className={className} />;
  }

  return (
    <div className={`w-full min-w-[300px] ${className}`}>
      <AdBanner
        slot="6905542827"
        format="autorelaxed"
        style={{
          display: 'block',
          width: '100%',
          minWidth: '300px',
          minHeight: '250px'
        }}
        className="inline-banner"
        responsive={true}
      />
    </div>
  );
}