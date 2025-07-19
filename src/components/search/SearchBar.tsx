'use client';

import { useState, useEffect, useRef } from 'react';
import { generateSearchResults, sortSearchResults, type SearchResult } from '@/lib/search-utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  onSelect, 
  placeholder = "국가명 또는 '미국 2025' 형태로 검색하세요",
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색어 변경 처리
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const searchResults = generateSearchResults(query);
      const sortedResults = sortSearchResults(searchResults, query);
      setResults(sortedResults);
      setSelectedIndex(-1);
      onSearch?.(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 결과 선택 처리
  const handleSelect = (result: SearchResult) => {
    if (result.country) {
      setQuery(`${result.country.name} ${result.year || ''}`);
    }
    setIsOpen(false);
    onSelect?.(result);
    
    // 페이지 이동
    window.location.href = result.url;
  };

  // 입력 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* 검색 입력창 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.country?.code || 'unknown'}-${result.year || 'no-year'}-${index}`}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{result.country?.flag || '🌍'}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {result.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.description}
                  </div>
                </div>
                <svg 
                  className="h-4 w-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            <div className="text-sm">검색 결과가 없습니다</div>
            <div className="text-xs mt-1">
              다른 국가명이나 연도를 시도해보세요
            </div>
          </div>
        </div>
      )}
    </div>
  );
}