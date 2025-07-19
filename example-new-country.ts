// 새로운 국가 추가 예시 - 독일(DE) 공휴일

import { addHolidayDescription } from './src/lib/ai-content-generator';

// 1. 국가 코드 매핑에 추가 (generateHolidayDescription 함수 내)
const countryCodeMap = {
  // 기존 매핑들...
  'Germany': 'DE',
  'Deutschland': 'DE'
};

// 2. 국가별 개요 추가 (generateCountryOverview 함수 내)
const overviews = {
  // 기존 개요들...
  DE: "독일의 공휴일은 연방 차원의 공휴일과 주별 공휴일로 구성되어 있으며, 기독교 전통과 독일의 역사적 사건들을 기념하는 특징을 보입니다. 통일의 날, 종교개혁 기념일 등 독일만의 독특한 역사적 배경을 가진 공휴일들이 포함되어 있습니다."
};

// 3. 공휴일 설명 데이터베이스에 추가
const germanHolidays = [
  {
    name: "German Unity Day",
    keywords: ["unity day", "통일의 날", "deutsche einheit"],
    description: "1990년 10월 3일 동서독 통일을 기념하는 독일의 국경일입니다. 분단의 아픔을 극복하고 하나의 독일로 재탄생한 역사적 순간을 기리며, 전국에서 축제와 기념행사가 열립니다. 평화적 통일의 상징으로서 독일인들의 단합과 미래에 대한 희망을 나타내는 의미 깊은 날입니다.",
    culturalContext: "냉전 종료와 평화적 통일의 역사적 성취를 기념"
  },
  {
    name: "Oktoberfest",
    keywords: ["oktoberfest", "옥토버페스트", "beer festival"],
    description: "뮌헨에서 시작된 세계 최대의 맥주 축제로, 독일 바이에른 지역의 전통문화를 대표하는 축제입니다. 전통 의상인 레더호젠과 디른들을 입고 맥주와 소시지를 즐기며, 독일의 소박하고 정겨운 공동체 문화를 경험할 수 있습니다. 단순한 축제를 넘어 독일의 문화적 정체성과 지역 전통을 세계에 알리는 중요한 역할을 합니다.",
    culturalContext: "바이에른 지역 전통이 세계적 축제로 발전한 사례"
  }
];

// 실제 추가 (런타임에서 실행)
germanHolidays.forEach(holiday => {
  addHolidayDescription('DE', holiday);
});

console.log('독일 공휴일 데이터 추가 완료!');