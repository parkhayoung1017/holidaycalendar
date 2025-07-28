import { Holiday, AIContentRequest, AIContentResponse } from '@/types';
import { logApiError, logWarning, logInfo } from './error-logger';

// 공휴일 설명 데이터베이스
interface HolidayDescription {
  name: string;
  keywords: string[]; // 매칭을 위한 키워드들
  description: string;
  culturalContext?: string; // 문화적 배경 설명
  historicalBackground?: string; // 역사적 배경
  modernCelebration?: string; // 현대적 기념 방식
  economicImpact?: string; // 경제적 영향
  regionalVariations?: string; // 지역별 차이점
}

// 다국어 공휴일 설명 데이터베이스
const HOLIDAY_DESCRIPTIONS: Record<string, Record<string, HolidayDescription[]>> = {
  ko: {
    // 미국 공휴일
    US: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해"],
        description: "새로운 한 해의 시작을 축하하는 날로, 전 세계적으로 가장 보편적인 명절 중 하나입니다. 미국에서는 타임스퀘어의 볼 드롭 행사가 상징적이며, 새해 결심을 세우고 가족과 함께 시간을 보내는 전통이 있습니다. 많은 사람들이 전년도를 돌아보고 새로운 목표를 설정하는 의미 있는 하루입니다.",
        culturalContext: "서구 문화권에서 그레고리력 기준 새해를 기념하는 전통",
        historicalBackground: "그레고리력 도입 이후 1월 1일이 공식적인 새해 첫날로 정착되었으며, 미국에서는 19세기부터 본격적인 축제 문화가 발달했습니다.",
        modernCelebration: "현대 미국에서는 타임스퀘어 볼 드롭, 로즈 퍼레이드, 가족 모임 등이 대표적인 기념 방식이며, 새해 결심(New Year's Resolution) 문화가 특히 발달했습니다.",
        economicImpact: "새해 연휴는 미국 소매업계에 중요한 시기로, 파티 용품, 샴페인, 선물 등의 매출이 크게 증가하며 관광업계에도 상당한 경제적 효과를 가져다줍니다."
      },
    {
      name: "Independence Day",
      keywords: ["independence", "4th july", "독립기념일"],
      description: "1776년 7월 4일 독립선언서 채택을 기념하는 미국 최대의 국경일입니다. 빨강, 하양, 파랑의 성조기 색깔로 장식하고, 바베큐 파티와 불꽃놀이로 자유와 독립정신을 축하합니다. 가족 단위의 피크닉과 퍼레이드가 전국 곳곳에서 열리며, 미국인들의 애국심이 가장 뜨겁게 표출되는 날입니다.",
      culturalContext: "미국 건국의 역사적 순간을 기념하는 국가적 자긍심의 상징"
    },
    {
      name: "Thanksgiving",
      keywords: ["thanksgiving", "추수감사절"],
      description: "가족이 모여 한 해의 감사함을 나누는 미국의 대표적인 명절입니다. 칠면조 요리를 중심으로 한 풍성한 식사와 함께, 각자가 감사한 일들을 나누는 전통이 있습니다. 1621년 플리머스 정착민들과 원주민들이 함께 나눈 첫 추수 축제에서 유래되었으며, 현재는 가족 유대감을 강화하는 소중한 시간으로 여겨집니다.",
      culturalContext: "청교도 정착민과 원주민의 화합에서 시작된 감사의 전통"
    },
    {
      name: "Christmas",
      keywords: ["christmas", "크리스마스"],
      description: "예수 그리스도의 탄생을 기념하는 기독교 최대 명절로, 미국에서는 종교를 넘어 문화적 축제로 자리잡았습니다. 크리스마스 트리 장식, 선물 교환, 캐럴 부르기 등의 전통이 있으며, 가족과의 따뜻한 시간을 보내는 것이 가장 중요한 의미입니다. 산타클로스 전설과 함께 어린이들에게는 마법 같은 하루이기도 합니다.",
      culturalContext: "기독교 전통이 세속적 축제 문화와 결합된 대표적 사례"
    }
  ],
  
  // 한국 공휴일
  KR: [
    {
      name: "설날",
      keywords: ["lunar new year", "설날", "korean new year"],
      description: "음력 새해 첫날로, 한국인들이 가장 중요하게 여기는 전통 명절입니다. 조상에게 차례를 지내고, 세배를 통해 어른들께 새해 인사를 드리며, 떡국을 먹어 한 살 더 먹는다는 의미를 담고 있습니다. 온 가족이 모여 윷놀이, 연날리기 등 전통 놀이를 즐기며, 한복을 입고 조상의 지혜를 기리는 소중한 시간입니다.",
      culturalContext: "농경사회의 계절 순환과 조상 숭배 사상이 결합된 전통"
    },
    {
      name: "추석",
      keywords: ["chuseok", "추석", "harvest festival"],
      description: "음력 8월 15일로, 한 해 농사의 결실을 조상과 함께 나누는 한국의 대표적인 명절입니다. 송편을 빚어 먹고, 성묘를 통해 조상을 기리며, 보름달 아래에서 강강술래 등 전통 놀이를 즐깁니다. '한국의 추수감사절'이라 불리며, 풍요로운 가을의 정취와 함께 가족 간의 사랑을 확인하는 뜻깊은 날입니다.",
      culturalContext: "농업 중심 사회의 수확 축제와 조상 공경 문화의 융합"
    },
    {
      name: "어린이날",
      keywords: ["children's day", "어린이날"],
      description: "어린이들의 인격을 존중하고 행복을 도모하기 위해 제정된 날로, 방정환 선생의 어린이 사랑 정신을 기리고 있습니다. 가족들이 함께 놀이공원이나 동물원을 방문하고, 어린이들에게 선물을 주며 특별한 하루를 만들어줍니다. 단순한 휴일을 넘어 어린이의 권리와 미래에 대한 사회적 관심을 환기시키는 의미 있는 날입니다.",
      culturalContext: "근대 아동 인권 의식과 교육 개혁 정신의 산물"
    }
  ],

  // 일본 공휴일
  JP: [
    {
      name: "New Year's Day",
      keywords: ["new year", "새해", "신정"],
      description: "일본에서 가장 중요한 명절로, 새로운 한 해의 시작을 축하하는 날입니다. 가족들이 모여 오세치 요리를 나누어 먹고, 신사에 하츠모데(첫 참배)를 하며 한 해의 행운을 빕니다. 전통적으로 문에 카도마츠를 장식하고, 연하장을 주고받으며 새해 인사를 나누는 일본만의 독특한 문화가 있습니다.",
      culturalContext: "일본 전통 문화와 현대적 축제가 조화롭게 어우러진 대표적 명절"
    },
    {
      name: "Coming of Age Day",
      keywords: ["coming of age", "성인의 날", "seijin no hi"],
      description: "만 20세가 된 청년들의 성인식을 축하하는 날로, 1월 둘째 주 월요일에 기념합니다. 새로 성인이 된 여성들은 화려한 기모노를 입고, 남성들은 정장을 차려입고 지역 성인식에 참가합니다. 이 날은 성인으로서의 책임감을 일깨우고, 사회의 일원으로 환영받는 의미 있는 통과의례입니다.",
      culturalContext: "일본 사회의 집단주의 문화와 전통 의례가 결합된 현대적 성인식"
    },
    {
      name: "Foundation Day",
      keywords: ["foundation day", "건국기념일", "kenkoku kinen no hi"],
      description: "일본의 건국을 기념하는 국경일로, 초대 천황인 진무천황의 즉위일로 전해지는 날입니다. 일본의 역사와 전통을 되새기며 국가적 정체성을 확인하는 날로, 전국에서 다양한 기념행사가 열립니다. 일본인들이 자국의 유구한 역사와 문화적 전통에 대한 자긍심을 갖는 소중한 기회입니다.",
      culturalContext: "일본 천황제와 국가 정체성이 결합된 전통적 국경일"
    },
    {
      name: "The Emperor's Birthday",
      keywords: ["emperor birthday", "천황탄생일", "tenno tanjobi"],
      description: "현재 천황의 생일을 기념하는 국경일로, 일본 국민들이 천황에 대한 경의를 표하는 날입니다. 황궁에서는 일반 참하가 허용되어 많은 시민들이 천황을 뵙기 위해 모입니다. 이 날은 일본의 상징인 천황제를 통해 국민 통합과 전통 문화의 계승을 확인하는 의미 있는 시간입니다.",
      culturalContext: "일본 천황제의 상징적 의미와 국민 통합 정신의 표현"
    },
    {
      name: "Vernal Equinox Day",
      keywords: ["vernal equinox", "춘분의 날", "shunbun no hi"],
      description: "춘분을 기념하는 날로, 자연과 생물을 사랑하고 기리는 의미를 담고 있습니다. 이 시기에는 벚꽃이 피기 시작하여 일본 전국이 봄의 정취에 물들며, 많은 사람들이 조상의 묘를 찾아 성묘를 합니다. 낮과 밤의 길이가 같아지는 자연의 균형을 통해 생명의 소중함을 되새기는 철학적 의미가 깊은 날입니다.",
      culturalContext: "일본의 자연 숭배 사상과 조상 공경 문화가 결합된 전통 절기"
    },
    {
      name: "Shōwa Day",
      keywords: ["showa day", "쇼와의 날", "showa no hi"],
      description: "쇼와 천황의 생일을 기념하는 날로, 격동의 쇼와 시대를 되돌아보며 평화의 소중함을 되새기는 날입니다. 골든위크의 시작을 알리는 공휴일로도 유명하며, 이 시기부터 일본 전국이 휴가 분위기에 들어갑니다. 전쟁과 부흥을 경험한 쇼와 시대의 교훈을 통해 평화로운 현재에 감사하는 마음을 갖는 날입니다.",
      culturalContext: "일본 근현대사의 격동기를 기억하며 평화를 다짐하는 역사적 성찰의 날"
    },
    {
      name: "Constitution Memorial Day",
      keywords: ["constitution day", "헌법기념일", "kenpo kinenbi"],
      description: "1947년 일본 평화헌법 시행을 기념하는 날로, 민주주의와 평화주의 정신을 되새기는 국경일입니다. 골든위크 중 하나로 많은 국민들이 휴식을 취하지만, 동시에 전후 일본의 평화 노선과 민주주의 발전을 되돌아보는 의미 있는 날이기도 합니다. 헌법이 보장하는 기본권과 평화의 가치를 재확인하는 소중한 기회입니다.",
      culturalContext: "전후 일본의 평화 헌법 정신과 민주주의 가치를 기념하는 현대적 국경일"
    },
    {
      name: "Greenery Day",
      keywords: ["greenery day", "녹색의 날", "midori no hi"],
      description: "자연에 친숙하고 그 은혜에 감사하며 풍부한 마음을 기르는 날로 제정된 공휴일입니다. 원래는 쇼와 천황의 생물학에 대한 관심과 자연 사랑을 기리기 위해 만들어졌으며, 현재는 환경 보호와 자연 보전의 중요성을 일깨우는 날로 자리잡았습니다. 골든위크 기간 중 가족들과 함께 자연을 만끽하며 환경의 소중함을 되새기는 시간입니다.",
      culturalContext: "일본의 자연 사랑 정신과 환경 보호 의식이 결합된 현대적 기념일"
    },
    {
      name: "Children's Day",
      keywords: ["children day", "어린이날", "kodomo no hi"],
      description: "어린이의 인격을 존중하고 행복을 도모하며 어머니에게 감사하는 마음을 기르는 날입니다. 전통적으로 남자아이의 건강한 성장을 기원하는 단오절에서 유래되었으며, 집집마다 잉어 깃발(고이노보리)을 달고 무사 인형을 장식합니다. 현재는 성별에 관계없이 모든 어린이의 건강과 행복을 기원하는 따뜻한 가족 명절로 자리잡았습니다.",
      culturalContext: "일본 전통 절기와 현대적 아동 복지 정신이 조화롭게 결합된 명절"
    },
    {
      name: "Marine Day",
      keywords: ["marine day", "바다의 날", "umi no hi"],
      description: "바다의 은혜에 감사하고 해양 국가 일본의 번영을 기원하는 날로 제정된 공휴일입니다. 7월 셋째 주 월요일에 기념하며, 여름 휴가철의 시작을 알리는 의미도 있습니다. 사면이 바다로 둘러싸인 일본의 지리적 특성을 반영하여, 해양 자원의 소중함과 바다 환경 보호의 중요성을 되새기는 현대적 기념일입니다.",
      culturalContext: "해양 국가 일본의 정체성과 환경 보호 의식을 반영한 현대적 공휴일"
    },
    {
      name: "Mountain Day",
      keywords: ["mountain day", "산의 날", "yama no hi"],
      description: "산에 친숙해지고 산의 은혜에 감사하는 마음을 기르기 위해 제정된 일본에서 가장 새로운 공휴일입니다. 2016년부터 시행되기 시작했으며, 국토의 70%가 산지인 일본의 자연환경을 소중히 여기는 마음을 담고 있습니다. 여름 휴가철에 가족들과 함께 등산이나 자연 체험을 통해 산의 아름다움과 소중함을 느끼는 기회를 제공합니다.",
      culturalContext: "일본의 산악 지형과 자연 보호 의식을 반영한 21세기형 신설 공휴일"
    },
    {
      name: "Respect for the Aged Day",
      keywords: ["respect aged", "경로의 날", "keiro no hi"],
      description: "다년간 사회에 기여해온 노인을 공경하고 장수를 축하하는 날로, 9월 셋째 주 월요일에 기념합니다. 일본의 전통적인 효 사상과 현대 사회의 고령화 현실이 결합된 의미 있는 공휴일입니다. 이 날에는 가족들이 조부모를 찾아뵙고, 지역사회에서는 고령자를 위한 다양한 행사와 건강 검진 등이 열려 세대 간 화합을 도모합니다.",
      culturalContext: "일본의 전통적 효 문화와 현대 고령 사회의 현실이 만나는 세대 통합의 날"
    },
    {
      name: "Autumnal Equinox Day",
      keywords: ["autumnal equinox", "추분의 날", "shubun no hi"],
      description: "추분을 기념하며 조상을 기리고 돌아가신 분들을 그리워하는 날입니다. 춘분의 날과 함께 일본의 대표적인 절기 공휴일로, 이 시기에는 전국적으로 성묘를 하며 조상에 대한 감사의 마음을 표합니다. 낮과 밤의 길이가 같아지는 자연의 균형 속에서 생과 사, 현재와 과거를 연결하는 철학적 성찰의 시간을 갖습니다.",
      culturalContext: "일본의 조상 숭배 문화와 자연 철학이 깊이 결합된 전통적 절기"
    },
    {
      name: "Sports Day",
      keywords: ["sports day", "체육의 날", "taiiku no hi"],
      description: "스포츠에 친숙해지고 건전한 심신을 기르기 위해 제정된 공휴일로, 1964년 도쿄 올림픽 개막일을 기념하여 만들어졌습니다. 10월 둘째 주 월요일에 기념하며, 전국 각지에서 운동회와 체육 행사가 열립니다. 일본이 국제 스포츠 무대에서 거둔 성과를 기리고, 국민 건강 증진과 스포츠 정신 함양을 도모하는 현대적 기념일입니다.",
      culturalContext: "1964년 도쿄 올림픽의 성공과 일본의 스포츠 발전을 기념하는 현대적 공휴일"
    },
    {
      name: "Culture Day",
      keywords: ["culture day", "문화의 날", "bunka no hi"],
      description: "자유와 평화를 사랑하며 문화를 진흥한다는 취지로 제정된 날로, 일본 헌법 공포일을 기념합니다. 전국의 박물관과 미술관에서 특별 전시가 열리고, 문화 훈장 수여식이 거행됩니다. 가을의 정취와 함께 일본의 전통문화와 현대 예술을 재조명하며, 문화적 자긍심을 키우는 뜻깊은 하루입니다.",
      culturalContext: "전후 평화 헌법 정신과 문화 국가 지향 의식의 표현"
    },
    {
      name: "Labour Thanksgiving Day",
      keywords: ["labour thanksgiving", "근로감사의 날", "kinro kansha no hi"],
      description: "근로를 소중히 여기고 생산을 축하하며 국민이 서로 감사하는 마음을 기르는 날입니다. 원래는 추수를 감사하는 전통적인 니이나메사이(新嘗祭)에서 유래되었으며, 현재는 근로자의 노고를 치하하고 상호 감사의 정신을 기르는 현대적 의미로 발전했습니다. 가을 수확의 계절에 맞춰 노동의 가치와 상호 협력의 중요성을 되새기는 뜻깊은 날입니다.",
      culturalContext: "일본 전통 추수 감사제와 현대적 근로 정신이 결합된 독특한 공휴일"
    }
  ],

  // 영국 공휴일
  GB: [
    {
      name: "Boxing Day",
      keywords: ["boxing day"],
      description: "크리스마스 다음 날인 12월 26일로, 영국과 영연방 국가들의 독특한 전통 휴일입니다. 과거 주인이 하인들에게 선물 상자를 주던 관습에서 유래되었으며, 현재는 가족과 함께 여유로운 시간을 보내거나 쇼핑을 즐기는 날입니다. 축구 경기 관람이나 산책 등을 통해 크리스마스의 여운을 이어가는 영국만의 특별한 문화입니다.",
      culturalContext: "빅토리아 시대 계급 사회의 온정주의가 현대적 휴일로 발전"
    },
    {
      name: "Guy Fawkes Night",
      keywords: ["guy fawkes", "bonfire night"],
      description: "1605년 화약 음모 사건을 기념하는 영국의 독특한 축제일로, 11월 5일에 열립니다. 가이 포크스의 인형을 태우는 모닥불과 화려한 불꽃놀이가 전국에서 펼쳐지며, 'Remember, remember the fifth of November'라는 구호로 유명합니다. 역사적 사건을 재미있는 축제로 승화시킨 영국인들의 유머와 전통 보존 정신을 보여주는 날입니다.",
      culturalContext: "정치적 반역 사건이 민속 축제로 전환된 독특한 역사적 사례"
    }
  ],

  // 프랑스 공휴일
  FR: [
    {
      name: "Bastille Day",
      keywords: ["bastille day", "바스티유 데이"],
      description: "1789년 7월 14일 바스티유 감옥 습격 사건을 기념하는 프랑스 혁명 기념일입니다. 샹젤리제 거리에서 열리는 대규모 군사 퍼레이드와 에펠탑 불꽃놀이가 장관을 이루며, 자유, 평등, 박애의 공화국 정신을 되새기는 날입니다. 프랑스인들의 혁명 정신과 민주주의에 대한 자긍심이 가장 뜨겁게 표출되는 국경일입니다.",
      culturalContext: "근대 민주주의 혁명의 상징적 사건을 기념하는 공화국 정신의 축제"
    }
  ],

  // 캐나다 공휴일
  CA: [
    {
      name: "Canada Day",
      keywords: ["canada day", "캐나다 데이"],
      description: "1867년 7월 1일 캐나다 연방 결성을 기념하는 국경일로, 캐나다인들의 국가적 자긍심이 표출되는 날입니다. 빨간색과 흰색으로 장식하고, 메이플 리프 깃발을 흔들며 다문화 사회 캐나다의 포용성과 평화로운 독립 정신을 축하합니다. 오타와 국회의사당에서 열리는 기념식과 전국 각지의 축제가 캐나다의 온화하고 포용적인 국민성을 잘 보여줍니다.",
      culturalContext: "평화적 연방 결성과 다문화주의 가치를 기념하는 현대적 국경일"
    }
  ]
  },
  
  // 영어 설명 데이터베이스
  en: {
    // 미국 공휴일
    US: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해"],
        description: "New Year's Day marks the beginning of a new year and is one of the most universally celebrated holidays worldwide. In the United States, the iconic Times Square Ball Drop ceremony symbolizes the transition, while families gather to make resolutions and spend quality time together. This meaningful day allows people to reflect on the past year and set new goals for the future.",
        culturalContext: "Western tradition of celebrating the Gregorian calendar new year",
        historicalBackground: "Since the adoption of the Gregorian calendar, January 1st has been established as the official first day of the new year, with America developing a full festival culture from the 19th century.",
        modernCelebration: "Modern American celebrations include the Times Square Ball Drop, Rose Parade, family gatherings, and the particularly developed culture of New Year's Resolutions.",
        economicImpact: "The New Year holiday is crucial for American retail, with significant increases in sales of party supplies, champagne, and gifts, bringing considerable economic benefits to the tourism industry."
      },
      {
        name: "Independence Day",
        keywords: ["independence", "4th july", "독립기념일"],
        description: "Independence Day commemorates the adoption of the Declaration of Independence on July 4, 1776, making it America's greatest national holiday. Decorated in red, white, and blue colors of the flag, Americans celebrate freedom and independence with barbecue parties and fireworks. Family picnics and parades are held nationwide, making this the day when American patriotism is most passionately expressed.",
        culturalContext: "Symbol of national pride commemorating the historic moment of America's founding"
      },
      {
        name: "Thanksgiving",
        keywords: ["thanksgiving", "추수감사절"],
        description: "Thanksgiving is America's representative holiday where families gather to share gratitude for the year. Centered around a feast featuring turkey, there's a tradition of sharing what each person is thankful for. Originating from the first harvest celebration shared by Plymouth settlers and Native Americans in 1621, it's now considered a precious time for strengthening family bonds.",
        culturalContext: "Tradition of gratitude that began with harmony between Puritan settlers and Native Americans"
      },
      {
        name: "Christmas",
        keywords: ["christmas", "크리스마스"],
        description: "Christmas commemorates the birth of Jesus Christ and is Christianity's greatest holiday, having established itself as a cultural celebration beyond religion in America. Traditions include decorating Christmas trees, exchanging gifts, and singing carols, with spending warm time with family being the most important meaning. Along with the Santa Claus legend, it's also a magical day for children.",
        culturalContext: "Representative example of Christian tradition combined with secular festival culture"
      }
    ],
    
    // 한국 공휴일
    KR: [
      {
        name: "Lunar New Year",
        keywords: ["lunar new year", "설날", "korean new year"],
        description: "Lunar New Year is the first day of the lunar calendar and the most important traditional holiday for Koreans. Families perform ancestral rites, give New Year greetings to elders through sebae, and eat tteokguk (rice cake soup) symbolizing growing a year older. The whole family gathers to enjoy traditional games like yutnori and kite flying, wearing hanbok to honor ancestral wisdom in this precious time.",
        culturalContext: "Tradition combining agricultural society's seasonal cycles with ancestor worship"
      },
      {
        name: "Chuseok",
        keywords: ["chuseok", "추석", "harvest festival"],
        description: "Chuseok falls on the 15th day of the 8th lunar month and is Korea's representative holiday for sharing the year's harvest with ancestors. Families make and eat songpyeon (rice cakes), honor ancestors through tomb visits, and enjoy traditional games like ganggangsullae under the full moon. Called 'Korea's Thanksgiving,' it's a meaningful day to confirm family love amid the rich autumn atmosphere.",
        culturalContext: "Fusion of agricultural society's harvest festival with ancestor reverence culture"
      },
      {
        name: "Children's Day",
        keywords: ["children's day", "어린이날"],
        description: "Children's Day was established to respect children's dignity and promote their happiness, honoring the spirit of Bang Jeong-hwan's love for children. Families visit amusement parks or zoos together and give children gifts to create a special day. Beyond a simple holiday, it's a meaningful day that raises social awareness about children's rights and future.",
        culturalContext: "Product of modern child rights consciousness and educational reform spirit"
      }
    ],

    // 일본 공휴일
    JP: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해", "신정"],
        description: "New Year's Day is Japan's most important holiday, celebrating the beginning of a new year. Families gather to share osechi cuisine and visit shrines for hatsumode (first shrine visit) to pray for good fortune in the coming year. There's a unique Japanese culture of decorating doors with kadomatsu and exchanging nengajo (New Year cards) for greetings.",
        culturalContext: "Representative holiday where Japanese traditional culture and modern celebration harmoniously blend"
      },
      {
        name: "Coming of Age Day",
        keywords: ["coming of age", "성인의 날", "seijin no hi"],
        description: "Coming of Age Day celebrates young people who have turned 20, commemorated on the second Monday of January. Newly adult women wear gorgeous kimono while men dress in formal suits to attend local coming-of-age ceremonies. This day serves as a meaningful rite of passage that awakens responsibility as adults and welcomes them as members of society.",
        culturalContext: "Modern coming-of-age ceremony combining Japanese society's collectivist culture with traditional rituals"
      }
    ],

    // 영국 공휴일
    GB: [
      {
        name: "Boxing Day",
        keywords: ["boxing day"],
        description: "Boxing Day, December 26th, is a unique traditional holiday in Britain and Commonwealth countries. Originating from the custom of masters giving gift boxes to servants, it's now a day for spending leisurely time with family or enjoying shopping. It's Britain's special culture of continuing Christmas spirit through activities like watching football matches or taking walks.",
        culturalContext: "Victorian era class society's paternalism evolved into a modern holiday"
      }
    ],

    // 프랑스 공휴일
    FR: [
      {
        name: "Bastille Day",
        keywords: ["bastille day", "바스티유 데이"],
        description: "Bastille Day commemorates the storming of the Bastille prison on July 14, 1789, marking the French Revolution anniversary. The grand military parade on the Champs-Élysées and Eiffel Tower fireworks create a spectacular scene, while the day reflects on the republican spirit of liberty, equality, and fraternity. It's the national day when French revolutionary spirit and pride in democracy are most passionately expressed.",
        culturalContext: "Festival of republican spirit commemorating the symbolic event of modern democratic revolution"
      }
    ],

    // 캐나다 공휴일
    CA: [
      {
        name: "Canada Day",
        keywords: ["canada day", "캐나다 데이"],
        description: "Canada Day commemorates the formation of the Canadian Confederation on July 1, 1867, as the national day when Canadians express their national pride. Decorated in red and white, waving the maple leaf flag, they celebrate Canada's multicultural society's inclusiveness and peaceful independence spirit. The ceremony at Ottawa's Parliament Hill and festivals across the nation well demonstrate Canada's gentle and inclusive national character.",
        culturalContext: "Modern national day commemorating peaceful confederation formation and multicultural values"
      }
    ]
  }
};

// 기본 템플릿 설명들
const DEFAULT_TEMPLATES = {
  religious: "{name}은(는) {country}에서 기념하는 종교적 명절로, 신앙인들에게 특별한 의미를 가지는 날입니다. 이 날에는 종교적 의식과 함께 가족들이 모여 전통을 이어가며, 영적 성찰과 감사의 시간을 갖습니다.",
  
  national: "{name}은(는) {country}의 중요한 국경일로, 국가의 역사와 전통을 기념하는 날입니다. 이 날에는 애국심을 표현하고 국가적 정체성을 되새기며, 시민들이 함께 축하하는 의미 있는 시간을 보냅니다.",
  
  cultural: "{name}은(는) {country}의 독특한 문화적 전통을 보여주는 특별한 날입니다. 지역 고유의 관습과 의식을 통해 문화적 정체성을 확인하고, 세대 간 전통 전수의 소중한 기회가 됩니다.",
  
  seasonal: "{name}은(는) 계절의 변화와 자연의 순환을 기념하는 전통적인 명절입니다. 이 시기의 자연 현상과 농업 활동을 바탕으로 형성된 풍습을 통해, 자연과 인간의 조화로운 관계를 되새기는 날입니다.",
  
  modern: "{name}은(는) 현대 사회의 가치와 이념을 반영하여 제정된 기념일입니다. 사회적 인식 개선과 특정 가치의 확산을 목적으로 하며, 현대인들의 삶에 의미 있는 메시지를 전달하는 날입니다."
};

/**
 * 공휴일 이름과 키워드를 매칭하여 가장 적합한 설명을 찾습니다
 */
function findBestMatch(holidayName: string, countryCode: string, locale: string = 'ko'): HolidayDescription | null {
  const localeDescriptions = HOLIDAY_DESCRIPTIONS[locale];
  if (!localeDescriptions) return null;
  
  const countryDescriptions = localeDescriptions[countryCode];
  if (!countryDescriptions) return null;

  const normalizedName = holidayName.toLowerCase();
  
  // 정확한 이름 매칭 우선
  let bestMatch = countryDescriptions.find(desc => 
    desc.name.toLowerCase() === normalizedName
  );
  
  if (bestMatch) return bestMatch;
  
  // 키워드 매칭
  bestMatch = countryDescriptions.find(desc =>
    desc.keywords.some(keyword => 
      normalizedName.includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(normalizedName)
    )
  );
  
  return bestMatch || null;
}

/**
 * 공휴일 유형을 추정하여 적절한 템플릿을 선택합니다
 */
function getHolidayTemplate(holidayName: string, countryName: string): string {
  const name = holidayName.toLowerCase();
  
  // 종교적 공휴일
  if (name.includes('christmas') || name.includes('easter') || name.includes('ramadan') || 
      name.includes('buddha') || name.includes('diwali') || name.includes('religious')) {
    return DEFAULT_TEMPLATES.religious;
  }
  
  // 국경일
  if (name.includes('independence') || name.includes('national') || name.includes('republic') ||
      name.includes('liberation') || name.includes('constitution')) {
    return DEFAULT_TEMPLATES.national;
  }
  
  // 계절/농업 관련
  if (name.includes('harvest') || name.includes('spring') || name.includes('autumn') ||
      name.includes('winter') || name.includes('summer')) {
    return DEFAULT_TEMPLATES.seasonal;
  }
  
  // 현대적 기념일
  if (name.includes('day') && (name.includes('women') || name.includes('children') || 
      name.includes('worker') || name.includes('environment'))) {
    return DEFAULT_TEMPLATES.modern;
  }
  
  // 기본값은 문화적 전통
  return DEFAULT_TEMPLATES.cultural;
}

/**
 * SEO 최적화된 독창적 공휴일 설명을 생성합니다
 */
function generateSEOOptimizedDescription(
  holidayName: string, 
  countryName: string, 
  countryCode: string,
  locale: string = 'ko'
): string {
  const baseMatch = findBestMatch(holidayName, countryCode, locale);
  
  if (baseMatch) {
    // 기존 설명을 바탕으로 SEO 최적화된 확장 콘텐츠 생성
    const sections = [];
    
    // 1. 기본 설명
    sections.push(baseMatch.description);
    
    // 2. 역사적 배경 (있는 경우)
    if (baseMatch.historicalBackground) {
      const historyTitle = locale === 'en' ? '**Historical Background**' : '**역사적 배경**';
      sections.push(`\n\n${historyTitle}\n${baseMatch.historicalBackground}`);
    }
    
    // 3. 현대적 기념 방식 (있는 경우)
    if (baseMatch.modernCelebration) {
      const modernTitle = locale === 'en' ? '**Modern Celebration**' : '**현대적 기념 방식**';
      sections.push(`\n\n${modernTitle}\n${baseMatch.modernCelebration}`);
    }
    
    // 4. 경제적 영향 (있는 경우)
    if (baseMatch.economicImpact) {
      const economicTitle = locale === 'en' ? '**Economic Impact**' : '**경제적 영향**';
      sections.push(`\n\n${economicTitle}\n${baseMatch.economicImpact}`);
    }
    
    // 5. 지역별 차이점 (있는 경우)
    if (baseMatch.regionalVariations) {
      const regionalTitle = locale === 'en' ? '**Regional Characteristics**' : '**지역별 특색**';
      sections.push(`\n\n${regionalTitle}\n${baseMatch.regionalVariations}`);
    }
    
    // 6. 문화적 의미 추가
    const culturalTitle = locale === 'en' ? '**Cultural Significance**' : '**문화적 의미**';
    const culturalDefault = locale === 'en' 
      ? `${holidayName} is an important day that showcases the unique cultural identity of ${countryName}.`
      : `${holidayName}은 ${countryName}의 독특한 문화적 정체성을 보여주는 중요한 날입니다.`;
    
    sections.push(`\n\n${culturalTitle}\n${baseMatch.culturalContext || culturalDefault}`);
    
    return sections.join('');
  }
  
  // 매칭되지 않은 경우 템플릿 기반 SEO 콘텐츠 생성
  return generateSEOTemplate(holidayName, countryName, locale);
}

/**
 * SEO 최적화된 템플릿 기반 콘텐츠 생성
 */
function generateSEOTemplate(holidayName: string, countryName: string, locale: string): string {
  const isKorean = locale === 'ko';
  
  if (isKorean) {
    return `${holidayName}은 ${countryName}에서 매년 기념하는 중요한 공휴일입니다. 이 특별한 날은 해당 국가의 역사와 문화적 전통을 반영하며, 국민들에게 깊은 의미를 가지고 있습니다.

**기념 방식과 전통**
${holidayName} 기간 동안 ${countryName} 전역에서는 다양한 기념 행사와 전통 의식이 열립니다. 가족들이 모여 특별한 음식을 나누고, 지역 공동체가 함께 참여하는 축제와 행사들이 개최됩니다.

**현대적 의미**
현대 사회에서 ${holidayName}은 단순한 휴일을 넘어 ${countryName} 국민들의 정체성을 확인하고 문화적 유대감을 강화하는 중요한 역할을 합니다. 이 날을 통해 전통과 현대가 조화롭게 어우러지는 모습을 볼 수 있습니다.

**사회적 영향**
${holidayName}은 ${countryName}의 사회적, 경제적 활동에도 중요한 영향을 미칩니다. 많은 기업과 기관이 휴무를 하며, 관광업계에서는 특별한 프로그램과 이벤트를 준비하여 국내외 방문객들에게 문화적 경험을 제공합니다.`;
  } else {
    return `${holidayName} is an important public holiday celebrated annually in ${countryName}. This special day reflects the country's history and cultural traditions, holding deep meaning for its people.

**Celebration Methods and Traditions**
During ${holidayName}, various commemorative events and traditional ceremonies are held throughout ${countryName}. Families gather to share special foods, and communities come together for festivals and events.

**Modern Significance**
In modern society, ${holidayName} goes beyond being just a holiday - it plays a crucial role in confirming the identity of ${countryName}'s people and strengthening cultural bonds. Through this day, we can see how tradition and modernity harmoniously blend together.

**Social Impact**
${holidayName} has a significant impact on ${countryName}'s social and economic activities. Many businesses and institutions close for the holiday, while the tourism industry prepares special programs and events to provide cultural experiences for domestic and international visitors.`;
  }
}

/**
 * 공휴일 설명을 생성합니다 (정적 데이터베이스 기반)
 * AI API 실패 시 기본 템플릿을 사용하는 폴백 로직 포함
 */
export async function generateHolidayDescription(request: AIContentRequest, locale: string = 'ko'): Promise<AIContentResponse> {
  try {
    logInfo(`공휴일 설명 생성 시작: ${request.holidayName} (${request.countryName})`);
    
    const { holidayId, holidayName, countryName, existingDescription } = request;
    
    // 이미 설명이 있으면 그대로 반환
    if (existingDescription && existingDescription.trim().length > 30) {
      logInfo(`기존 설명 사용: ${holidayName}`);
      return {
        holidayId,
        description: existingDescription.trim(),
        confidence: 1.0,
        generatedAt: new Date().toISOString()
      };
    }
    
    // 국가 코드 추출 (간단한 매핑)
    const countryCodeMap: Record<string, string> = {
      'United States': 'US',
      'South Korea': 'KR',
      'Korea': 'KR',
      'Japan': 'JP',
      'United Kingdom': 'GB',
      'Britain': 'GB',
      'France': 'FR',
      'Canada': 'CA'
    };
    
    const countryCode = countryCodeMap[countryName] || 'US';
    
    // 정적 데이터베이스에서 매칭 시도
    const bestMatch = findBestMatch(holidayName, countryCode);
    
    if (bestMatch) {
      logInfo(`데이터베이스 매칭 성공: ${holidayName}`);
      
      // 콘텐츠 품질 검증
      if (!validateContent(bestMatch.description)) {
        logWarning(`데이터베이스 콘텐츠 품질 검증 실패, 템플릿 사용: ${holidayName}`);
        return generateFallbackDescription(request);
      }
      
      return {
        holidayId,
        description: bestMatch.description,
        confidence: 0.9,
        generatedAt: new Date().toISOString()
      };
    }
    
    // 매칭되지 않으면 템플릿 사용
    logWarning(`데이터베이스 매칭 실패, 템플릿 사용: ${holidayName}`);
    return generateTemplateDescription(request, countryCode);
    
  } catch (error) {
    const aiError = error as Error;
    logApiError('generateHolidayDescription', aiError, { 
      holidayId: request.holidayId,
      holidayName: request.holidayName,
      countryName: request.countryName 
    });
    
    // 에러 발생 시 폴백 설명 사용
    return generateFallbackDescription(request);
  }
}

/**
 * 템플릿 기반 설명을 생성합니다
 */
function generateTemplateDescription(request: AIContentRequest, countryCode: string): AIContentResponse {
  try {
    const template = getHolidayTemplate(request.holidayName, request.countryName);
    const description = template
      .replace(/{name}/g, request.holidayName)
      .replace(/{country}/g, request.countryName);
    
    // 템플릿 설명도 품질 검증
    if (!validateContent(description)) {
      logWarning(`템플릿 콘텐츠 품질 검증 실패, 기본 폴백 사용: ${request.holidayName}`);
      return generateFallbackDescription(request);
    }
    
    logInfo(`템플릿 설명 생성 완료: ${request.holidayName}`);
    return {
      holidayId: request.holidayId,
      description,
      confidence: 0.6,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logApiError('generateTemplateDescription', error as Error, { holidayName: request.holidayName });
    return generateFallbackDescription(request);
  }
}

/**
 * 최종 폴백 설명을 생성합니다 (요구사항 8.3 구현)
 */
function generateFallbackDescription(request: AIContentRequest): AIContentResponse {
  logWarning(`기본 폴백 설명 사용: ${request.holidayName}`);
  
  // 가장 기본적이고 안전한 설명 템플릿
  const fallbackDescription = `${request.holidayName}은(는) ${request.countryName}에서 기념하는 특별한 날입니다. 이 날에는 전통적인 의식과 함께 가족들이 모여 의미 있는 시간을 보내며, 문화적 가치를 이어가는 소중한 기회가 됩니다. 각 지역의 고유한 관습과 전통을 통해 공동체의 결속을 다지고, 세대 간 문화 전승의 역할을 하는 중요한 날입니다.`;
  
  return {
    holidayId: request.holidayId,
    description: fallbackDescription,
    confidence: 0.3,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 국가별 공휴일 개요를 생성합니다 (다국어 지원)
 */
export async function generateCountryOverview(countryCode: string, countryName: string, locale: string = 'ko'): Promise<string> {
  const overviews: Record<string, Record<string, string>> = {
    ko: {
      US: "미국의 공휴일은 연방 공휴일과 주별 공휴일로 나뉘며, 다양한 문화적 배경을 가진 이민자들의 전통이 어우러져 독특한 축제 문화를 형성하고 있습니다. 독립기념일, 추수감사절 등 미국 고유의 역사와 가치를 반영한 공휴일들이 특징적이며, 각 주마다 고유한 기념일들도 함께 운영되어 연방제 국가의 다양성을 보여줍니다.",
      
      KR: "한국의 공휴일은 전통 명절과 현대적 기념일이 조화롭게 구성되어 있습니다. 설날과 추석 같은 음력 기반 전통 명절은 조상 숭배와 가족 중심 문화를 보여주며, 어린이날, 한글날 등은 근현대 한국의 가치관을 반영합니다. 특히 대체공휴일 제도를 통해 국민의 휴식권을 보장하고 있으며, 전통과 현대가 균형을 이루는 독특한 공휴일 체계를 갖추고 있습니다.",
      
      JP: "일본의 공휴일은 전통적인 절기와 현대적 가치가 균형을 이루고 있으며, 특히 골든위크와 같은 연휴 문화가 발달했습니다. 천황제와 관련된 공휴일과 함께 문화와 자연을 중시하는 일본인의 정서가 잘 드러나며, 하피먼데이 제도를 통해 3연휴를 만들어 국민의 여가 생활을 증진시키고 있습니다.",
      
      GB: "영국의 공휴일은 기독교 전통과 왕실 문화, 그리고 독특한 역사적 사건들을 기념하는 특색 있는 구성을 보입니다. 뱅크 홀리데이 시스템과 가이 포크스 나이트 같은 독특한 전통이 영국만의 문화적 정체성을 보여주며, 지역별로 다른 공휴일 체계를 통해 연합왕국의 다양성을 반영하고 있습니다.",
      
      FR: "프랑스의 공휴일은 가톨릭 전통과 공화국 정신이 공존하는 독특한 특징을 가집니다. 바스티유 데이로 대표되는 혁명 정신과 함께, 유럽 통합의 가치를 반영한 현대적 기념일들이 조화를 이루며, 세속주의 원칙 하에서도 종교적 전통을 존중하는 균형 잡힌 접근을 보여줍니다.",
      
      CA: "캐나다의 공휴일은 영국과 프랑스의 문화적 영향을 받으면서도, 다문화주의와 평화적 독립의 가치를 반영한 독특한 특성을 보입니다. 지역별 다양성을 인정하면서도 국가적 통합을 추구하는 캐나다의 정체성이 잘 드러나며, 원주민 문화와 이민자 문화를 포용하는 포괄적 접근을 취하고 있습니다."
    },
    
    en: {
      US: "American holidays are divided into federal holidays and state-specific holidays, with immigrant traditions from diverse cultural backgrounds blending to form a unique festival culture. Holidays reflecting America's unique history and values, such as Independence Day and Thanksgiving, are characteristic, with each state also operating its own commemorative days, showcasing the diversity of this federal nation.",
      
      KR: "Korean holidays are harmoniously composed of traditional festivals and modern commemorative days. Lunar calendar-based traditional holidays like Lunar New Year and Chuseok demonstrate ancestor worship and family-centered culture, while Children's Day and Hangeul Day reflect modern Korean values. The substitute holiday system particularly guarantees citizens' right to rest, maintaining a unique holiday system that balances tradition and modernity.",
      
      JP: "Japanese holidays maintain a balance between traditional seasonal observances and modern values, with particularly developed holiday cultures like Golden Week. Along with holidays related to the imperial system, the sentiment of Japanese people who value culture and nature is well reflected, and the Happy Monday system creates three-day weekends to enhance citizens' leisure life.",
      
      GB: "British holidays show a distinctive composition commemorating Christian traditions, royal culture, and unique historical events. Distinctive traditions like the Bank Holiday system and Guy Fawkes Night demonstrate Britain's unique cultural identity, reflecting the diversity of the United Kingdom through different holiday systems by region.",
      
      FR: "French holidays have the unique characteristic of Catholic traditions and republican spirit coexisting. Along with the revolutionary spirit represented by Bastille Day, modern commemorative days reflecting European integration values harmonize, showing a balanced approach that respects religious traditions even under secular principles.",
      
      CA: "Canadian holidays show unique characteristics reflecting multiculturalism and peaceful independence values while being influenced by British and French cultures. Canada's identity, which pursues national integration while recognizing regional diversity, is well reflected, taking an inclusive approach that embraces Indigenous and immigrant cultures."
    }
  };
  
  const localeOverviews = overviews[locale] || overviews.ko;
  const overview = localeOverviews[countryCode];
  
  if (overview) {
    return overview;
  }
  
  // 기본 폴백 메시지 (다국어)
  if (locale === 'en') {
    return `${countryName}'s holidays reflect the country's unique history and cultural traditions, playing an important role in forming national identity and social cohesion. They consist of meaningful commemorative days where religious traditions and modern values harmoniously blend together.`;
  } else {
    return `${countryName}의 공휴일은 해당 국가의 독특한 역사와 문화적 전통을 반영하며, 국민들의 정체성 형성과 사회적 결속에 중요한 역할을 하고 있습니다. 종교적 전통과 현대적 가치가 조화롭게 어우러진 의미 있는 기념일들로 구성되어 있습니다.`;
  }
}

/**
 * 여러 공휴일에 대한 설명을 일괄 생성합니다
 */
export async function generateBulkDescriptions(holidays: Holiday[]): Promise<AIContentResponse[]> {
  const results: AIContentResponse[] = [];
  
  for (const holiday of holidays) {
    const request: AIContentRequest = {
      holidayId: holiday.id,
      holidayName: holiday.name,
      countryName: holiday.country,
      date: holiday.date,
      existingDescription: holiday.description
    };
    
    const response = await generateHolidayDescription(request);
    results.push(response);
    
    // API 호출 제한을 피하기 위한 간단한 지연 (실제로는 정적 데이터이므로 불필요)
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return results;
}

/**
 * 콘텐츠 품질을 검증합니다
 */
export function validateContent(description: string): boolean {
  // 최소 길이 체크
  if (description.length < 30) return false;
  
  // 최대 길이 체크 (너무 길면 안됨)
  if (description.length > 1000) return false;
  
  // 기본적인 문장 구조 체크
  const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length < 1 || sentences.length > 10) return false;
  
  // 부적절한 내용 체크 (간단한 필터링)
  const inappropriateWords = ['욕설', '비방', '혐오'];
  const hasInappropriate = inappropriateWords.some(word => 
    description.toLowerCase().includes(word)
  );
  
  return !hasInappropriate;
}

/**
 * 설명 데이터베이스에 새로운 공휴일 설명을 추가합니다
 */
export function addHolidayDescription(
  countryCode: string, 
  holidayDescription: HolidayDescription
): void {
  if (!HOLIDAY_DESCRIPTIONS[countryCode]) {
    HOLIDAY_DESCRIPTIONS[countryCode] = [];
  }
  
  HOLIDAY_DESCRIPTIONS[countryCode].push(holidayDescription);
}

/**
 * 지원되는 국가 목록을 반환합니다
 */
export function getSupportedCountries(): string[] {
  return Object.keys(HOLIDAY_DESCRIPTIONS);
}

/**
 * 특정 국가의 설명 데이터베이스 통계를 반환합니다
 */
export function getCountryStats(countryCode: string): {
  totalDescriptions: number;
  averageLength: number;
  coverage: number;
} {
  const descriptions = HOLIDAY_DESCRIPTIONS[countryCode] || [];
  
  if (descriptions.length === 0) {
    return { totalDescriptions: 0, averageLength: 0, coverage: 0 };
  }
  
  const totalLength = descriptions.reduce((sum, desc) => sum + desc.description.length, 0);
  const averageLength = Math.round(totalLength / descriptions.length);
  
  return {
    totalDescriptions: descriptions.length,
    averageLength,
    coverage: descriptions.length // 실제로는 전체 공휴일 수 대비 비율로 계산해야 함
  };
}