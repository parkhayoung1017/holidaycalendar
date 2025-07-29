'use client';

import { useTranslation } from '@/hooks/useTranslation';
import MobileBanner from './MobileBanner';

interface SideBannerProps {
  className?: string;
}

export default function SideBanner({ className = '' }: SideBannerProps) {
  const { locale } = useTranslation();
  
  // 한국어 로케일인지 확인
  const isKorean = locale === 'ko';
  
  return (
    <>
      {/* 데스크톱용 사이드 배너 */}
      <div className={`hidden lg:block fixed right-4 top-1/2 transform -translate-y-1/2 z-10 ${className}`}>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {isKorean ? (
            // 한글 버전
            <iframe 
              src="https://kr.trip.com/partners/ad/DB4636438?Allianceid=6781790&SID=239224763&trip_sub1=" 
              style={{width: '120px', height: '600px'}} 
              id="DB4636438"
              title="Trip.com 한국 제휴 광고"
            />
          ) : (
            // 영어 버전
            <iframe 
              src="https://www.trip.com/partners/ad/DB4636459?Allianceid=6781790&SID=239224763&trip_sub1=" 
              style={{width: '120px', height: '600px'}} 
              id="DB4636459"
              title="Trip.com English Affiliate Ad"
            />
          )}
        </div>
      </div>
      
      {/* 모바일/태블릿용 배너 */}
      <div className="lg:hidden">
        <MobileBanner />
      </div>
    </>
  );
}