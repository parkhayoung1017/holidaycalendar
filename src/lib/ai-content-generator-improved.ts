import { Holiday, AIContentRequest, AIContentResponse } from '@/types';
import { logApiError, logWarning, logInfo } from './error-logger';
import { getCachedDescription, setCachedDescription } from './ai-content-cache';

// 개선된 공휴일 설명 매칭 시스템
interface HolidayDescription {
  name: string;
  keywords: string[];
  description: string;
  culturalContext?: string;
  historicalBackground?: string;
  modernCelebration?: string;
  economicImpact?: string;
}

// 한국 공휴일 설명 데이터베이스 (다국어 지원)
interface LocalizedHolidayDescription extends HolidayDescription {
  descriptions: {
    ko: string;
    en: string;
  };
}

const KOREAN_HOLIDAYS: LocalizedHolidayDescription[] = [
  {
    name: "New Year's Day",
    keywords: ["new year", "신정", "새해", "1월 1일"],
    description: "", // 기본값, descriptions 사용
    descriptions: {
      ko: "신정(新正)은 양력 1월 1일을 기념하는 새해 첫날입니다. 한국에서는 전통적으로 음력 설날을 더 중요하게 여겨왔지만, 현대 사회에서는 신정도 공휴일로 지정되어 새로운 한 해의 시작을 축하합니다.\n\n이날에는 가족과 친구들이 모여 새해 인사를 나누고, 새해 계획과 목표를 세우는 시간을 갖습니다. 많은 사람들이 해돋이를 보러 가거나, 새해 첫날 특별한 의미를 담은 활동을 하며 한 해를 시작합니다.\n\n서구 문화의 영향으로 새해 파티나 카운트다운 행사도 인기를 끌고 있으며, 특히 젊은 세대들 사이에서는 새해 결심을 세우고 SNS를 통해 새해 인사를 나누는 문화가 자리잡았습니다.",
      en: "New Year's Day (Sinjeong) is the first day of the Gregorian calendar year, celebrated on January 1st. While Korea traditionally places more importance on the Lunar New Year, modern Korean society has designated New Year's Day as a public holiday to celebrate the beginning of a new year.\n\nOn this day, families and friends gather to exchange New Year greetings and set goals and plans for the new year. Many people go to watch the sunrise or engage in special activities that hold meaning for the first day of the year.\n\nDue to Western cultural influence, New Year parties and countdown events have also become popular, especially among younger generations who make New Year's resolutions and share greetings through social media."
    },
    culturalContext: "전통적인 음력 설날과 구별되는 양력 기준 새해로, 현대 한국 사회의 국제화를 반영하는 문화적 변화"
  },
  {
    name: "Lunar New Year",
    keywords: ["lunar new year", "설날", "음력 새해", "seollal"],
    description: "", // 기본값, descriptions 사용
    descriptions: {
      ko: "설날은 음력 1월 1일로, 한국인들이 가장 중요하게 여기는 전통 명절입니다. 조상에게 차례를 지내고, 어른들께 세배를 드리며, 떡국을 먹어 한 살 더 먹는다는 의미를 담고 있습니다.\n\n온 가족이 모여 윷놀이, 연날리기 등 전통 놀이를 즐기며, 한복을 입고 조상의 지혜를 기리는 소중한 시간입니다. 새해를 맞아 덕담을 나누고 세뱃돈을 주고받는 따뜻한 정이 넘치는 명절이기도 합니다.\n\n현대에는 3일간의 연휴로 지정되어 전국적인 민족 대이동이 일어나며, 전통과 현대가 조화된 새로운 형태의 설날 문화가 만들어지고 있습니다.",
      en: "Lunar New Year (Seollal) is celebrated on the first day of the lunar calendar and is the most important traditional holiday for Koreans. Families perform ancestral rites (charye), give New Year greetings to elders through sebae, and eat tteokguk (rice cake soup) symbolizing growing a year older.\n\nThe whole family gathers to enjoy traditional games like yutnori and kite flying, wearing hanbok and honoring ancestral wisdom in precious moments together. It's a warm holiday filled with affection where people exchange New Year greetings and give and receive New Year's money.\n\nIn modern times, it's designated as a three-day holiday period that causes nationwide mass migration, creating new forms of Seollal culture that harmoniously blend tradition and modernity."
    },
    culturalContext: "농경사회의 계절 순환과 조상 숭배 사상이 결합된 한국의 대표적 전통 명절"
  },
  {
    name: "Independence Movement Day",
    keywords: ["independence movement", "3.1절", "삼일절", "독립운동일"],
    description: "", // 기본값, descriptions 사용
    descriptions: {
      ko: "3.1절은 1919년 3월 1일 일제강점기에 일어난 3.1 독립운동을 기념하는 국경일입니다. 이날 전국에서 '대한독립만세'를 외치며 평화적 독립운동이 전개되었으며, 이는 우리 민족의 자주독립 의지를 전 세계에 알린 역사적 사건입니다.\n\n민족대표 33인이 태화관에서 독립선언서를 낭독한 것을 시작으로, 전국 각지에서 200만 명이 넘는 사람들이 만세운동에 참여했습니다. 비폭력 저항정신으로 진행된 이 운동은 세계 평화운동사에도 큰 영향을 미쳤습니다.\n\n현재는 매년 3월 1일 전국에서 기념식이 열리며, 독립정신을 되새기고 평화와 자유의 소중함을 다시 한번 생각해보는 의미 있는 날로 기념되고 있습니다.",
      en: "Independence Movement Day commemorates the March 1st Independence Movement of 1919 during Japanese colonial rule. On this day, peaceful independence demonstrations spread nationwide with people shouting 'Long live Korean independence,' making it a historic event that announced our nation's will for independence to the world.\n\nStarting with 33 national representatives reading the Declaration of Independence at Taehwagwan, over 2 million people across the country participated in the independence movement. This movement, conducted with a spirit of non-violent resistance, had a significant impact on the world's peace movement history.\n\nCurrently, commemorative ceremonies are held nationwide every March 1st, serving as a meaningful day to reflect on the spirit of independence and reconsider the preciousness of peace and freedom."
    },
    culturalContext: "일제강점기 극복 의지와 평화적 저항정신을 상징하는 한국 근현대사의 중요한 전환점"
  },
  {
    name: "Children's Day",
    keywords: ["children's day", "어린이날", "5월 5일"],
    description: "", // 기본값, descriptions 사용
    descriptions: {
      ko: "어린이날은 매년 5월 5일에 기념하는 공휴일로, 어린이들의 인격을 존중하고 행복을 도모하기 위해 제정된 특별한 날입니다. 1923년 방정환 선생을 중심으로 한 어린이 운동가들이 처음 제정했으며, 세계에서 가장 오래된 어린이 기념일 중 하나입니다.\n\n이날이 되면 전국의 가정에서는 부모들이 자녀들에게 선물을 주거나 놀이공원, 동물원 등으로 나들이를 가는 것이 일반적입니다. 각종 문화시설에서는 어린이를 위한 특별 프로그램을 운영하며, 어린이들의 꿈과 희망을 응원하는 사회 분위기가 조성됩니다.\n\n현대 사회에서는 단순한 축제를 넘어 어린이 인권과 복지, 교육 환경 개선에 대해 다시 한번 생각해보는 계기가 되고 있으며, 저출산 시대를 맞아 그 의미가 더욱 중요해지고 있습니다.",
      en: "Children's Day is a public holiday celebrated every May 5th, established as a special day to respect children's dignity and promote their happiness. First established in 1923 by children's rights activists led by Bang Jeong-hwan, it is one of the world's oldest children's commemoration days.\n\nOn this day, it's common for parents across the country to give gifts to their children or take them on outings to amusement parks, zoos, and other attractions. Various cultural facilities operate special programs for children, creating a social atmosphere that supports children's dreams and hopes.\n\nIn modern society, it has become an opportunity to reconsider children's rights, welfare, and educational environment improvements beyond just a simple festival, and its significance has become even more important in the era of low birth rates."
    },
    culturalContext: "근대 아동 인권 의식과 교육 개혁 정신의 산물로, 방정환의 어린이 사랑 정신을 계승하는 문화적 유산"
  },
  {
    name: "Buddha's Birthday",
    keywords: ["buddha", "부처님 오신 날", "석가탄신일", "연등회"],
    description: "", // 기본값, descriptions 사용
    descriptions: {
      ko: "부처님 오신 날은 석가모니 부처님의 탄생을 기념하는 불교 최대의 명절로, 음력 4월 8일에 기념됩니다. 전국의 사찰에서는 화려한 연등이 밝혀지고, 신도들은 부처님의 자비와 지혜를 기리며 마음의 평안을 구합니다.\n\n특히 서울 조계사에서 시작되어 청계천을 따라 이어지는 연등축제는 봄밤을 수놓는 장관을 연출하며, 불교 신도뿐만 아니라 일반 시민들에게도 큰 볼거리가 되고 있습니다. 각 사찰에서는 관불의식, 법요식 등 다양한 불교 의례가 거행됩니다.\n\n2020년 유네스코 인류무형문화유산으로 등재된 연등회는 한국 불교문화의 아름다움을 세계에 알리는 대표적인 문화행사로 자리잡았으며, 전통과 현대가 조화롭게 어우러진 모습을 보여줍니다.",
      en: "Buddha's Birthday commemorates the birth of Gautama Buddha and is the most important Buddhist holiday, celebrated on the 8th day of the 4th lunar month. Temples across the country light colorful lanterns, and believers honor Buddha's compassion and wisdom while seeking peace of mind.\n\nParticularly, the Lotus Lantern Festival that starts from Jogyesa Temple in Seoul and continues along Cheonggyecheon creates a spectacular sight decorating spring nights, becoming a major attraction not only for Buddhists but also for ordinary citizens. Various Buddhist ceremonies such as bathing the Buddha statue and dharma services are held at temples.\n\nThe Lotus Lantern Festival, registered as a UNESCO Intangible Cultural Heritage in 2020, has established itself as a representative cultural event that introduces the beauty of Korean Buddhist culture to the world, showing a harmonious blend of tradition and modernity."
    },
    culturalContext: "한국 불교 문화의 정수를 보여주는 대표적 종교 축제로, 1,500년 이상 이어져 온 깊은 역사적 전통"
  },
  {
    name: "Memorial Day",
    keywords: ["memorial day", "현충일", "6월 6일", "추모"],
    description: "현충일은 매년 6월 6일에 국가와 민족을 위해 희생하신 순국선열과 호국영령들의 숭고한 정신을 기리는 국경일입니다. 1956년에 제정된 이후, 나라를 위해 목숨을 바친 분들을 추모하고 그들의 애국정신을 되새기는 중요한 날로 자리잡았습니다.\n\n매년 이날 오전 10시에는 전국적으로 1분간 추모 사이렌이 울리며, 국민들은 묵념으로 호국영령들의 넋을 기립니다. 대통령을 비롯한 정부 요인들은 국립현충원에서 추념식을 거행하며, 전국 각지의 현충원과 충혼탑에서도 추모행사가 열립니다.\n\n이 날은 단순한 추모를 넘어 평화의 소중함과 국가 안보의 중요성을 되새기는 교육적 의미도 지니고 있으며, 자유민주주의의 가치와 조국 수호 정신을 다시 한번 확인하는 뜻깊은 시간입니다.",
    culturalContext: "분단국가 한국의 특수한 역사적 상황을 반영한 국가적 추모 의례로, 호국보훈 정신의 상징"
  },
  {
    name: "Liberation Day",
    keywords: ["liberation day", "광복절", "8월 15일", "해방"],
    description: "광복절은 1945년 8월 15일 우리나라가 일제강점기로부터 해방된 것을 기념하는 국경일입니다. 35년간의 일본 제국주의 통치가 끝나고 한반도가 자주독립국가로 돌아온 역사적인 날로, 1949년에 공식 국경일로 지정되었습니다.\n\n광복(光復)이라는 말은 '빛을 되찾는다'는 뜻으로, 나라의 주권을 되찾았다는 의미를 담고 있습니다. 이날에는 전국 곳곳에서 다양한 기념행사가 열리며, 많은 시민들이 태극기를 게양하고 독립기념관 등 관련 시설을 방문합니다.\n\n현대 한국 사회에서 광복절은 단순한 해방 기념일을 넘어 민족의 자긍심과 미래 통일에 대한 희망을 되새기는 날로 자리 잡았으며, 특히 젊은 세대들에게는 평화와 인권의 소중함을 일깨우는 교육의 기회로 활용되고 있습니다.",
    culturalContext: "일제강점기 극복과 민족 자주성 회복을 상징하는 국가적 자긍심의 원천"
  },
  {
    name: "National Foundation Day",
    keywords: ["foundation day", "개천절", "10월 3일", "단군"],
    description: "개천절은 단군왕검이 고조선을 건국한 것을 기념하는 국경일로, 매년 10월 3일에 기념됩니다. '하늘이 열린 날'이라는 뜻의 개천절은 우리 민족의 시조인 단군과 고조선 건국의 역사적 의미를 되새기는 날입니다.\n\n단군신화에 따르면, 하늘의 신 환웅이 인간 세상에 내려와 곰을 인간으로 변하게 한 웅녀와 혼인하여 단군왕검을 낳았고, 단군은 기원전 2333년에 고조선을 건국했다고 전해집니다. 이는 우리 민족의 천손사상과 홍익인간 이념을 반영한 것입니다.\n\n현대에는 전국 각지에서 다양한 기념행사가 열리며, 강화도 마니산 참성단에서는 전통적인 제천의식이 거행됩니다. 우리 민족의 유구한 역사와 문화적 정체성을 확인하고, 민족의 단결과 자긍심을 고취하는 중요한 계기가 되고 있습니다.",
    culturalContext: "한민족의 건국 신화와 역사적 정체성을 기리는 민족적 자긍심의 상징"
  },
  {
    name: "Chuseok",
    keywords: ["chuseok", "추석", "한가위", "중추절"],
    description: "추석은 음력 8월 15일에 맞이하는 한국의 대표적인 명절로, '한가위' 또는 '중추절'이라고도 불립니다. 풍성한 수확에 감사하는 의미를 담은 이 명절은 농경 사회였던 고대 한국에서 한 해의 수확을 감사하고 조상에게 제사를 지내는 중요한 의례였습니다.\n\n현대의 추석에는 성묘와 차례를 지내는 것이 가장 중요한 행사입니다. 가족들이 모여 조상의 묘소를 찾아 벌초를 하고, 차례를 지내며 조상을 기립니다. 송편 만들기는 추석의 대표적인 세시 풍속으로, 가족들이 함께 모여 찹쌀가루로 반달 모양의 떡을 빚습니다.\n\n추석 연휴 기간 동안 한국의 도로에서는 극심한 정체를 보이는 '민족 대이동' 현상이 일어나며, 이는 세계적으로도 유례없는 대규모 이동으로 꼽힙니다. '한국의 추수감사절'이라 불리며, 풍요로운 가을의 정취와 함께 가족 간의 사랑을 확인하는 뜻깊은 날입니다.",
    culturalContext: "농업 중심 사회의 수확 축제와 조상 공경 문화의 융합으로, 한국인의 공동체 의식을 보여주는 대표적 명절"
  },
  {
    name: "Hangeul Day",
    keywords: ["hangeul day", "한글날", "10월 9일", "세종대왕"],
    description: "한글날은 세종대왕이 훈민정음(한글)을 창제하여 반포한 것을 기념하는 국경일로, 매년 10월 9일에 기념됩니다. 1446년 훈민정음 해례본이 간행된 날을 기념하여 제정된 이 날은 한글의 우수성과 세종대왕의 애민정신을 기리는 뜻깊은 날입니다.\n\n한글의 창제는 당시 문자 생활에서 소외된 백성들을 위한 획기적인 사건이었습니다. 한자만을 사용하던 시대에 누구나 쉽게 배우고 사용할 수 있는 문자를 만든 것은 세계 문자 역사상 매우 특별한 사례로 평가받고 있습니다.\n\n현대 사회에서 한글날은 단순히 문자 창제를 기념하는 날을 넘어, 한국의 문화적 자부심을 확인하는 날로 자리 잡았습니다. UNESCO 세계기록유산으로 등재된 훈민정음의 과학성과 체계성은 국제적으로도 인정받고 있으며, K-pop 등 한류 문화의 확산과 함께 한글에 대한 세계적 관심도 높아지고 있습니다.",
    culturalContext: "한민족의 문자 문화와 언어적 정체성을 기리는 세계 유일의 문자 기념일"
  },
  {
    name: "Christmas Day",
    keywords: ["christmas", "크리스마스", "12월 25일", "성탄절"],
    description: "크리스마스는 예수 그리스도의 탄생을 기념하는 기독교의 중요한 축일로, 한국에서는 1945년 이후 공휴일로 지정되어 매년 12월 25일에 기념하고 있습니다. 한국에서 크리스마스는 종교적 의미를 넘어 대중적인 문화 행사로 자리잡았습니다.\n\n한국의 크리스마스 풍경은 독특한 특징을 보입니다. 교회에서는 예배와 함께 성탄 축하 행사가 열리며, 거리는 크리스마스 트리와 화려한 조명으로 장식됩니다. 특히 젊은 세대들에게는 연인들의 데이트 문화와 결합되어 로맨틱한 기념일로 인식되며, 가족들과 함께 보내는 따뜻한 시간으로도 여겨집니다.\n\n서구의 산타클로스 문화도 한국적으로 재해석되어 정착했으며, 특히 케이크를 나누어 먹는 문화는 한국의 크리스마스를 대표하는 독특한 전통이 되었습니다. 최근에는 다양한 문화적 배경을 가진 사람들이 함께 즐기는 포용적인 축제로 발전하고 있습니다.",
    culturalContext: "기독교 전통이 한국적 정서와 결합되어 독특하게 발전한 문화적 축제"
  }
];

// 미국 공휴일 설명 데이터베이스
const US_HOLIDAYS: HolidayDescription[] = [
  {
    name: "New Year's Day",
    keywords: ["new year", "새해", "january 1"],
    description: "새해 첫날(New Year's Day)은 미국을 비롯한 전 세계에서 가장 보편적으로 기념되는 공휴일입니다. 그레고리력을 기준으로 1월 1일을 새해의 시작으로 삼는 것은 로마 시대부터 이어져 온 전통으로, 율리우스 카이사르가 기원전 46년에 공식적으로 채택했습니다.\n\n미국인들은 전통적으로 12월 31일 자정을 기다리며 새해맞이 파티를 즐깁니다. 특히 뉴욕 타임스스퀘어의 볼 드롭(Ball Drop) 행사는 전 세계적으로 유명한 새해 축하 이벤트가 되었습니다. 이 전통은 1907년부터 시작되어, 매년 수백만 명의 사람들이 현장에서 또는 TV를 통해 지켜보고 있습니다.\n\n현대 사회에서 새해 첫날은 자기성찰과 새로운 시작의 기회로 여겨집니다. 많은 사람들이 이 시기에 새해 결심을 하고, 개인적 목표를 설정하는 것이 일반적입니다.",
    culturalContext: "서구 문화권에서 그레고리력 기준 새해를 기념하는 전통으로, 새로운 시작과 희망의 상징"
  },
  {
    name: "Independence Day",
    keywords: ["independence", "4th july", "독립기념일", "july 4"],
    description: "독립기념일(Independence Day)은 1776년 7월 4일 독립선언서 채택을 기념하는 미국 최대의 국경일입니다. 이날 대륙회의는 토머스 제퍼슨이 주도하여 작성한 독립선언문을 채택했으며, 이는 미국이 독립 국가로서의 첫 걸음을 내딘 역사적인 순간이었습니다.\n\n독립기념일은 미국에서 가장 성대하게 축하되는 공휴일 중 하나입니다. 전국 각지에서 대규모 불꽃놀이가 펼쳐지며, 빨강, 하양, 파랑 색상의 애국적 장식으로 거리가 꾸며집니다. 가족과 친구들이 모여 바비큐 파티를 즐기고, 퍼레이드와 야외 콘서트가 열립니다.\n\n현대 미국 사회에서 독립기념일은 단순한 역사적 기념일을 넘어 미국의 정체성과 가치관을 재확인하는 날로 자리 잡았습니다. 자유, 민주주의, 평등이라는 건국 이념을 되새기며, 다양한 배경을 가진 시민들이 하나의 국가 공동체임을 확인하는 기회가 됩니다.",
    culturalContext: "미국 건국의 역사적 순간을 기념하는 국가적 자긍심의 상징"
  },
  {
    name: "Thanksgiving",
    keywords: ["thanksgiving", "추수감사절", "turkey day"],
    description: "추수감사절(Thanksgiving Day)은 1621년 플리머스 정착지에서 청교도 정착민들(필그림)이 원주민들의 도움으로 첫 수확을 거둔 후 감사의 의미로 함께 축제를 연 것에서 시작되었습니다. 당시 정착민들은 새로운 땅에서의 첫 겨울을 힘겹게 보낸 후, 와파노아그 부족의 도움으로 농사법을 배워 풍성한 수확을 거둘 수 있었습니다.\n\n전통적인 추수감사절 식사에는 칠면조 구이가 중심이 되며, 크랜베리 소스, 호박파이, 감자요리 등이 곁들여집니다. 많은 가정에서는 식사 전에 모두가 돌아가며 한 해 동안 감사했던 일들을 이야기하는 전통을 가지고 있습니다.\n\n현대 미국 사회에서 추수감사절은 단순한 수확 감사제를 넘어 가족의 화합과 감사의 가치를 되새기는 날로 의미가 확장되었습니다. 또한 이 날을 전후로 시작되는 '블랙 프라이데이' 세일은 연말 쇼핑 시즌의 시작을 알리는 중요한 상업적 이벤트가 되었습니다.",
    culturalContext: "청교도 정착민과 원주민의 화합에서 시작된 감사의 전통"
  },
  {
    name: "Christmas",
    keywords: ["christmas", "크리스마스", "december 25"],
    description: "크리스마스(Christmas Day)는 예수 그리스도의 탄생을 기념하는 기독교 최대 명절로, 미국에서는 종교를 넘어 문화적 축제로 자리잡았습니다. 크리스마스 트리 장식, 선물 교환, 캐럴 부르기 등의 전통이 있으며, 가족과의 따뜻한 시간을 보내는 것이 가장 중요한 의미입니다.\n\n미국의 크리스마스 문화는 다양한 이민자들의 전통이 융합되어 독특하게 발전했습니다. 독일의 크리스마스 트리, 네덜란드의 산타클로스, 영국의 크리스마스 카드 등이 결합되어 현재의 미국식 크리스마스가 만들어졌습니다.\n\n산타클로스 전설과 함께 어린이들에게는 마법 같은 하루이기도 하며, 전국의 쇼핑몰과 거리는 화려한 장식으로 꾸며집니다. 록펠러 센터의 크리스마스 트리 점등식과 각종 크리스마스 마켓이 대표적인 행사로, 미국 소매업계 연간 매출의 20% 이상을 차지하는 최대 쇼핑 시즌이기도 합니다.",
    culturalContext: "기독교 전통이 세속적 축제 문화와 결합된 대표적 사례"
  }
];

/**
 * 개선된 공휴일 매칭 함수 (다국어 지원)
 */
function findBestHolidayMatch(holidayName: string, countryName: string, locale: string = 'ko'): HolidayDescription | null {
  const normalizedName = holidayName.toLowerCase().trim();
  
  // 국가별 데이터베이스 선택
  let holidayDatabase: (HolidayDescription | LocalizedHolidayDescription)[] = [];
  
  if (countryName.includes('Korea') || countryName === 'KR') {
    holidayDatabase = KOREAN_HOLIDAYS;
  } else if (countryName.includes('United States') || countryName === 'US') {
    holidayDatabase = US_HOLIDAYS;
  }
  
  if (holidayDatabase.length === 0) {
    return null;
  }
  
  // 1. 정확한 이름 매칭
  let bestMatch = holidayDatabase.find(holiday => 
    holiday.name.toLowerCase() === normalizedName
  );
  
  if (bestMatch) {
    logInfo(`정확한 이름 매칭 성공: ${holidayName}`);
    // 다국어 지원 처리
    return processLocalizedDescription(bestMatch, locale);
  }
  
  // 2. 키워드 매칭 (부분 일치)
  bestMatch = holidayDatabase.find(holiday =>
    holiday.keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      return normalizedName.includes(normalizedKeyword) || 
             normalizedKeyword.includes(normalizedName);
    })
  );
  
  if (bestMatch) {
    logInfo(`키워드 매칭 성공: ${holidayName}`);
    // 다국어 지원 처리
    return processLocalizedDescription(bestMatch, locale);
  }
  
  // 3. 유사도 기반 매칭 (간단한 문자열 유사도)
  let maxSimilarity = 0;
  let similarMatch: (HolidayDescription | LocalizedHolidayDescription) | null = null;
  
  holidayDatabase.forEach(holiday => {
    // 이름과의 유사도 계산
    const nameSimilarity = calculateSimilarity(normalizedName, holiday.name.toLowerCase());
    
    // 키워드와의 유사도 계산
    const keywordSimilarity = Math.max(...holiday.keywords.map(keyword => 
      calculateSimilarity(normalizedName, keyword.toLowerCase())
    ));
    
    const maxHolidaySimilarity = Math.max(nameSimilarity, keywordSimilarity);
    
    if (maxHolidaySimilarity > maxSimilarity && maxHolidaySimilarity > 0.6) {
      maxSimilarity = maxHolidaySimilarity;
      similarMatch = holiday;
    }
  });
  
  if (similarMatch) {
    logInfo(`유사도 매칭 성공: ${holidayName} (유사도: ${maxSimilarity.toFixed(2)})`);
    // 다국어 지원 처리
    return processLocalizedDescription(similarMatch, locale);
  }
  
  logWarning(`매칭 실패: ${holidayName}`);
  return null;
}

/**
 * 다국어 설명 처리 함수
 */
function processLocalizedDescription(
  holiday: HolidayDescription | LocalizedHolidayDescription, 
  locale: string
): HolidayDescription {
  // LocalizedHolidayDescription인지 확인
  if ('descriptions' in holiday && holiday.descriptions) {
    const localizedDescription = holiday.descriptions[locale as 'ko' | 'en'] || holiday.descriptions.ko;
    return {
      ...holiday,
      description: localizedDescription
    };
  }
  
  // 일반 HolidayDescription인 경우 그대로 반환
  return holiday;
}

/**
 * 간단한 문자열 유사도 계산 (Jaccard 유사도)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 템플릿 기반 폴백 설명 생성
 */
function generateFallbackDescription(request: AIContentRequest, locale: string = 'ko'): AIContentResponse {
  const { holidayId, holidayName, countryName } = request;
  
  const fallbackDescription = locale === 'ko' 
    ? `${holidayName}은(는) ${countryName}에서 기념하는 특별한 날입니다. 이 날에는 전통적인 의식과 함께 가족들이 모여 의미 있는 시간을 보내며, 문화적 가치를 이어가는 소중한 기회가 됩니다. 각 지역의 고유한 관습과 전통을 통해 공동체의 결속을 다지고, 세대 간 문화 전승의 역할을 하는 중요한 날입니다.`
    : `${holidayName} is a special day celebrated in ${countryName}. On this day, families gather for traditional ceremonies and meaningful time together, serving as a precious opportunity to continue cultural values. It plays an important role in strengthening community bonds through unique local customs and traditions, and in cultural transmission between generations.`;
  
  logWarning(`폴백 설명 사용: ${holidayName}`);
  
  return {
    holidayId,
    description: fallbackDescription,
    confidence: 0.3,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 개선된 공휴일 설명 생성 함수
 */
export async function generateImprovedHolidayDescription(
  request: AIContentRequest, 
  locale: string = 'ko'
): Promise<AIContentResponse> {
  try {
    logInfo(`개선된 공휴일 설명 생성 시작: ${request.holidayName} (${request.countryName})`);
    
    const { holidayId, holidayName, countryName, existingDescription } = request;
    
    // 1. 기존 설명이 충분히 상세하면 그대로 사용
    if (existingDescription && existingDescription.trim().length > 100) {
      logInfo(`기존 설명 사용: ${holidayName}`);
      return {
        holidayId,
        description: existingDescription.trim(),
        confidence: 1.0,
        generatedAt: new Date().toISOString()
      };
    }
    
    // 2. 캐시에서 확인
    const cached = await getCachedDescription(holidayName, countryName, locale);
    if (cached && cached.description.length > 100) {
      logInfo(`캐시에서 설명 조회 성공: ${holidayName}`);
      return {
        holidayId,
        description: cached.description,
        confidence: cached.confidence,
        generatedAt: cached.generatedAt
      };
    }
    
    // 3. 개선된 매칭 시스템으로 설명 찾기
    const bestMatch = findBestHolidayMatch(holidayName, countryName, locale);
    
    if (bestMatch) {
      // 캐시에 저장
      await setCachedDescription(
        holidayId,
        holidayName,
        countryName,
        locale,
        bestMatch.description,
        0.9
      );
      
      logInfo(`개선된 매칭 성공: ${holidayName}`);
      return {
        holidayId,
        description: bestMatch.description,
        confidence: 0.9,
        generatedAt: new Date().toISOString()
      };
    }
    
    // 4. 매칭 실패 시 폴백 설명 사용
    return generateFallbackDescription(request, locale);
    
  } catch (error) {
    logApiError('generateImprovedHolidayDescription', error as Error, {
      holidayId: request.holidayId,
      holidayName: request.holidayName,
      countryName: request.countryName
    });
    
    return generateFallbackDescription(request, locale);
  }
}

/**
 * 공휴일 설명 품질 검증
 */
export function validateHolidayDescription(description: string): boolean {
  if (!description || description.trim().length < 50) {
    return false;
  }
  
  // 기본적인 품질 검증
  const hasMultipleSentences = description.split('.').length > 2;
  const hasReasonableLength = description.length >= 100 && description.length <= 5000;
  const hasNoPlaceholders = !description.includes('[') && !description.includes('{');
  
  return hasMultipleSentences && hasReasonableLength && hasNoPlaceholders;
}