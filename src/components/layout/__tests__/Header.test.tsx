import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

// useTranslation 훅 모킹
vi.mock('@/hooks/useTranslation', () => ({
  useCommonTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'site.title': '세계 공휴일 달력'
      };
      return translations[key] || key;
    },
    locale: 'ko',
    locales: ['ko', 'en'],
    isLoading: false
  }),
  useNavigationTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'menu.home': '홈',
        'menu.todayHolidays': '오늘의 공휴일',
        'menu.regionHolidays': '대륙별 공휴일'
      };
      return translations[key] || key;
    },
    locale: 'ko',
    locales: ['ko', 'en'],
    isLoading: false
  })
}));

// LanguageSelector 컴포넌트 모킹
vi.mock('@/components/navigation/LanguageSelector', () => ({
  LanguageSelector: ({ variant, showLabel, className }: any) => (
    <div data-testid="language-selector" className={className}>
      <button>KO</button>
      <button>EN</button>
    </div>
  )
}));

// Next.js Link 컴포넌트 모킹
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  )
}));

describe('Header 컴포넌트', () => {
  it('사이트 제목이 번역되어 표시된다', () => {
    render(<Header />);
    
    const titleLink = screen.getByText('세계 공휴일 달력');
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
  });

  it('내비게이션 메뉴가 번역되어 표시된다', () => {
    render(<Header />);
    
    // 데스크톱 내비게이션 확인
    const homeLinks = screen.getAllByText('홈');
    const todayLinks = screen.getAllByText('오늘의 공휴일');
    const regionsLinks = screen.getAllByText('대륙별 공휴일');
    
    // 데스크톱과 모바일 버전 모두 있으므로 각각 2개씩 있어야 함
    expect(homeLinks).toHaveLength(2);
    expect(todayLinks).toHaveLength(2);
    expect(regionsLinks).toHaveLength(2);
  });

  it('언어 선택기가 올바르게 렌더링된다', () => {
    render(<Header />);
    
    // 데스크톱과 모바일 버전 모두 있어야 함
    const languageSelectors = screen.getAllByTestId('language-selector');
    expect(languageSelectors).toHaveLength(2);
    
    // KO, EN 버튼들이 있어야 함
    const koButtons = screen.getAllByText('KO');
    const enButtons = screen.getAllByText('EN');
    expect(koButtons).toHaveLength(2); // 데스크톱 + 모바일
    expect(enButtons).toHaveLength(2); // 데스크톱 + 모바일
  });

  it('올바른 링크들이 설정되어 있다', () => {
    render(<Header />);
    
    // 홈 링크들 확인
    const homeLinks = screen.getAllByTestId('link-/');
    expect(homeLinks).toHaveLength(3); // 제목 + 데스크톱 메뉴 + 모바일 메뉴
    
    // 오늘의 공휴일 링크들 확인
    const todayLinks = screen.getAllByTestId('link-/today');
    expect(todayLinks).toHaveLength(2); // 데스크톱 메뉴 + 모바일 메뉴
    
    // 지역별 공휴일 링크들 확인
    const regionsLinks = screen.getAllByTestId('link-/regions');
    expect(regionsLinks).toHaveLength(2); // 데스크톱 메뉴 + 모바일 메뉴
  });

  it('반응형 클래스가 올바르게 적용되어 있다', () => {
    render(<Header />);
    
    // 모든 내비게이션 요소들 확인
    const allNavs = screen.getAllByRole('navigation');
    expect(allNavs).toHaveLength(2);
    
    // 데스크톱 내비게이션 컨테이너 확인 (flex items-center space-x-6 클래스를 가진 nav)
    const desktopNav = allNavs.find(nav => nav.classList.contains('flex') && nav.classList.contains('items-center') && nav.classList.contains('space-x-6'));
    expect(desktopNav).toHaveClass('flex', 'items-center', 'space-x-6');
    
    // 모바일 내비게이션은 md:hidden 클래스를 가져야 함
    const mobileNav = allNavs.find(nav => nav.classList.contains('md:hidden'));
    expect(mobileNav).toHaveClass('md:hidden');
  });

  it('스타일링 클래스가 올바르게 적용되어 있다', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'border-b', 'border-gray-100');
    
    // 제목 링크는 텍스트로 찾기
    const titleLink = screen.getByText('세계 공휴일 달력');
    expect(titleLink).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
  });
});