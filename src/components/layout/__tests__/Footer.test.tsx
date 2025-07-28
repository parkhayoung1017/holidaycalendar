import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Footer from '../Footer';

// ResponsiveBanner 컴포넌트 모킹
vi.mock('@/components/ads/ResponsiveBanner', () => ({
  default: () => <div data-testid="responsive-banner">광고 배너</div>
}));

// useTranslation 훅 모킹
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'footer.copyright': `© ${params?.year || '2025'} 세계 공휴일 달력. 모든 권리 보유.`,
        'footer.description': '전세계 공휴일 정보를 제공하는 서비스입니다.'
      };
      return translations[key] || key;
    },
    locale: 'ko',
    locales: ['ko', 'en'],
    isLoading: false
  })
}));

// 현재 날짜를 고정하여 테스트 일관성 확보
const mockDate = new Date('2025-01-15T10:00:00Z');
vi.setSystemTime(mockDate);

describe('Footer 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('한국어로 저작권 정보가 올바르게 표시된다', () => {
    render(<Footer />);
    
    expect(screen.getByText('© 2025 세계 공휴일 달력. 모든 권리 보유.')).toBeInTheDocument();
  });

  it('한국어로 사이트 설명이 올바르게 표시된다', () => {
    render(<Footer />);
    
    expect(screen.getByText('전세계 공휴일 정보를 제공하는 서비스입니다.')).toBeInTheDocument();
  });

  it('현재 연도가 저작권 정보에 올바르게 포함된다', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it('ResponsiveBanner 컴포넌트가 렌더링된다', () => {
    render(<Footer />);
    
    expect(screen.getByTestId('responsive-banner')).toBeInTheDocument();
  });

  it('올바른 CSS 클래스가 적용되어 있다', () => {
    const { container } = render(<Footer />);
    
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-gray-50', 'border-t', 'mt-auto');
    
    const textContainer = container.querySelector('.text-center.text-gray-600');
    expect(textContainer).toBeInTheDocument();
  });

  it('설명 텍스트에 올바른 스타일이 적용되어 있다', () => {
    render(<Footer />);
    
    const description = screen.getByText('전세계 공휴일 정보를 제공하는 서비스입니다.');
    expect(description).toHaveClass('mt-2', 'text-sm');
  });


});