#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * 수집된 국가 데이터를 기반으로 번역 파일을 업데이트하는 스크립트
 */

// 국가 코드와 한국어/영어 이름 매핑
const COUNTRY_TRANSLATIONS: Record<string, { ko: string; en: string }> = {
  'AD': { ko: '안도라', en: 'Andorra' },
  'AE': { ko: '아랍에미리트', en: 'United Arab Emirates' },
  'AF': { ko: '아프가니스탄', en: 'Afghanistan' },
  'AL': { ko: '알바니아', en: 'Albania' },
  'AM': { ko: '아르메니아', en: 'Armenia' },
  'AO': { ko: '앙골라', en: 'Angola' },
  'AR': { ko: '아르헨티나', en: 'Argentina' },
  'AT': { ko: '오스트리아', en: 'Austria' },
  'AU': { ko: '호주', en: 'Australia' },
  'AZ': { ko: '아제르바이잔', en: 'Azerbaijan' },
  'BA': { ko: '보스니아 헤르체고비나', en: 'Bosnia and Herzegovina' },
  'BB': { ko: '바베이도스', en: 'Barbados' },
  'BD': { ko: '방글라데시', en: 'Bangladesh' },
  'BE': { ko: '벨기에', en: 'Belgium' },
  'BF': { ko: '부르키나파소', en: 'Burkina Faso' },
  'BG': { ko: '불가리아', en: 'Bulgaria' },
  'BH': { ko: '바레인', en: 'Bahrain' },
  'BI': { ko: '부룬디', en: 'Burundi' },
  'BJ': { ko: '베냉', en: 'Benin' },
  'BN': { ko: '브루나이', en: 'Brunei' },
  'BO': { ko: '볼리비아', en: 'Bolivia' },
  'BR': { ko: '브라질', en: 'Brazil' },
  'BS': { ko: '바하마', en: 'Bahamas' },
  'BT': { ko: '부탄', en: 'Bhutan' },
  'BW': { ko: '보츠와나', en: 'Botswana' },
  'BY': { ko: '벨라루스', en: 'Belarus' },
  'BZ': { ko: '벨리즈', en: 'Belize' },
  'CA': { ko: '캐나다', en: 'Canada' },
  'CD': { ko: '콩고민주공화국', en: 'Democratic Republic of the Congo' },
  'CF': { ko: '중앙아프리카공화국', en: 'Central African Republic' },
  'CG': { ko: '콩고공화국', en: 'Republic of the Congo' },
  'CH': { ko: '스위스', en: 'Switzerland' },
  'CI': { ko: '코트디부아르', en: 'Ivory Coast' },
  'CL': { ko: '칠레', en: 'Chile' },
  'CM': { ko: '카메룬', en: 'Cameroon' },
  'CN': { ko: '중국', en: 'China' },
  'CO': { ko: '콜롬비아', en: 'Colombia' },
  'CR': { ko: '코스타리카', en: 'Costa Rica' },
  'CU': { ko: '쿠바', en: 'Cuba' },
  'CV': { ko: '카보베르데', en: 'Cape Verde' },
  'CY': { ko: '키프로스', en: 'Cyprus' },
  'CZ': { ko: '체코', en: 'Czech Republic' },
  'DE': { ko: '독일', en: 'Germany' },
  'DJ': { ko: '지부티', en: 'Djibouti' },
  'DK': { ko: '덴마크', en: 'Denmark' },
  'DM': { ko: '도미니카', en: 'Dominica' },
  'DO': { ko: '도미니카공화국', en: 'Dominican Republic' },
  'DZ': { ko: '알제리', en: 'Algeria' },
  'EC': { ko: '에콰도르', en: 'Ecuador' },
  'EE': { ko: '에스토니아', en: 'Estonia' },
  'EG': { ko: '이집트', en: 'Egypt' },
  'ER': { ko: '에리트레아', en: 'Eritrea' },
  'ES': { ko: '스페인', en: 'Spain' },
  'ET': { ko: '에티오피아', en: 'Ethiopia' },
  'FI': { ko: '핀란드', en: 'Finland' },
  'FJ': { ko: '피지', en: 'Fiji' },
  'FO': { ko: '페로제도', en: 'Faroe Islands' },
  'FR': { ko: '프랑스', en: 'France' },
  'GA': { ko: '가봉', en: 'Gabon' },
  'GB': { ko: '영국', en: 'United Kingdom' },
  'GD': { ko: '그레나다', en: 'Grenada' },
  'GE': { ko: '조지아', en: 'Georgia' },
  'GG': { ko: '건지', en: 'Guernsey' },
  'GH': { ko: '가나', en: 'Ghana' },
  'GI': { ko: '지브롤터', en: 'Gibraltar' },
  'GL': { ko: '그린란드', en: 'Greenland' },
  'GM': { ko: '감비아', en: 'Gambia' },
  'GN': { ko: '기니', en: 'Guinea' },
  'GQ': { ko: '적도기니', en: 'Equatorial Guinea' },
  'GR': { ko: '그리스', en: 'Greece' },
  'GT': { ko: '과테말라', en: 'Guatemala' },
  'GU': { ko: '괌', en: 'Guam' },
  'GW': { ko: '기니비사우', en: 'Guinea-Bissau' },
  'GY': { ko: '가이아나', en: 'Guyana' },
  'HK': { ko: '홍콩', en: 'Hong Kong' },
  'HN': { ko: '온두라스', en: 'Honduras' },
  'HR': { ko: '크로아티아', en: 'Croatia' },
  'HT': { ko: '아이티', en: 'Haiti' },
  'HU': { ko: '헝가리', en: 'Hungary' },
  'ID': { ko: '인도네시아', en: 'Indonesia' },
  'IE': { ko: '아일랜드', en: 'Ireland' },
  'IL': { ko: '이스라엘', en: 'Israel' },
  'IM': { ko: '맨섬', en: 'Isle of Man' },
  'IN': { ko: '인도', en: 'India' },
  'IQ': { ko: '이라크', en: 'Iraq' },
  'IR': { ko: '이란', en: 'Iran' },
  'IS': { ko: '아이슬란드', en: 'Iceland' },
  'IT': { ko: '이탈리아', en: 'Italy' },
  'JE': { ko: '저지', en: 'Jersey' },
  'JM': { ko: '자메이카', en: 'Jamaica' },
  'JO': { ko: '요단', en: 'Jordan' },
  'JP': { ko: '일본', en: 'Japan' },
  'KE': { ko: '케냐', en: 'Kenya' },
  'KG': { ko: '키르기스스탄', en: 'Kyrgyzstan' },
  'KH': { ko: '캄보디아', en: 'Cambodia' },
  'KI': { ko: '키리바시', en: 'Kiribati' },
  'KM': { ko: '코모로', en: 'Comoros' },
  'KN': { ko: '세인트키츠 네비스', en: 'Saint Kitts and Nevis' },
  'KR': { ko: '대한민국', en: 'South Korea' },
  'KW': { ko: '쿠웨이트', en: 'Kuwait' },
  'KY': { ko: '케이맨제도', en: 'Cayman Islands' },
  'KZ': { ko: '카자흐스탄', en: 'Kazakhstan' },
  'LA': { ko: '라오스', en: 'Laos' },
  'LB': { ko: '레바논', en: 'Lebanon' },
  'LC': { ko: '세인트루시아', en: 'Saint Lucia' },
  'LI': { ko: '리히텐슈타인', en: 'Liechtenstein' },
  'LK': { ko: '스리랑카', en: 'Sri Lanka' },
  'LR': { ko: '라이베리아', en: 'Liberia' },
  'LS': { ko: '레소토', en: 'Lesotho' },
  'LT': { ko: '리투아니아', en: 'Lithuania' },
  'LU': { ko: '룩셈부르크', en: 'Luxembourg' },
  'LV': { ko: '라트비아', en: 'Latvia' },
  'LY': { ko: '리비아', en: 'Libya' },
  'MA': { ko: '모로코', en: 'Morocco' },
  'MC': { ko: '모나코', en: 'Monaco' },
  'MD': { ko: '몰도바', en: 'Moldova' },
  'ME': { ko: '몬테네그로', en: 'Montenegro' },
  'MG': { ko: '마다가스카르', en: 'Madagascar' },
  'MH': { ko: '마셜제도', en: 'Marshall Islands' },
  'MK': { ko: '북마케도니아', en: 'North Macedonia' },
  'ML': { ko: '말리', en: 'Mali' },
  'MM': { ko: '미얀마', en: 'Myanmar' },
  'MN': { ko: '몽골', en: 'Mongolia' },
  'MO': { ko: '마카오', en: 'Macau' },
  'MR': { ko: '모리타니', en: 'Mauritania' },
  'MS': { ko: '몬트세랫', en: 'Montserrat' },
  'MT': { ko: '몰타', en: 'Malta' },
  'MU': { ko: '모리셔스', en: 'Mauritius' },
  'MV': { ko: '몰디브', en: 'Maldives' },
  'MW': { ko: '말라위', en: 'Malawi' },
  'MX': { ko: '멕시코', en: 'Mexico' },
  'MY': { ko: '말레이시아', en: 'Malaysia' },
  'MZ': { ko: '모잠비크', en: 'Mozambique' },
  'NA': { ko: '나미비아', en: 'Namibia' },
  'NC': { ko: '뉴칼레도니아', en: 'New Caledonia' },
  'NE': { ko: '니제르', en: 'Niger' },
  'NG': { ko: '나이지리아', en: 'Nigeria' },
  'NI': { ko: '니카라과', en: 'Nicaragua' },
  'NL': { ko: '네덜란드', en: 'Netherlands' },
  'NO': { ko: '노르웨이', en: 'Norway' },
  'NP': { ko: '네팔', en: 'Nepal' },
  'NR': { ko: '나우루', en: 'Nauru' },
  'NU': { ko: '니우에', en: 'Niue' },
  'NZ': { ko: '뉴질랜드', en: 'New Zealand' },
  'OM': { ko: '오만', en: 'Oman' },
  'PA': { ko: '파나마', en: 'Panama' },
  'PE': { ko: '페루', en: 'Peru' },
  'PF': { ko: '프랑스령 폴리네시아', en: 'French Polynesia' },
  'PG': { ko: '파푸아뉴기니', en: 'Papua New Guinea' },
  'PH': { ko: '필리핀', en: 'Philippines' },
  'PK': { ko: '파키스탄', en: 'Pakistan' },
  'PL': { ko: '폴란드', en: 'Poland' },
  'PR': { ko: '푸에르토리코', en: 'Puerto Rico' },
  'PS': { ko: '팔레스타인', en: 'Palestine' },
  'PT': { ko: '포르투갈', en: 'Portugal' },
  'PW': { ko: '팔라우', en: 'Palau' },
  'PY': { ko: '파라과이', en: 'Paraguay' },
  'QA': { ko: '카타르', en: 'Qatar' },
  'RO': { ko: '루마니아', en: 'Romania' },
  'RS': { ko: '세르비아', en: 'Serbia' },
  'RU': { ko: '러시아', en: 'Russia' },
  'RW': { ko: '르완다', en: 'Rwanda' },
  'SA': { ko: '사우디아라비아', en: 'Saudi Arabia' },
  'SB': { ko: '솔로몬제도', en: 'Solomon Islands' },
  'SC': { ko: '세이셸', en: 'Seychelles' },
  'SD': { ko: '수단', en: 'Sudan' },
  'SE': { ko: '스웨덴', en: 'Sweden' },
  'SG': { ko: '싱가포르', en: 'Singapore' },
  'SH': { ko: '세인트헬레나', en: 'Saint Helena' },
  'SI': { ko: '슬로베니아', en: 'Slovenia' },
  'SJ': { ko: '스발바르 얀마옌', en: 'Svalbard and Jan Mayen' },
  'SK': { ko: '슬로바키아', en: 'Slovakia' },
  'SL': { ko: '시에라리온', en: 'Sierra Leone' },
  'SM': { ko: '산마리노', en: 'San Marino' },
  'SN': { ko: '세네갈', en: 'Senegal' },
  'SO': { ko: '소말리아', en: 'Somalia' },
  'SR': { ko: '수리남', en: 'Suriname' },
  'SS': { ko: '남수단', en: 'South Sudan' },
  'ST': { ko: '상투메 프린시페', en: 'São Tomé and Príncipe' },
  'SV': { ko: '엘살바도르', en: 'El Salvador' },
  'SX': { ko: '신트마르턴', en: 'Sint Maarten' },
  'SY': { ko: '시리아', en: 'Syria' },
  'SZ': { ko: '에스와티니', en: 'Eswatini' },
  'TC': { ko: '터크스 케이커스제도', en: 'Turks and Caicos Islands' },
  'TD': { ko: '차드', en: 'Chad' },
  'TG': { ko: '토고', en: 'Togo' },
  'TH': { ko: '태국', en: 'Thailand' },
  'TJ': { ko: '타지키스탄', en: 'Tajikistan' },
  'TL': { ko: '동티모르', en: 'East Timor' },
  'TM': { ko: '투르크메니스탄', en: 'Turkmenistan' },
  'TN': { ko: '튀니지', en: 'Tunisia' },
  'TO': { ko: '통가', en: 'Tonga' },
  'TR': { ko: '터키', en: 'Turkey' },
  'TT': { ko: '트리니다드 토바고', en: 'Trinidad and Tobago' },
  'TV': { ko: '투발루', en: 'Tuvalu' },
  'TW': { ko: '대만', en: 'Taiwan' },
  'TZ': { ko: '탄자니아', en: 'Tanzania' },
  'UA': { ko: '우크라이나', en: 'Ukraine' },
  'UG': { ko: '우간다', en: 'Uganda' },
  'US': { ko: '미국', en: 'United States' },
  'UY': { ko: '우루과이', en: 'Uruguay' },
  'UZ': { ko: '우즈베키스탄', en: 'Uzbekistan' },
  'VA': { ko: '바티칸', en: 'Vatican City' },
  'VC': { ko: '세인트빈센트 그레나딘', en: 'Saint Vincent and the Grenadines' },
  'VE': { ko: '베네수엘라', en: 'Venezuela' },
  'VG': { ko: '영국령 버진아일랜드', en: 'British Virgin Islands' },
  'VI': { ko: '미국령 버진아일랜드', en: 'U.S. Virgin Islands' },
  'VN': { ko: '베트남', en: 'Vietnam' },
  'VU': { ko: '바누아투', en: 'Vanuatu' },
  'WF': { ko: '왈리스 푸투나', en: 'Wallis and Futuna' },
  'WS': { ko: '사모아', en: 'Samoa' },
  'YE': { ko: '예멘', en: 'Yemen' },
  'ZA': { ko: '남아프리카공화국', en: 'South Africa' },
  'ZM': { ko: '잠비아', en: 'Zambia' },
  'ZW': { ko: '짐바브웨', en: 'Zimbabwe' },
};

async function getCollectedCountries(): Promise<string[]> {
  const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
  const files = await fs.promises.readdir(holidaysDir);
  
  const countries = new Set<string>();
  for (const file of files) {
    if (file.endsWith('.json')) {
      const countryCode = file.split('-')[0].toUpperCase();
      countries.add(countryCode);
    }
  }
  
  return Array.from(countries).sort();
}

async function updateTranslationFile(locale: 'ko' | 'en', collectedCountries: string[]) {
  const filePath = path.join(process.cwd(), 'src', 'locales', locale, 'countries.json');
  
  const translations: Record<string, string> = {};
  
  for (const countryCode of collectedCountries) {
    const translation = COUNTRY_TRANSLATIONS[countryCode];
    if (translation) {
      translations[countryCode] = translation[locale];
    } else {
      console.warn(`번역 누락: ${countryCode}`);
      translations[countryCode] = countryCode; // 기본값으로 국가 코드 사용
    }
  }
  
  // 파일 저장
  await fs.promises.writeFile(
    filePath, 
    JSON.stringify(translations, null, 2), 
    'utf-8'
  );
  
  console.log(`✅ ${locale} 번역 파일 업데이트 완료: ${Object.keys(translations).length}개 국가`);
}

async function main() {
  console.log('🌐 국가 번역 파일 업데이트 스크립트');
  console.log('===================================');
  
  try {
    // 수집된 국가 목록 가져오기
    const collectedCountries = await getCollectedCountries();
    console.log(`📊 수집된 국가: ${collectedCountries.length}개`);
    
    // 한국어 번역 파일 업데이트
    await updateTranslationFile('ko', collectedCountries);
    
    // 영어 번역 파일 업데이트
    await updateTranslationFile('en', collectedCountries);
    
    console.log('\n🎉 모든 번역 파일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 번역 파일 업데이트 실패:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}