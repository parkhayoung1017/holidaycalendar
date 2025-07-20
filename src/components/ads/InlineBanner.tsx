'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function InlineBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="inline" className={className} />;
  }

  return (
    <AdBanner
      slot="6905542827"
      format="autorelaxed"
      className={`inline-banner ${className}`}
    />
  );
}