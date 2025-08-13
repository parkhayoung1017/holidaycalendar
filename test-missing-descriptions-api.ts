#!/usr/bin/env tsx

/**
 * 누락된 국가 코드 확인 및 수정 스크립트
 */

import fs from 'fs';
import path from 'path';

function findMissingCountryCodes() {
  console.log('🔍 누락된 국가 코드 확인 시작...\n');

  // 1. 실제 데이터에서 사용되는 국가 코드들 추출
  const dataDir = path.join(process.cwd(), 'data', 'holidays');
  const files = fs.readdirSync(dataDir);
  
  const actualCountryCodes = new Set<string>();
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const countryCode = file.split('-')[0].toUpperCase();
      actualCountryCodes.add(countryCode);
    }
  });

  console.log('📊 실제 데이터에 있는 국가 코드들:');
  const sortedActualCodes = Array.from(actualCountryCodes).sort();
  console.log(`   총 ${sortedActualCodes.length}개: ${sortedActualCodes.join(', ')}`);

  // 2. 현재 코드에서 지원하는 국가 코드들
  const currentValidCodes = new Set([
    'AD', 'AE', 'AF', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ',
    'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ',
    'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ',
    'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
    'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
    'FI', 'FJ', 'FR',
    'GA', 'GB', 'GD', 'GE', 'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY',
    'HN', 'HR', 'HT', 'HU',
    'ID', 'IE', 'IL', 'IN', 'IQ', 'IR', 'IS', 'IT',
    'JM', 'JO', 'JP',
    'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KZ',
    'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
    'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
    'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NZ',
    'OM',
    'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PR', 'PT', 'PW', 'PY',
    'QA',
    'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SY', 'SZ',
    'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
    'UA', 'UG', 'US', 'UY', 'UZ',
    'VA', 'VC', 'VE', 'VN', 'VU',
    'WS',
    'YE',
    'ZA', 'ZM', 'ZW'
  ]);

  console.log(`\n📋 현재 코드에서 지원하는 국가 코드: ${currentValidCodes.size}개`);

  // 3. 누락된 국가 코드들 찾기
  const missingCodes = sortedActualCodes.filter(code => !currentValidCodes.has(code));
  
  console.log(`\n❌ 누락된 국가 코드들 (${missingCodes.length}개):`);
  if (missingCodes.length > 0) {
    missingCodes.forEach(code => {
      console.log(`   ${code}`);
    });

    // 4. 누락된 국가 코드들의 실제 국가명 추정
    console.log('\n🌍 누락된 국가 코드들의 추정 국가명:');
    const countryCodeToName: Record<string, string> = {
      'FO': 'Faroe Islands',
      'GG': 'Guernsey', 
      'GI': 'Gibraltar',
      'GL': 'Greenland',
      'GU': 'Guam',
      'HK': 'Hong Kong',
      'IM': 'Isle of Man',
      'JE': 'Jersey',
      'KY': 'Cayman Islands',
      'MO': 'Macao',
      'MS': 'Montserrat',
      'NC': 'New Caledonia',
      'NU': 'Niue',
      'PF': 'French Polynesia',
      'PS': 'Palestine',
      'SH': 'Saint Helena',
      'SJ': 'Svalbard and Jan Mayen',
      'SX': 'Sint Maarten',
      'TC': 'Turks and Caicos Islands',
      'VG': 'British Virgin Islands',
      'VI': 'U.S. Virgin Islands',
      'WF': 'Wallis and Futuna'
    };

    missingCodes.forEach(code => {
      const name = countryCodeToName[code] || '알 수 없음';
      console.log(`   ${code}: ${name}`);
    });

    // 5. 수정할 코드 생성
    console.log('\n🔧 추가해야 할 국가 코드들:');
    console.log(`   기존 배열에 추가: '${missingCodes.join("', '")}'`);

  } else {
    console.log('   ✅ 모든 국가 코드가 이미 지원됩니다!');
  }

  // 6. 중복 확인
  const duplicatesInCurrent = sortedActualCodes.filter(code => currentValidCodes.has(code));
  console.log(`\n✅ 이미 지원되는 국가 코드: ${duplicatesInCurrent.length}개`);

  console.log('\n✅ 분석 완료!');
}

// 스크립트 실행
if (require.main === module) {
  findMissingCountryCodes();
}