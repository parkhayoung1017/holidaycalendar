// 클라이언트 사이드에서 사용할 수 있는 데이터 가용성 유틸리티

/**
 * 브라우저 환경에서 사용할 수 있는 클라이언트 사이드 버전
 */
export const CLIENT_AVAILABLE_YEARS = [
  2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030
];

/**
 * 클라이언트 사이드에서 사용 가능한 연도를 반환합니다
 */
export function getClientAvailableYears(): number[] {
  return CLIENT_AVAILABLE_YEARS;
}