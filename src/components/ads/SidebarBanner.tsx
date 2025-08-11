'use client';

import AdBanner from './AdBanner';
import AdPlaceholder from './AdPlaceholder';

export default function SidebarBanner({ className = '' }: { className?: string }) {
  // 개발 환경에서는 플레이스홀더 표시
  if (process.env.NODE_ENV === 'development') {
    return <AdPlaceholder type="sidebar" className={className} />;
  }

  return (
    <div className={`w-full max-w-[300px] min-w-[250px] ${className}`}>
      <AdBanner
        slot="3738924634"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '300px',
          minWidth: '250px',
          height: '600px'
        }}
        className="sidebar-banner"
      />
    </div>
  );
}