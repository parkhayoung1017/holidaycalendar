'use client';

import { MONTH_NAMES } from '@/lib/constants';

interface MonthFilterProps {
  selectedMonth: number | null;
  onMonthChange: (month: number | null) => void;
  year: number;
}

export default function MonthFilter({ selectedMonth, onMonthChange, year }: MonthFilterProps) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">월별 필터</h3>
        {selectedMonth && (
          <button
            onClick={() => onMonthChange(null)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            전체 보기
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {months.map(month => (
          <button
            key={month}
            onClick={() => onMonthChange(month === selectedMonth ? null : month)}
            className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
              selectedMonth === month
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {MONTH_NAMES.ko[month - 1]}
          </button>
        ))}
      </div>
      
      {selectedMonth && (
        <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
          <span className="font-medium text-blue-800">
            {year}년 {MONTH_NAMES.ko[selectedMonth - 1]}
          </span>
          의 공휴일을 표시하고 있습니다.
        </div>
      )}
    </div>
  );
}