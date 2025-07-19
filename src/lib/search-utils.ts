import { SUPPORTED_COUNTRIES, SUPPORTED_YEARS, CURRENT_YEAR } from './constants';

export interface SearchResult {
  type: 'country' | 'country-year' | 'region';
  country?: {
    code: string;
    name: string;
    flag: string;
    region: string;
  };
  year?: number;
  region?: string;
  url: string;
  title: string;
  description: string;
}

/**
 * 검색 쿼리를 분석하여 국가와 연도를 추출합니다
 */
export function parseSearchQuery(query: string): {
  countryQuery: string;
  year: number | null;
  isValidYear: boolean;
} {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 연도 추출 (2020-2030 범위)
  const yearMatch = normalizedQuery.match(/\b(20[2-3]\d)\b/);
  const extractedYear = yearMatch ? parseInt(yearMatch[1]) : null;
  const isValidYear = extractedYear ? SUPPORTED_YEARS.includes(extractedYear) : false;
  
  // 연도를 제거한 국가 쿼리
  const countryQuery = normalizedQuery.replace(/\b20[2-3]\d\b/, '').trim();
  
  return {
    countryQuery,
    year: extractedYear,
    isValidYear
  };
}

/**
 * 국가명으로 매칭되는 국가들을 찾습니다
 */
export function findMatchingCountries(query: string): typeof SUPPORTED_COUNTRIES {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  return SUPPORTED_COUNTRIES.filter(country => {
    const nameMatch = country.name.toLowerCase().includes(normalizedQuery);
    const codeMatch = country.code.toLowerCase().includes(normalizedQuery);
    
    // 한국어 별칭 매칭
    const koreanAliases: Record<string, string[]> = {
      'US': ['미국', '아메리카'],
      'KR': ['한국', '대한민국'],
      'JP': ['일본'],
      'CN': ['중국'],
      'GB': ['영국', '이영국'],
      'DE': ['독일'],
      'FR': ['프랑스'],
      'CA': ['캐나다'],
      'AU': ['호주', '오스트레일리아'],
      'IN': ['인도'],
      'IT': ['이탈리아'],
      'ES': ['스페인'],
      'NL': ['네덜란드'],
      'CH': ['스위스'],
      'SE': ['스웨덴'],
      'NO': ['노르웨이'],
      'MX': ['멕시코'],
      'BR': ['브라질'],
      'AR': ['아르헨티나'],
      'ZA': ['남아프리카', '남아공'],
      'AE': ['아랍에미리트', 'uae'],
      'SA': ['사우디아라비아', '사우디']
    };
    
    const aliases = koreanAliases[country.code] || [];
    const aliasMatch = aliases.some(alias => alias.includes(normalizedQuery));
    
    return nameMatch || codeMatch || aliasMatch;
  });
}

/**
 * 검색 쿼리에 대한 결과를 생성합니다
 */
export function generateSearchResults(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  const { countryQuery, year, isValidYear } = parseSearchQuery(query);
  const matchingCountries = findMatchingCountries(countryQuery);
  const results: SearchResult[] = [];
  
  // 국가 + 연도 조합 결과
  if (isValidYear && year) {
    matchingCountries.forEach(country => {
      results.push({
        type: 'country-year',
        country: {
          code: country.code,
          name: country.name,
          flag: country.flag,
          region: country.region
        },
        year,
        url: `/${country.code.toLowerCase()}-${year}`,
        title: `${country.name} ${year}`,
        description: `${year}년 ${country.name} 공휴일 보기`
      });
    });
  } else {
    // 국가만 검색한 경우 현재 연도로 결과 생성
    matchingCountries.forEach(country => {
      results.push({
        type: 'country-year',
        country: {
          code: country.code,
          name: country.name,
          flag: country.flag,
          region: country.region
        },
        year: CURRENT_YEAR,
        url: `/${country.code.toLowerCase()}-${CURRENT_YEAR}`,
        title: `${country.name} ${CURRENT_YEAR}`,
        description: `${CURRENT_YEAR}년 ${country.name} 공휴일 보기`
      });
    });
  }
  
  return results.slice(0, 8); // 최대 8개 결과
}

/**
 * 인기 검색어 목록을 반환합니다
 */
export function getPopularSearches(): string[] {
  return [
    '미국 2025',
    '한국 2025', 
    '일본 2025',
    '영국 2025',
    '독일 2025',
    '프랑스 2025',
    '캐나다 2025',
    '호주 2025'
  ];
}

/**
 * 검색 결과의 우선순위를 계산합니다
 */
export function calculateSearchPriority(result: SearchResult, query: string): number {
  let priority = 0;
  
  if (!result.country) return priority;
  
  const normalizedQuery = query.toLowerCase();
  const countryName = result.country.name.toLowerCase();
  const countryCode = result.country.code.toLowerCase();
  
  // 정확한 매칭에 높은 점수
  if (countryName === normalizedQuery || countryCode === normalizedQuery) {
    priority += 100;
  }
  
  // 시작 부분 매칭
  if (countryName.startsWith(normalizedQuery)) {
    priority += 50;
  }
  
  // 인기 국가에 추가 점수
  if (result.country && SUPPORTED_COUNTRIES.find(c => c.code === result.country!.code)?.popular) {
    priority += 25;
  }
  
  // 현재 연도에 추가 점수
  if (result.year === CURRENT_YEAR) {
    priority += 10;
  }
  
  return priority;
}

/**
 * 검색 결과를 우선순위에 따라 정렬합니다
 */
export function sortSearchResults(results: SearchResult[], query: string): SearchResult[] {
  return results
    .map(result => ({
      ...result,
      priority: calculateSearchPriority(result, query)
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ priority, ...result }) => result);
}