import { getHybridCache } from './src/lib/hybrid-cache';

async function testAndorraCache() {
  console.log('🔍 안도라 New Year\'s Day 하이브리드 캐시 테스트 시작...');
  
  const cache = getHybridCache();
  
  try {
    // 단일 조회 테스트
    console.log('\n1. 단일 조회 테스트:');
    const singleResult = await cache.getDescription('New Year\'s Day', 'Andorra', 'ko');
    console.log('결과:', singleResult ? {
      source: singleResult.source,
      descriptionLength: singleResult.description.length,
      preview: singleResult.description.substring(0, 100) + '...'
    } : '없음');
    
    // 배치 조회 테스트
    console.log('\n2. 배치 조회 테스트:');
    const batchResults = await cache.getDescriptions([
      { holidayName: 'New Year\'s Day', countryName: 'Andorra', locale: 'ko' }
    ]);
    
    console.log('배치 결과:', batchResults.length > 0 && batchResults[0] ? {
      source: batchResults[0].source,
      descriptionLength: batchResults[0].description.length,
      preview: batchResults[0].description.substring(0, 100) + '...'
    } : '없음');
    
    // 다양한 국가명 형식으로 테스트
    console.log('\n3. 다양한 국가명 형식 테스트:');
    const variations = ['Andorra', 'andorra', 'ANDORRA'];
    
    for (const countryName of variations) {
      const result = await cache.getDescription('New Year\'s Day', countryName, 'ko');
      console.log(`"${countryName}":`, result ? '발견' : '없음');
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testAndorraCache();