'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function SidebarBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="sidebar" className={className} />;
  }

  return (
    <AdBanner
      slot="3738924634"
      style={{
        display: 'inline-block',
        width: '300px',
        height: '600px'
      }}
      className={`sidebar-banner ${className}`}
    />
  );
}