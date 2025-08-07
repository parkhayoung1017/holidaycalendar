import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth } from '../../../../../lib/auth-middleware';
import { SupabaseHolidayDescriptionService } from '../../../../../lib/supabase-client';
import { getCountrySlugFromName, createHolidaySlug } from '../../../../../lib/country-utils';
import { invalidateCachedDescription } from '../../../../../lib/hybrid-cache';
import type { HolidayDescriptionUpdate } from '../../../../../types/admin';
import { 
  createSuccessResponse, 
  createServerErrorResponse, 
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  validateRequiredFields,
  logApiError 
} from '../../../../../lib/api-response';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * 개별 설명 조회 API
 * GET /api/admin/descriptions/[id]
 */
async function getHandler(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return createValidationErrorResponse('ID가 필요합니다.');
    }

    const service = new SupabaseHolidayDescriptionService();
    const description = await service.getDescriptionById(id);

    if (!description) {
      return createNotFoundErrorResponse('설명을 찾을 수 없습니다.');
    }

    return createSuccessResponse(description, '설명을 성공적으로 조회했습니다.');

  } catch (error) {
    logApiError(`/api/admin/descriptions/${params.id}`, 'GET', error);
    return createServerErrorResponse('설명을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 설명 수정 API
 * PUT /api/admin/descriptions/[id]
 */
async function putHandler(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return createValidationErrorResponse('ID가 필요합니다.');
    }

    // 요청 데이터 검증
    const requiredFields = ['description', 'modified_by'];
    const missingField = validateRequiredFields(body, requiredFields);
    
    if (missingField) {
      return createValidationErrorResponse(missingField);
    }

    const updateData: Partial<HolidayDescriptionUpdate> = {
      description: body.description,
      modified_by: body.modified_by,
      modified_at: new Date().toISOString()
    };

    // 선택적 필드들
    if (body.confidence !== undefined) {
      updateData.confidence = body.confidence;
    }
    if (body.ai_model !== undefined) {
      updateData.ai_model = body.ai_model;
    }

    const service = new SupabaseHolidayDescriptionService();
    
    // 업데이트 전에 기존 데이터 조회 (캐시 무효화를 위해)
    const existingDescription = await service.getDescriptionById(id);
    
    const updatedDescription = await service.updateDescription(id, updateData);

    if (!updatedDescription) {
      return createNotFoundErrorResponse('설명을 찾을 수 없습니다.');
    }

    // 캐시 무효화: 관련 페이지들의 캐시를 무효화
    try {
      if (existingDescription) {
        // 하이브리드 캐시 무효화 (한국어와 영어 모두)
        const locales = ['ko', 'en'];
        for (const locale of locales) {
          await invalidateCachedDescription(
            existingDescription.holiday_name,
            existingDescription.country_name,
            locale
          );
          console.log(`✅ 하이브리드 캐시 무효화: ${existingDescription.holiday_name} (${locale})`);
        }
        
        // 페이지 캐시 무효화
        const countrySlug = getCountrySlugFromName(existingDescription.country_name);
        const holidaySlug = createHolidaySlug(existingDescription.holiday_name);
        
        if (countrySlug && holidaySlug) {
          // 한국어와 영어 페이지 모두 무효화
          for (const locale of locales) {
            const pagePath = `/${locale}/holiday/${countrySlug}/${holidaySlug}`;
            revalidatePath(pagePath);
            console.log(`✅ 페이지 캐시 무효화: ${pagePath}`);
          }
          
          // 국가별 공휴일 목록 페이지도 무효화
          for (const locale of locales) {
            const countryPagePath = `/${locale}/holiday/${countrySlug}`;
            revalidatePath(countryPagePath);
            console.log(`✅ 국가 페이지 캐시 무효화: ${countryPagePath}`);
          }
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ 캐시 무효화 실패:', cacheError);
      // 캐시 무효화 실패는 치명적이지 않으므로 계속 진행
    }

    return createSuccessResponse(updatedDescription, '설명이 성공적으로 수정되었습니다.');

  } catch (error) {
    logApiError(`/api/admin/descriptions/${params.id}`, 'PUT', error);
    return createServerErrorResponse('설명 수정 중 오류가 발생했습니다.');
  }
}

/**
 * 설명 삭제 API
 * DELETE /api/admin/descriptions/[id]
 */
async function deleteHandler(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return createValidationErrorResponse('ID가 필요합니다.');
    }

    const service = new SupabaseHolidayDescriptionService();
    const success = await service.deleteDescription(id);

    if (!success) {
      return createNotFoundErrorResponse('설명을 찾을 수 없습니다.');
    }

    return createSuccessResponse(null, '설명이 성공적으로 삭제되었습니다.');

  } catch (error) {
    logApiError(`/api/admin/descriptions/${params.id}`, 'DELETE', error);
    return createServerErrorResponse('설명 삭제 중 오류가 발생했습니다.');
  }
}

// 인증 미들웨어로 래핑
export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);