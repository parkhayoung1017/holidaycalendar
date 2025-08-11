'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  slot: string;
  format?: string;
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export default function AdBanner({ 
  slot, 
  format = 'auto', 
  style, 
  className = '',
  responsive = false 
}: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // 광고 로드 전에 컨테이너 크기 확인
        const timer = setTimeout(() => {
          const adContainer = document.querySelector(`[data-ad-slot="${slot}"]`);
          if (adContainer) {
            const rect = adContainer.getBoundingClientRect();
            if (rect.width === 0) {
              console.warn(`AdSense 경고: 슬롯 ${slot}의 컨테이너 너비가 0입니다.`);
              return;
            }
          }
          
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }, 100);

        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [slot]);

  return (
    <div className={`ad-container ${className}`} style={{ minWidth: '250px', width: '100%' }}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minWidth: '250px',
          ...style
        }}
        data-ad-client="ca-pub-9099299007950279"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive && { 'data-full-width-responsive': 'true' })}
      />
    </div>
  );
}