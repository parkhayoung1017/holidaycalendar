'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';

// 불필요한 함수 제거됨 - 깔끔한 로딩만 사용

export default function PageTransition() {
  const pathname = usePathname();
  const { showLoading, hideLoading, setProgress } = useLoading();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // 페이지 변경 시작 - 즉시 로딩 표시
    const handleStart = () => {
      setIsTransitioning(true);
      
      // 즉시 깔끔한 로딩 표시 (메시지 없음)
      showLoading();
      
      // 빠른 진행률 시뮬레이션
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20; // 더 빠른 진행
        if (progress > 90) {
          progress = 90;
          clearInterval(progressInterval);
        }
        setProgress(progress);
      }, 50); // 더 자주 업데이트

      // 최소 로딩 시간 단축 (400ms)
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          hideLoading();
          setIsTransitioning(false);
        }, 100); // 완료 애니메이션도 단축
      }, 400);
    };

    // 페이지 변경 감지
    if (pathname) {
      handleStart();
    }
  }, [pathname, showLoading, hideLoading, setProgress]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

// 링크 클릭 시 로딩 표시를 위한 커스텀 Link 컴포넌트
export function LoadingLink({ 
  href, 
  children, 
  className = '',
  ...props 
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { showLoading } = useLoading();

  const handleClick = (e: React.MouseEvent) => {
    // 외부 링크나 같은 페이지 링크는 로딩 표시하지 않음
    if (href.startsWith('http') || href.startsWith('#')) {
      return;
    }

    // 깔끔한 로딩 표시 (메시지 없음)
    showLoading();
  };

  return (
    <a 
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}