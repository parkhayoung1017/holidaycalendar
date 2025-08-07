import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/auth-middleware';
import { SupabaseHolidayDescriptionService } from '../../../../../lib/supabase-client';
import { 
  createSuccessResponse, 
  createServerErrorResponse, 
  logApiError 
} from '../../../../../lib/api-response';

/**
 * 어드민 대시보드 통계 API
 * GET /api/admin/dashboard/stats
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const service = new SupabaseHolidayDescriptionService();
    const stats = await service.getDashboardStats();

    return createSuccessResponse(stats, '대시보드 통계를 성공적으로 조회했습니다.');

  } catch (error) {
    logApiError('/api/admin/dashboard/stats', 'GET', error);
    return createServerErrorResponse('대시보드 통계를 불러오는 중 오류가 발생했습니다.');
  }
}

// 인증 미들웨어로 래핑
export const GET = withAuth(handler);