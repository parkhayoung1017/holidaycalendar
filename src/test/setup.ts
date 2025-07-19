import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 환경변수 모킹
process.env.CALENDARIFIC_API_KEY = 'test-api-key';
process.env.HOLIDAY_API_PROVIDER = 'nager';

// 전역 fetch 모킹
global.fetch = vi.fn();