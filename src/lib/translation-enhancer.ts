import { Holiday } from '@/types';

// 공휴일 이름 번역 매핑
const HOLIDAY_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  ko: {
    // 미국 공휴일
    "New Year's Day": "신정",
    "Martin Luther King, Jr. Day": "마틴 루터 킹 데이",
    "Presidents' Day": "대통령의 날",
    "Memorial Day": "현충일",
    "Independence Day": "독립기념일",
    "Labor Day": "노동절",
    "Columbus Day": "콜럼버스 데이",
    "Veterans Day": "재향군인의 날",
    "Thanksgiving": "추수감사절",
    "Christmas": "크리스마스",
    "Christmas Day": "크리스마스",
    
    // 영국 공휴일
    "Boxing Day": "박싱 데이",
    "Good Friday": "성금요일",
    "Easter Monday": "부활절 월요일",
    "May Day": "메이데이",
    "Spring Bank Holiday": "봄 은행 휴일",
    "Summer Bank Holiday": "여름 은행 휴일",
    
    // 프랑스 공휴일
    "Bastille Day": "바스티유 데이",
    "Assumption of Mary": "성모승천일",
    "All Saints' Day": "만성절",
    "Armistice Day": "휴전기념일",
    
    // 일본 공휴일
    "Golden Week": "골든위크",
    "Children's Day": "어린이날",
    "Constitution Memorial Day": "헌법기념일",
    "Greenery Day": "녹색의 날",
    "Marine Day": "바다의 날",
    "Mountain Day": "산의 날",
    "Respect for the Aged Day": "경로의 날",
    "Health and Sports Day": "체육의 날",
    "Culture Day": "문화의 날",
    "Labour Thanksgiving Day": "근로감사의 날",
    "Emperor's Birthday": "천황탄생일",
    "Showa Day": "쇼와의 날",
    "Coming of Age Day": "성인의 날",
    "National Foundation Day": "건국기념일",
    "Vernal Equinox Day": "춘분의 날",
    "Autumnal Equinox Day": "추분의 날",
    
    // 한국 공휴일 (영어 이름 → 한국어 이름)
    "Lunar New Year": "설날",
    "Independence Movement Day": "삼일절",
    "Buddha's Birthday": "부처님오신날",
    "Liberation Day": "광복절",
    "Chuseok": "추석",
    "Hangeul Day": "한글날",
    
    // 싱가포르 공휴일
    "Chinese New Year": "중국 신정",
    "Hari Raya Puasa": "하리 라야 푸아사",
    "Vesak Day": "웨삭 데이",
    "Hari Raya Haji": "하리 라야 하지",
    "National Day": "국경일",
    "Deepavali": "디파발리",
    "Labour Day": "노동절"
  },
  en: {
    "신정": "New Year's Day",
    "설날": "Lunar New Year",
    "삼일절": "Independence Movement Day",
    "어린이날": "Children's Day",
    "부처님오신날": "Buddha's Birthday",
    "현충일": "Memorial Day",
    "광복절": "Liberation Day",
    "추석": "Chuseok (Korean Thanksgiving)",
    "개천절": "National Foundation Day",
    "한글날": "Hangeul Day",
    "크리스마스": "Christmas",
    "석가탄신일": "Buddha's Birthday",
    "근로자의날": "Labour Day",
    "어버이날": "Parents' Day",
    "스승의날": "Teachers' Day",
    "성탄절": "Christmas Day"
  }
};

// 공휴일 설명 번역 매핑
const HOLIDAY_DESCRIPTION_TRANSLATIONS: Record<string, Record<string, string>> = {
  ko: {
    // 미국 공휴일
    "New Year's Day": "새로운 한 해의 시작을 축하하는 날로, 전 세계적으로 가장 보편적인 명절 중 하나입니다. 미국에서는 타임스퀘어의 볼 드롭 행사가 상징적이며, 새해 결심을 세우고 가족과 함께 시간을 보내는 전통이 있습니다.",
    "Martin Luther King, Jr. Day": "미국의 위대한 인권 운동가 마틴 루터 킹 주니어를 기념하는 연방 공휴일로, 매년 1월 셋째 주 월요일에 기념됩니다. 1963년 워싱턴 대행진에서 '나에게는 꿈이 있습니다' 연설로 유명한 킹 목사의 비폭력 저항 정신과 인종 평등을 위한 투쟁을 기리는 날입니다.",
    "Presidents' Day": "조지 워싱턴과 에이브러햄 링컨을 비롯한 미국 대통령들을 기리는 연방 공휴일입니다. 원래는 워싱턴의 생일을 기념하던 날이었으나, 현재는 모든 대통령을 기리는 날로 확대되었습니다.",
    "Memorial Day": "나라를 위해 목숨을 바친 군인들을 추모하는 미국의 국가 기념일입니다. 5월 마지막 주 월요일에 기념되며, 국립묘지에서 추도식이 열리고 전국적으로 성조기를 게양합니다.",
    "Independence Day": "1776년 7월 4일 독립선언서 채택을 기념하는 미국 최대의 국경일입니다. 빨강, 하양, 파랑의 성조기 색깔로 장식하고, 바베큐 파티와 불꽃놀이로 자유와 독립정신을 축하합니다.",
    "Labor Day": "미국의 노동절로, 9월 첫째 주 월요일에 기념됩니다. 노동자들의 권익과 기여를 인정하는 날이며, 여름 휴가철의 마지막을 알리는 상징적인 의미도 있습니다.",
    "Columbus Day": "크리스토퍼 콜럼버스의 아메리카 대륙 발견을 기념하는 날입니다. 10월 둘째 주 월요일에 기념되지만, 원주민에 대한 역사적 관점 때문에 논란이 있는 공휴일이기도 합니다.",
    "Veterans Day": "모든 재향군인들을 기리는 날로, 11월 11일에 기념됩니다. 제1차 세계대전 종전일에서 유래되었으며, 국가를 위해 복무한 모든 군인들에게 감사를 표하는 날입니다.",
    "Thanksgiving": "가족이 모여 한 해의 감사함을 나누는 미국의 대표적인 명절입니다. 칠면조 요리를 중심으로 한 풍성한 식사와 함께, 각자가 감사한 일들을 나누는 전통이 있습니다.",
    "Christmas": "예수 그리스도의 탄생을 기념하는 기독교 최대 명절로, 미국에서는 종교를 넘어 문화적 축제로 자리잡았습니다. 크리스마스 트리 장식, 선물 교환, 캐럴 부르기 등의 전통이 있습니다.",
    
    // 영국 공휴일
    "Boxing Day": "크리스마스 다음 날인 12월 26일로, 영국과 영연방 국가들의 독특한 전통 휴일입니다. 과거 주인이 하인들에게 선물 상자를 주던 관습에서 유래되었습니다.",
    "Good Friday": "예수 그리스도의 십자가 처형을 기념하는 기독교의 성금요일입니다. 부활절 전 금요일에 해당하며, 기독교도들에게는 매우 중요한 종교적 의미를 가진 날입니다.",
    "Easter Monday": "부활절 다음 월요일로, 예수 그리스도의 부활을 기념하는 기독교 명절의 연장선상에 있는 공휴일입니다. 영국과 많은 유럽 국가에서 공휴일로 지정되어 있습니다.",
    "May Day": "5월 1일 노동절로, 전 세계 노동자들의 권익을 기리는 국제적인 기념일입니다. 영국에서는 전통적인 봄 축제의 의미도 함께 가지고 있습니다.",
    "Spring Bank Holiday": "영국의 봄 은행 휴일로, 5월 마지막 주 월요일에 기념됩니다. 원래는 성령강림절(Whitsun)을 기념하던 날이었으나, 현재는 세속적인 공휴일로 자리잡았습니다.",
    "Summer Bank Holiday": "영국의 여름 은행 휴일로, 8월 마지막 주 월요일에 기념됩니다. 여름 휴가철의 마지막을 장식하는 공휴일로, 많은 사람들이 여행이나 야외 활동을 즐깁니다.",
    
    // 일본 공휴일
    "Golden Week": "4월 말부터 5월 초까지 이어지는 일본 최대의 연휴 기간으로, 여러 공휴일이 연결되어 형성됩니다. 일본인들의 대표적인 휴가철입니다.",
    "Children's Day": "어린이의 인격을 존중하고 행복을 도모하며 어머니에게 감사하는 마음을 기르는 날입니다. 집집마다 잉어 깃발을 달고 무사 인형을 장식합니다.",
    "Constitution Memorial Day": "1947년 일본국 헌법이 시행된 것을 기념하는 날입니다. 5월 3일에 기념되며, 민주주의와 평화주의를 바탕으로 한 현행 헌법의 의미를 되새기는 날입니다.",
    "Greenery Day": "자연에 친숙하고 그 은혜에 감사하며 풍부한 마음을 기르는 날입니다. 원래는 쇼와 천황의 생일이었으나, 현재는 자연을 사랑하는 마음을 기르는 날로 의미가 바뀌었습니다.",
    "Marine Day": "바다의 은혜에 감사하고 해양국가 일본의 번영을 기원하는 날입니다. 7월 셋째 주 월요일에 기념되며, 바다와 관련된 다양한 행사가 열립니다.",
    "Mountain Day": "산에 친숙해지고 산의 은혜에 감사하는 날입니다. 2016년에 새로 제정된 비교적 새로운 공휴일로, 8월 11일에 기념됩니다.",
    "Respect for the Aged Day": "다년간 사회에 기여해온 노인을 공경하고 장수를 축하하는 날입니다. 9월 셋째 주 월요일에 기념되며, 고령화 사회인 일본의 특성을 반영한 공휴일입니다.",
    "Health and Sports Day": "스포츠에 친숙하고 건강한 심신을 기르는 날입니다. 원래는 1964년 도쿄 올림픽 개회식을 기념하던 '체육의 날'이었으나, 현재는 건강과 스포츠를 장려하는 날로 의미가 확장되었습니다.",
    "Culture Day": "자유와 평화를 사랑하고 문화를 진흥하는 날입니다. 11월 3일에 기념되며, 문화 훈장 수여식을 비롯해 전국적으로 문화 관련 행사가 열립니다.",
    "Labour Thanksgiving Day": "근로를 존중하고 생산을 축하하며 국민이 서로 감사하는 날입니다. 11월 23일에 기념되며, 일본 고유의 추수감사 전통과 현대적 근로 정신이 결합된 공휴일입니다.",
    
    // 싱가포르 공휴일
    "Chinese New Year": "음력 새해를 기념하는 중국계 주민들의 가장 중요한 명절입니다. 싱가포르에서는 2일간 공휴일로 지정되어 있으며, 전통 음식과 사자춤 등 다양한 문화 행사가 열립니다.",
    "Hari Raya Puasa": "이슬람교의 라마단 금식월이 끝나는 것을 축하하는 말레이계 무슬림들의 중요한 명절입니다. 가족과 친구들이 모여 전통 음식을 나누고 서로 용서를 구하는 의미 깊은 날입니다.",
    "Vesak Day": "부처님의 탄생, 깨달음, 열반을 기념하는 불교 최대의 명절입니다. 싱가포르의 불교도들은 이 날 사원을 방문하고 자선 활동에 참여하며 부처님의 가르침을 되새깁니다.",
    "Hari Raya Haji": "이슬람교의 성지순례(하지)를 기념하는 희생제 명절입니다. 아브라함이 하나님께 순종하여 아들을 바치려 했던 것을 기념하며, 가축을 희생하여 가난한 이들과 나누는 전통이 있습니다.",
    "National Day": "1965년 8월 9일 싱가포르가 말레이시아로부터 독립한 것을 기념하는 국경일입니다. 매년 성대한 퍼레이드와 불꽃놀이가 열리며, 국민들이 하나가 되어 국가의 발전을 축하합니다.",
    "Deepavali": "힌두교의 빛의 축제로, 선이 악을 이기고 빛이 어둠을 물리치는 것을 상징합니다. 인도계 주민들이 집을 등불로 장식하고 전통 과자를 나누며 새로운 시작을 기원합니다.",
    "Labour Day": "전 세계 노동자들의 권익과 기여를 기리는 국제 노동절입니다. 싱가포르에서는 5월 1일에 기념되며, 노동자들의 복지 향상과 사회 발전에 대한 의지를 다지는 날입니다.",
    "Christmas Day": "예수 그리스도의 탄생을 기념하는 기독교 최대 명절입니다. 다종교 사회인 싱가포르에서도 중요한 공휴일로, 종교를 넘어 모든 국민이 함께 축하하는 문화적 축제가 되었습니다."
  },
  en: {
    "설날": "Lunar New Year is the first day of the lunar calendar and the most important traditional holiday for Koreans. Families perform ancestral rites, give New Year greetings to elders through sebae, and eat tteokguk (rice cake soup) symbolizing growing a year older.\n\nThe whole family gathers to share traditional foods, enjoy traditional games like yutnori and kite flying, and continue the culture of wearing hanbok and performing sebae. It's a warm holiday filled with affection where people exchange New Year greetings and give and receive New Year's money.",
    "추석": "Chuseok falls on the 15th day of the 8th lunar month and is Korea's representative holiday for sharing the year's harvest with ancestors. Families make and eat songpyeon (rice cakes), honor ancestors through tomb visits, and enjoy traditional games like ganggangsullae under the full moon.\n\nCalled 'Korea's Thanksgiving,' it's a meaningful day to confirm family love along with the rich autumn atmosphere. The whole family gathers to share the year's hard work and express gratitude for their ancestors' grace.",
    "어린이날": "Children's Day was established to respect children's dignity and promote their happiness, honoring the spirit of Bang Jeong-hwan's love for children. Families visit amusement parks or zoos together and give children gifts to create a special day.\n\nBeyond just a holiday, it's a meaningful day that raises social awareness about children's rights and future. Various events and programs for children are held nationwide, creating a warm social atmosphere that supports children's dreams and hopes.",
    "부처님오신날": "Buddha's Birthday commemorates the birth of Gautama Buddha and is the most important Buddhist holiday, celebrated on the 8th day of the 4th lunar month. Temples across the country light colorful lanterns, and believers pray for Buddha's compassion and wisdom for peace of mind.\n\nThe Lotus Lantern Festival, which starts from Jogyesa Temple in Seoul and continues along Cheonggyecheon, creates a spectacular sight decorating spring nights and has become a major attraction not only for Buddhists but also for ordinary citizens.",
    "현충일": "Memorial Day is a national commemoration day to honor the patriotic martyrs and fallen heroes who sacrificed their lives for the country, observed every June 6th. A siren sounds nationwide at 10 AM, and all citizens observe a minute of silence, while the President and government officials hold a memorial service at the National Cemetery.\n\nThis day goes beyond simple remembrance to reflect on the preciousness of peace and the values of liberal democracy. It's a meaningful time to remember the sacrifice and patriotism of those who gave their lives for the country.",
    "광복절": "Liberation Day commemorates Korea's liberation from Japanese colonial rule on August 15, 1945, also called Gwangbok Day. It commemorates the historic day when Korea regained its sovereignty after 35 years of Japanese occupation and honors the noble spirit of the patriotic martyrs who sacrificed for independence.\n\nThe Korean flag is raised nationwide, memorial events are held centered around the Korea Liberation Association, and it's also a time to strengthen the will for peaceful unification through education about the history of Japanese occupation.",
    "개천절": "National Foundation Day commemorates the founding of Gojoseon by Dangun Wanggeom, observed every October 3rd. The name means 'the day heaven opened' and reflects on the historical significance of Dangun and the founding of Gojoseon as our nation's progenitor.\n\nThe Korean flag is raised nationwide, and traditional ceremonial events are held at places like Chamseongdan on Manisan in Ganghwa Island and Cheonwangbong Peak on Jirisan, providing a precious time to confirm our nation's long history and cultural identity.",
    "한글날": "Hangeul Day commemorates King Sejong the Great's creation and promulgation of Hunminjeongeum (Hangeul), observed every October 9th. Established to commemorate the publication of the Hunminjeongeum Haerye in 1446, this day honors the excellence of Hangeul and King Sejong's spirit of loving the people.\n\nAs the only country in the world to designate the creation day of its writing system as a national holiday, it's a precious time to proudly celebrate the scientific nature and originality of Hangeul and confirm our cultural identity.",
    "삼일절": "Independence Movement Day commemorates the March 1st Independence Movement of 1919, when Koreans declared independence from Japanese colonial rule. This peaceful demonstration for independence spread nationwide, with about 2 million people participating in this historic movement that showed the Korean people's passionate desire for independence.\n\nAlthough the immediate goal of independence was not achieved, this movement significantly raised awareness of Korea's independence internationally. The spirit of the March 1st Movement, which emphasized non-violent resistance and the will for independence, became a great milestone in Korea's independence movement and continues to be remembered as an important foundation of Korea's democracy today.\n\nThe March 1st Movement is celebrated as a significant national holiday throughout Korea, with memorial events held nationwide. In Seoul, the Tapgol Park area where the movement began hosts commemorative events, and schools conduct special educational programs about the independence movement.\n\nThis movement demonstrated the Korean people's mature civic consciousness and showed the world Korea's strong will for independence. Particularly, the fact that people from all walks of life, regardless of age or gender, participated together showed the power of national unity, and this spirit is still considered an important foundation of Korean society today.",
    "Independence Movement Day": "Independence Movement Day commemorates the March 1st Independence Movement of 1919, when Koreans declared independence from Japanese colonial rule. This peaceful demonstration for independence spread nationwide, with about 2 million people participating in this historic movement that showed the Korean people's passionate desire for independence.\n\nAlthough the immediate goal of independence was not achieved, this movement significantly raised awareness of Korea's independence internationally. The spirit of the March 1st Movement, which emphasized non-violent resistance and the will for independence, became a great milestone in Korea's independence movement and continues to be remembered as an important foundation of Korea's democracy today."
  }
};

/**
 * 공휴일 이름을 번역합니다
 */
export function translateHolidayName(name: string, targetLocale: string): string {
  const translations = HOLIDAY_NAME_TRANSLATIONS[targetLocale];
  if (!translations) return name;
  
  return translations[name] || name;
}

/**
 * 공휴일 설명을 번역합니다
 */
export function translateHolidayDescription(name: string, targetLocale: string): string {
  const translations = HOLIDAY_DESCRIPTION_TRANSLATIONS[targetLocale];
  if (!translations) return '';
  
  return translations[name] || '';
}

/**
 * 공휴일 객체 전체를 번역합니다
 */
export function translateHoliday(holiday: Holiday, targetLocale: string): Holiday {
  const translatedName = translateHolidayName(holiday.name, targetLocale);
  const translatedDescription = translateHolidayDescription(holiday.name, targetLocale);
  
  return {
    ...holiday,
    name: translatedName,
    description: translatedDescription || holiday.description
  };
}

/**
 * 공휴일 배열을 번역합니다
 */
export function translateHolidays(holidays: Holiday[], targetLocale: string): Holiday[] {
  return holidays.map(holiday => translateHoliday(holiday, targetLocale));
}