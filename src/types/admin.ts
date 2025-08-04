/**
 * 어드민 시스템 관련 타입 정의
 */

// Supabase 데이터베이스 테이블 타입들
export interface HolidayDescription {
  id: string;
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  locale: string;
  description: string;
  confidence: number;
  generated_at: string;
  last_used: string;
  modified_at: string;
  modified_by: string;
  is_manual: boolean;
  ai_model?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_accessed: string;
  ip_address?: string;
  user_agent?: string;
}

// 어드민 대시보드 관련 타입들
export interface AdminDashboardStats {
  totalHolidays: number;
  totalDescriptions: number;
  aiGeneratedCount: number;
  manualCount: number;
  completionRate: number;
  recentModifications: HolidayDescription[];
  countryStats: Array<{
    country: string;
    total: number;
    completed: number;
    rate: number;
  }>;
}

// API 요청/응답 타입들
export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface HolidayDescriptionUpdate {
  id: string;
  description: string;
  modified_by: string;
}

export interface HolidayDescriptionCreate {
  holiday_id: string;
  holiday_name: string;
  country_name: string;
  locale: string;
  description: string;
  is_manual: true;
  modified_by: string;
  confidence?: number;
  ai_model?: string;
}

// 에러 관련 타입들
export enum AdminErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUPABASE_CONNECTION_ERROR = 'SUPABASE_CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY'
}

export class AdminError extends Error {
  constructor(
    public code: AdminErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

// 세션 관리 관련 타입들
export interface SessionData {
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessed: Date;
  ipAddress?: string;
  userAgent?: string;
}

// 로깅 관련 타입들
export interface AdminActionLog {
  action: string;
  userId: string;
  timestamp: Date;
  details?: any;
  ipAddress?: string;
}

export interface SecurityEventLog {
  event: string;
  ipAddress: string;
  timestamp: Date;
  details?: any;
}

// 마이그레이션 관련 타입들
export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
  totalProcessed: number;
  startTime: Date;
  endTime: Date;
}

// 기존 캐시 데이터 형식 (호환성 유지용)
export interface CachedContent {
  holidayId: string;
  holidayName: string;
  countryName: string;
  locale: string;
  description: string;
  confidence: number;
  generatedAt: string;
  lastUsed: string;
  aiModel?: string;
}