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
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
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