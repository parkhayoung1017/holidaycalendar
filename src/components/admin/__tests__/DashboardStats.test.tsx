import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardStats from '../DashboardStats';
import { AdminDashboardStats } from '@/types/admin';

const mockStats: AdminDashboardStats = {
  totalHolidays: 1000,
  totalDescriptions: 800,
  aiGeneratedCount: 750,
  manualCount: 50,
  completionRate: 80.0,
  recentModifications: [],
  countryStats: []
};

describe('DashboardStats', () => {
  it('통계 데이터를 올바르게 표시한다', () => {
    render(<DashboardStats stats={mockStats} />);
    
    // 전체 공휴일 수 확인
    expect(screen.getByText('전체 공휴일')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    
    // 설명 완료 수 확인
    expect(screen.getByText('설명 완료')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    
    // 완료율 확인
    expect(screen.getByText('완료율')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    
    // 수동 작성 수 확인
    expect(screen.getByText('수동 작성')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    render(<DashboardStats stats={mockStats} isLoading={true} />);
    
    // 로딩 스켈레톤이 표시되는지 확인
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('숫자를 천 단위로 구분하여 표시한다', () => {
    const largeStats: AdminDashboardStats = {
      ...mockStats,
      totalHolidays: 12345,
      totalDescriptions: 9876
    };
    
    render(<DashboardStats stats={largeStats} />);
    
    expect(screen.getByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('9,876')).toBeInTheDocument();
  });
});