import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CountryStats from '../CountryStats';
import { AdminDashboardStats } from '@/types/admin';

const mockStats: AdminDashboardStats = {
  totalHolidays: 1000,
  totalDescriptions: 800,
  aiGeneratedCount: 750,
  manualCount: 50,
  completionRate: 80.0,
  recentModifications: [],
  countryStats: [
    {
      country: 'United States',
      total: 100,
      completed: 95,
      rate: 95.0
    },
    {
      country: 'South Korea',
      total: 50,
      completed: 40,
      rate: 80.0
    },
    {
      country: 'Japan',
      total: 80,
      completed: 60,
      rate: 75.0
    },
    {
      country: 'Germany',
      total: 60,
      completed: 30,
      rate: 50.0
    }
  ]
};

describe('CountryStats', () => {
  it('국가별 통계를 올바르게 표시한다', () => {
    render(<CountryStats stats={mockStats} />);
    
    // 제목 확인
    expect(screen.getByText('국가별 완료율')).toBeInTheDocument();
    
    // 국가명 확인
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('South Korea')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
  });

  it('완료율을 올바르게 표시한다', () => {
    render(<CountryStats stats={mockStats} />);
    
    // 완료율 확인
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('완료/전체 수를 올바르게 표시한다', () => {
    render(<CountryStats stats={mockStats} />);
    
    // 완료/전체 수 확인
    expect(screen.getByText('95/100')).toBeInTheDocument();
    expect(screen.getByText('40/50')).toBeInTheDocument();
    expect(screen.getByText('60/80')).toBeInTheDocument();
    expect(screen.getByText('30/60')).toBeInTheDocument();
  });

  it('완료율이 낮은 순서로 정렬된다', () => {
    render(<CountryStats stats={mockStats} />);
    
    const countryElements = screen.getAllByText(/United States|South Korea|Japan|Germany/);
    
    // 첫 번째는 완료율이 가장 낮은 Germany여야 함
    expect(countryElements[0]).toHaveTextContent('Germany');
  });

  it('빈 통계일 때 적절한 메시지를 표시한다', () => {
    const emptyStats: AdminDashboardStats = {
      ...mockStats,
      countryStats: []
    };
    
    render(<CountryStats stats={emptyStats} />);
    
    expect(screen.getByText('국가별 통계 데이터가 없습니다.')).toBeInTheDocument();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    render(<CountryStats stats={mockStats} isLoading={true} />);
    
    // 로딩 스켈레톤이 표시되는지 확인
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});