import { SupabaseHolidayDescriptionService } from './src/lib/supabase-client';

async function testAndorraData() {
  const service = new SupabaseHolidayDescriptionService();
  
  try {
    console.log('Supabase에서 안도라 New Year\'s Day 조회 중...');
    const result = await service.getDescription('New Year\'s Day', 'Andorra', 'ko');
    
    if (result) {
      console.log('✅ 데이터 발견:');
      console.log('ID:', result.id);
      console.log('설명 길이:', result.description.length);
      console.log('설명 시작 부분:', result.description.substring(0, 100) + '...');
      console.log('수동 작성 여부:', result.is_manual);
      console.log('생성일:', result.created_at);
      console.log('수정일:', result.modified_at);
    } else {
      console.log('❌ 데이터 없음');
    }
  } catch (error) {
    console.error('❌ 조회 실패:', error);
  }
}

testAndorraData();