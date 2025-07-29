'use client';

import { useTranslation } from '@/hooks/useTranslation';

interface MobileBannerProps {
  className?: string;
}

export default function MobileBanner({ className = '' }: MobileBannerProps) {
  const { locale } = useTranslation();
  
  // 한국어 로케일인지 확인
  const isKorean = locale === 'ko';
  
  return (
    <div className={`w-full flex justify-center py-4 ${className}`}>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isKorean ? (
          // 한글 버전
          <iframe 
            src="https://kr.trip.com/partners/ad/DB4637733?Allianceid=6781790&SID=239224763&trip_sub1=" 
            style={{width: '250px', height: '250px'}} 
            id="DB4637733"
            title="Trip.com 한국 모바일 제휴 광고"
          />
        ) : (
          // 영어 버전
          <iframe 
            src="https://www.trip.com/partners/ad/DB4637740?Allianceid=6781790&SID=239224763&trip_sub1=" 
            style={{width: '250px', height: '250px'}} 
            id="DB4637740"
            title="Trip.com English Mobile Affiliate Ad"
          />
        )}
      </div>
    </div>
  );
}