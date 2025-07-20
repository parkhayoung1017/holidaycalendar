'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function ResponsiveBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="responsive" className={className} />;
  }

  return (
    <AdBanner
      slot="1653216146"
      format="auto"
      responsive={true}
      className={`responsive-banner ${className}`}
    />
  );
}