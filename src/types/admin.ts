/**
 * 어드민 시스템 관련 타입 정의
 */

// Supabase 관련 타입
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

// 어드민 관련 타입
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

export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface AdminLogoutResponse {
  success: boolean;
  error?: string;
}

export interface AdminVerifyResponse {
  success: boolean;
  valid: boolean;
  sessionId?: string;
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

// 에러 관련 타입
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

// 페이지네이션 및 필터링 타입
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  country?: string;
  locale?: string;
  isManual?: boolean;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 인증 관련 타입
export interface AuthenticatedRequest extends Request {
  sessionId?: string;
  session?: AdminSession;
}

export interface AuthResult {
  success: boolean;
  sessionId?: string;
  session?: AdminSession;
  error?: string;
  response?: Response;
}

// 클라이언트 사이드 인증 상태 타입
export interface AuthStatus {
  isAuthenticated: boolean;
  sessionId?: string;
  expiresAt?: string;
  error?: string;
}