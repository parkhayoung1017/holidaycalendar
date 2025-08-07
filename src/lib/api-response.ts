import { NextResponse } from 'next/server';

/**
 * 표준 API 응답 인터페이스
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 성공 응답 생성 헬퍼
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination
  };

  return NextResponse.json(response);
}

/**
 * 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details })
  };

  return NextResponse.json(response, { status });
}

/**
 * 검증 에러 응답 생성 헬퍼
 */
export function createValidationErrorResponse(
  field: string,
  message?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    message || `필수 필드가 누락되었습니다: ${field}`,
    400,
    { field }
  );
}

/**
 * 인증 에러 응답 생성 헬퍼
 */
export function createAuthErrorResponse(
  message: string = '인증이 필요합니다.'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401);
}

/**
 * 권한 에러 응답 생성 헬퍼
 */
export function createForbiddenErrorResponse(
  message: string = '접근 권한이 없습니다.'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 403);
}

/**
 * 리소스 없음 에러 응답 생성 헬퍼
 */
export function createNotFoundErrorResponse(
  resource: string = '리소스'
): NextResponse<ApiResponse> {
  return createErrorResponse(`${resource}를 찾을 수 없습니다.`, 404);
}

/**
 * 중복 리소스 에러 응답 생성 헬퍼
 */
export function createConflictErrorResponse(
  message: string = '이미 존재하는 리소스입니다.'
): NextResponse<ApiResponse> {
  return createErrorResponse(message, 409);
}

/**
 * 서버 에러 응답 생성 헬퍼
 */
export function createServerErrorResponse(
  message: string = '서버 내부 오류가 발생했습니다.',
  error?: any
): NextResponse<ApiResponse> {
  // 개발 환경에서는 상세 에러 정보 포함
  const details = process.env.NODE_ENV === 'development' ? error : undefined;
  
  return createErrorResponse(message, 500, details);
}

/**
 * 요청 데이터 검증 헬퍼
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return field;
    }
  }
  return null;
}

/**
 * 페이지네이션 파라미터 파싱 헬퍼
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  
  return { page, limit };
}

/**
 * 불린 파라미터 파싱 헬퍼
 */
export function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * API 에러 로깅 헬퍼
 */
export function logApiError(
  endpoint: string,
  method: string,
  error: any,
  context?: any
): void {
  console.error(`[API Error] ${method} ${endpoint}:`, {
    error: error.message || error,
    stack: error.stack,
    context
  });
}