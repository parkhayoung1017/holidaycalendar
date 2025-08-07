'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/lib/auth-middleware';
import { useRouter } from 'next/navigation';

interface AdminNavigationProps {
  title?: string;
  onRefresh?: () => void;
  refreshLoading?: boolean;
}

export default function AdminNavigation({ 
  title = '어드민 대시보드', 
  onRefresh,
  refreshLoading = false 
}: AdminNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/admin/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      router.replace('/admin/login');
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: '대시보드' },
    { href: '/admin/descriptions', label: '설명 관리' },
    { href: '/admin/descriptions/missing', label: '설명 없는 공휴일' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
            <nav className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.href)
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>새로고침</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}