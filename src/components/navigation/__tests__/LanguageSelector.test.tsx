import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useRouter, usePathname } from 'next/navigation';
import { LanguageSelector } from '../LanguageSelector';
import { I18nProvider } from '@/lib/i18n-context';

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// 번역 로더 모킹
vi.mock('@/lib/translation-loader', () => ({
  loadTranslations: vi.fn().mockResolvedValue({
    common: {
      language: {
        selector: '언어 선택',
        current: '현재 언어',
        korean: '한국어',
        english: 'English',
        switchTo: '{{language}}로 전환',
        ko: '한국어',
        en: 'English'
      }
    }
  })
}));

// 쿠키 유틸리티 모킹
vi.mock('@/lib/cookie-utils', () => ({
  getLanguageFromCookie: vi.fn().mockReturnValue(null),
  saveLanguageToCookie: vi.fn(),
  removeLanguageCookie: vi.fn(),
}));

const mockPush = vi.fn();
const mockPathname = '/south-korea-2025';

beforeEach(() => {
  (useRouter as any).mockReturnValue({
    push: mockPush,
  });
  (usePathname as any).mockReturnValue(mockPathname);
  mockPush.mockClear();
});

// 테스트용 래퍼 컴포넌트
const TestWrapper = ({ children, initialLocale = 'ko' }: { children: React.ReactNode; initialLocale?: 'ko' | 'en' }) => (
  <I18nProvider initialLocale={initialLocale}>
    {children}
  </I18nProvider>
);

describe('LanguageSelector', () => {
  it('컴포넌트가 렌더링된다', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('language.current')).toBeInTheDocument();
    });
  });

  it('토글 스타일로 렌더링된다', async () => {
    render(
      <TestWrapper>
        <LanguageSelector variant="toggle" />
      </TestWrapper>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('드롭다운 버튼을 클릭할 수 있다', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    await waitFor(() => {
      const button = screen.getByLabelText('language.current');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});