import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth-middleware';
import { SupabaseHolidayDescriptionService } from '../../../../lib/supabase-client';
import type { HolidayDescriptionCreate, HolidayDescription } from '../../../../types/admin';
import { 
  createSuccessResponse, 
  createServerErrorResponse, 
  createValidationErrorResponse,
  createConflictErrorResponse,
  parsePaginationParams,
  parseBooleanParam,
  validateRequiredFields,
  logApiError 
} from '../../../../lib/api-response';
import fs from 'fs';
import path from 'path';



/**
 * 어드민 설명 목록 조회 API
 * GET /api/admin/descriptions
 */
async function getHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const { page, limit } = parsePaginationParams(searchParams);
    const country = searchParams.get('country') || undefined;
    const countryName = searchParams.get('country_name') || undefined;
    const holidayName = searchParams.get('holiday_name') || undefined;
    const locale = searchParams.get('locale') || undefined;
    const isManual = parseBooleanParam(searchParams.get('isManual'));
    const search = searchParams.get('search') || undefined;

    let result;
    
    try {
      // Supabase에서만 데이터 조회 (어드민 대시보드는 Supabase 데이터만 표시)
      const service = new SupabaseHolidayDescriptionService();
      const supabaseResult = await service.getDescriptions({
        page,
        limit,
        country,
        countryName,
        holidayName,
        locale,
        isManual,
        search
      });
      
      console.log('어드민 설명 관리 - Supabase에서 설명 목록 조회:', supabaseResult.data.length);
      
      result = {
        data: supabaseResult.data,
        page: supabaseResult.page,
        limit: supabaseResult.limit,
        total: supabaseResult.total,
        totalPages: supabaseResult.totalPages
      };
      
    } catch (supabaseError) {
      console.warn('Supabase 조회 실패:', supabaseError);
      
      // Supabase 실패 시 빈 결과 반환 (어드민에서는 파일 시스템 데이터 표시하지 않음)
      result = {
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 0
      };
      
      // 에러 로그 기록
      logApiError('/api/admin/descriptions - Supabase 조회 실패', supabaseError as Error, {
        page,
        limit,
        country,
        locale,
        isManual,
        search
      });
    }

    return NextResponse.json({
      descriptions: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit
      }
    });

  } catch (error) {
    logApiError('/api/admin/descriptions', 'GET', error);
    return createServerErrorResponse('설명 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 새로운 설명 생성 API
 * POST /api/admin/descriptions
 */
async function postHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    console.log('설명 생성 API - 요청 데이터:', body);
    
    // 요청 데이터 검증
    const requiredFields = ['holiday_id', 'holiday_name', 'country_name', 'locale', 'description', 'modified_by'];
    const missingField = validateRequiredFields(body, requiredFields);
    
    if (missingField) {
      console.log('설명 생성 API - 필수 필드 누락:', missingField);
      return createValidationErrorResponse(missingField);
    }

    // 국가 코드를 국가명으로 변환 (필요한 경우)
    let countryName = body.country_name;
    if (countryName.length === 2) {
      // 국가 코드인 경우 국가명으로 변환
      try {
        const { loadCountryData } = await import('../../../../lib/data-loader');
        const countryData = await loadCountryData(countryName);
        if (countryData) {
          countryName = countryData.name;
          console.log('국가 코드를 국가명으로 변환:', { code: body.country_name, name: countryName });
        }
      } catch (error) {
        console.warn('국가 코드 변환 실패:', error);
      }
    }

    // 설명 데이터 준비 - 수동 작성임을 명확히 표시
    const descriptionData: HolidayDescriptionCreate = {
      holiday_id: body.holiday_id,
      holiday_name: body.holiday_name,
      country_name: countryName,
      locale: body.locale,
      description: body.description,
      is_manual: true, // 수동 작성 명시
      modified_by: body.modified_by, // 실제 작성자 이름 저장
      confidence: 1.0 // 수동 작성이므로 최고 신뢰도
    };

    let result: any = null;
    
    // Supabase에 저장 시도
    try {
      const service = new SupabaseHolidayDescriptionService();
      result = await service.createDescription(descriptionData);
      console.log('설명 생성 API - Supabase 저장 완료:', result.id);
    } catch (supabaseError) {
      console.warn('Supabase 저장 실패, 파일 시스템만 사용:', supabaseError);
      // Supabase 실패 시 임시 결과 객체 생성
      result = {
        id: `desc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...descriptionData,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };
    }
    
    // 파일 시스템에도 백업 저장
    const fs = require('fs');
    const path = require('path');
    
    const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
    if (!fs.existsSync(descriptionsDir)) {
      fs.mkdirSync(descriptionsDir, { recursive: true });
    }
    
    const fileName = `${body.holiday_id.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = path.join(descriptionsDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify({
      ...result,
      created_at: result.created_at,
      updated_at: result.modified_at || result.created_at
    }, null, 2));
    
    console.log('설명 생성 API - 파일 백업 저장 완료:', filePath);
    
    // 하이브리드 캐시 시스템에 저장하여 실제 웹사이트에 반영
    try {
      const { setCachedDescription } = await import('../../../../lib/hybrid-cache');
      
      await setCachedDescription(
        body.holiday_id,
        body.holiday_name,
        countryName, // 변환된 국가명 사용
        body.locale,
        body.description,
        1.0 // 수동 작성이므로 최고 신뢰도
      );
      
      console.log('설명 생성 API - 하이브리드 캐시 업데이트 완료');
      
    } catch (error) {
      console.warn('하이브리드 캐시 업데이트 실패:', error);
      
      // 하이브리드 캐시 실패 시 기존 AI 캐시 방식으로 폴백
      try {
        const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
        let aiCache: Record<string, any> = {};
        
        if (fs.existsSync(aiCachePath)) {
          aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
        }
        
        // AI 캐시 키 형식: "Holiday Name-Country Name-locale"
        const cacheKey = `${body.holiday_name}-${countryName}-${body.locale}`;
        
        aiCache[cacheKey] = {
          holidayId: body.holiday_id,
          holidayName: body.holiday_name,
          countryName: countryName, // 변환된 국가명 사용
          locale: body.locale,
          description: body.description,
          confidence: 1.0, // 수동 작성이므로 최고 신뢰도
          generatedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          isManual: true // 수동 작성 표시
        };
        
        fs.writeFileSync(aiCachePath, JSON.stringify(aiCache, null, 2));
        console.log('설명 생성 API - AI 캐시 폴백 업데이트 완료:', cacheKey);
        
      } catch (fallbackError) {
        console.error('AI 캐시 폴백도 실패:', fallbackError);
      }
    }

    // 추가: 캐시 무효화를 통해 다음 조회 시 최신 데이터 반영 보장
    try {
      const { invalidateCachedDescription } = await import('../../../../lib/hybrid-cache');
      await invalidateCachedDescription(body.holiday_name, countryName, body.locale);
      console.log('설명 생성 API - 캐시 무효화 완료');
    } catch (error) {
      console.warn('캐시 무효화 실패:', error);
    }

    return createSuccessResponse(descriptionData, '설명이 성공적으로 생성되었습니다.');

  } catch (error) {
    console.error('설명 생성 API - 오류 발생:', error);
    logApiError('/api/admin/descriptions', 'POST', error);
    
    console.log('설명 생성 API - 일반 오류:', error instanceof Error ? error.message : error);
    return createServerErrorResponse(`설명 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 인증 미들웨어로 래핑
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);