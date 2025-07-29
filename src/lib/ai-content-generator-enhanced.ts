import { Holiday, AIContentRequest, AIContentResponse } from '@/types';
import { logApiError, logWarning, logInfo } from './error-logger';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { getCachedDescription, setCachedDescription } from './ai-content-cache';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Claude API를 사용하여 실제 AI 기반 공휴일 설명을 생성합니다
 */
export async function generateAIHolidayDescription(
  holidayName: string,
  countryName: string,
  date: string,
  locale: string = 'ko'
): Promise<string> {
  try {
    const isKorean = locale === 'ko';

    const prompt = isKorean ? `
다음 공휴일에 대해 풍부하고 흥미로운 설명을 작성해주세요:

공휴일: ${holidayName}
국가: ${countryName}
날짜: ${date}

다음 항목들을 포함하여 하나의 자연스러운 설명글로 작성해주세요:
1. 어떤 날인지 (기원과 유래)
2. 실제 역사적 맥락
3. 어떻게 기념하는지 (대표적인 행사들)
4. 현대 사회에서 어떤 의미로 받아들여지는지
5. 흥미로운 여담이나 관련 일화
6. 다른 나라와의 비교 (해당되는 경우)

요구사항:
- 리스트 형태가 아닌 자연스럽게 연결된 하나의 글로 작성
- 문단 구분을 위해 적절한 곳에 줄바꿈(\n\n) 사용
- 말투는 정보전달 중심으로 간결하고 명확하게
- 사실에 기반한 정확한 정보만 포함
- 분량은 800-1200자 정도로 충분히 상세하게
- HTML 태그는 사용하지 말고 순수 텍스트로만 작성
` : `
Please write a rich and interesting description of the following holiday:

Holiday: ${holidayName}
Country: ${countryName}
Date: ${date}

Please include the following elements in one natural narrative:
1. What the day is about (origins and background)
2. Actual historical context
3. How it is celebrated (representative events)
4. How it is perceived in modern society
5. Interesting anecdotes or related stories
6. Comparisons with other countries (if applicable)

Requirements:
- Write as one naturally connected narrative, not as a list
- Use appropriate line breaks (\n\n) for paragraph separation
- Keep the tone informative, concise, and clear
- Include only factual and accurate information
- Write in sufficient detail (800-1200 characters)
- Use plain text only, no HTML tags
`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response format from Claude API');

  } catch (error) {
    logApiError('Claude API 호출 실패', error);
    throw error;
  }
}

// 공휴일 설명 데이터베이스
interface HolidayDescription {
  name: string;
  keywords: string[];
  description: string;
  culturalContext?: string;
  historicalBackground?: string;
  modernCelebration?: string;
  economicImpact?: string;
  regionalVariations?: string;
}

// 다국어 공휴일 설명 데이터베이스
const HOLIDAY_DESCRIPTIONS: Record<string, Record<string, HolidayDescription[]>> = {
  ko: {
    US: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해"],
        description: "새로운 한 해의 시작을 축하하는 날로, 전 세계적으로 가장 보편적인 명절 중 하나입니다. 미국에서는 타임스퀘어의 볼 드롭 행사가 상징적이며, 새해 결심을 세우고 가족과 함께 시간을 보내는 전통이 있습니다. 1월 1일 자정에 떨어지는 크리스털 볼을 보며 새해를 맞이하는 순간은 전 세계 수백만 명이 함께 지켜보는 장관을 연출합니다.",
        culturalContext: "서구 문화권에서 그레고리력 기준 새해를 기념하는 전통으로, 희망과 새로운 시작의 상징",
        historicalBackground: "그레고리력 도입 이후 1월 1일이 공식적인 새해 첫날로 정착되었으며, 미국에서는 19세기부터 본격적인 축제 문화가 발달했습니다. 타임스퀘어의 볼 드롭 전통은 1907년부터 시작되어 100년 넘게 이어져 오고 있으며, 제2차 세계대전 중에도 중단되지 않았습니다.",
        modernCelebration: "현대 미국에서는 타임스퀘어 볼 드롭, 로즈 퍼레이드, 가족 모임 등이 대표적인 기념 방식이며, 새해 결심 문화가 특히 발달했습니다. 캘리포니아 패서디나의 로즈 퍼레이드는 1890년부터 시작되어 꽃으로 장식된 화려한 수레들이 행진하는 전통을 자랑합니다.",
        economicImpact: "새해 연휴는 미국 소매업계에 중요한 시기로, 파티 용품, 샴페인, 선물 등의 매출이 크게 증가하며 관광업계에도 상당한 경제적 효과를 가져다줍니다. 특히 뉴욕시는 새해 전야 행사로만 연간 수억 달러의 관광 수입을 올리고 있습니다."
      },
      {
        name: "Martin Luther King, Jr. Day",
        keywords: ["martin luther king", "mlk", "civil rights", "인권"],
        description: "미국의 위대한 인권 운동가 마틴 루터 킹 주니어를 기념하는 연방 공휴일로, 매년 1월 셋째 주 월요일에 기념됩니다. 1963년 워싱턴 대행진에서 '나에게는 꿈이 있습니다(I Have a Dream)' 연설로 유명한 킹 목사의 비폭력 저항 정신과 인종 평등을 위한 투쟁을 기리는 날입니다. 이 날은 단순한 기념일을 넘어 미국 사회의 정의와 평등에 대해 성찰하는 의미 깊은 시간입니다.",
        culturalContext: "미국 민권 운동의 상징이자 비폭력 저항 정신의 구현체로, 인종 화합과 사회 정의를 추구하는 가치관의 상징",
        historicalBackground: "1968년 킹 목사 암살 직후부터 기념일 제정 운동이 시작되었으나, 실제 연방 공휴일로 지정된 것은 1983년 로널드 레이건 대통령 시절입니다. 처음에는 일부 주에서 반대했지만, 2000년에 이르러서야 모든 50개 주에서 공식 공휴일로 인정받았습니다. 스티비 원더의 'Happy Birthday' 노래가 이 기념일 제정 운동에 큰 역할을 했다는 흥미로운 일화도 있습니다.",
        modernCelebration: "현대 미국에서는 이 날을 '봉사의 날(Day of Service)'로 지정하여 지역사회 봉사활동에 참여하는 전통이 있습니다. 전국 각지에서 인권 관련 강연, 평화 행진, 교육 프로그램이 열리며, 특히 학교에서는 킹 목사의 생애와 업적을 배우는 특별 수업을 진행합니다. 아틀란타에 있는 킹 목사 국립 역사 공원에서는 매년 기념 행사가 성대하게 열립니다.",
        economicImpact: "연방 공휴일로 지정되면서 정부 기관과 많은 기업이 휴무하며, 교육 및 문화 관련 산업에 긍정적 영향을 미칩니다. 특히 아틀란타, 워싱턴 D.C., 멤피스 등 킹 목사와 관련된 도시들의 관광업계에 상당한 경제적 효과를 가져다주고 있습니다."
      },
      {
        name: "Independence Day",
        keywords: ["independence", "4th july", "독립기념일"],
        description: "1776년 7월 4일 독립선언서 채택을 기념하는 미국 최대의 국경일입니다. 빨강, 하양, 파랑의 성조기 색깔로 장식하고, 바베큐 파티와 불꽃놀이로 자유와 독립정신을 축하합니다. 전국 곳곳에서 가족 단위의 피크닉과 퍼레이드가 열리며, 미국인들의 애국심이 가장 뜨겁게 표출되는 날입니다.",
        culturalContext: "미국 건국의 역사적 순간을 기념하는 국가적 자긍심의 상징",
        historicalBackground: "1776년 대륙회의에서 독립선언서가 채택된 날로, 영국으로부터의 독립 의지를 천명한 역사적 순간을 기념합니다. 13개 식민지가 하나의 독립국가로 결속하는 과정에서 자유와 민주주의의 가치가 확립되었으며, 이는 전 세계 민주주의 발전에 큰 영향을 미쳤습니다.",
        modernCelebration: "전국 각지에서 퍼레이드, 바베큐 파티, 불꽃놀이가 열리며, 성조기를 게양하고 애국가를 부르는 전통이 있습니다. 특히 워싱턴 D.C.에서 열리는 국가적 기념행사와 뉴욕 자유의 여신상 앞에서의 축제는 전 세계의 주목을 받습니다.",
        economicImpact: "여름 휴가철과 맞물려 관광업, 외식업, 소매업에 큰 경제적 효과를 가져다주며, 불꽃놀이 관련 산업도 크게 활성화됩니다. 특히 바베큐 용품, 맥주, 불꽃놀이 제품의 매출이 급증하며, 연간 수십억 달러의 경제 효과를 창출합니다."
      },
      {
        name: "Thanksgiving",
        keywords: ["thanksgiving", "추수감사절"],
        description: "가족이 모여 한 해의 감사함을 나누는 미국의 대표적인 명절입니다. 칠면조 요리를 중심으로 한 풍성한 식사와 함께, 각자가 감사한 일들을 나누는 전통이 있습니다. 1621년 플리머스 정착민들과 원주민들이 함께 나눈 첫 추수 축제에서 유래되었으며, 현재는 가족 유대감을 강화하는 소중한 시간으로 여겨집니다.",
        culturalContext: "청교도 정착민과 원주민의 화합에서 시작된 감사의 전통",
        historicalBackground: "1621년 매사추세츠 플리머스 식민지에서 청교도들이 첫 수확을 기념하며 원주민들과 함께 3일간 축제를 벌인 것이 기원입니다. 1863년 링컨 대통령이 공식적으로 국가 공휴일로 지정했으며, 이후 미국의 가장 중요한 가족 명절로 자리잡았습니다.",
        modernCelebration: "11월 넷째 주 목요일에 가족들이 모여 칠면조, 크랜베리 소스, 호박파이 등 전통 음식을 나누어 먹습니다. 메이시스 추수감사절 퍼레이드와 NFL 경기 시청도 빼놓을 수 없는 전통이 되었습니다.",
        economicImpact: "미국 최대의 여행 시즌 중 하나로, 항공업계와 교통업계에 막대한 수익을 가져다줍니다. 또한 식료품 매출이 급증하며, 크리스마스 쇼핑 시즌의 시작을 알리는 블랙 프라이데이로 이어져 소매업계에 연간 최대의 매출을 기록하게 합니다."
      },
      {
        name: "Christmas",
        keywords: ["christmas", "크리스마스"],
        description: "예수 그리스도의 탄생을 기념하는 기독교 최대 명절로, 미국에서는 종교를 넘어 문화적 축제로 자리잡았습니다. 크리스마스 트리 장식, 선물 교환, 캐럴 부르기 등의 전통이 있으며, 가족과의 따뜻한 시간을 보내는 것이 가장 중요한 의미입니다. 산타클로스 전설과 함께 어린이들에게는 마법 같은 하루이기도 합니다.",
        culturalContext: "기독교 전통이 세속적 축제 문화와 결합된 대표적 사례",
        historicalBackground: "4세기경 로마 제국에서 예수의 탄생일로 12월 25일이 정해진 이후, 유럽을 거쳐 미국으로 전해졌습니다. 19세기 빅토리아 시대를 거치면서 현재의 크리스마스 전통들이 확립되었으며, 독일의 크리스마스 트리 문화와 네덜란드의 산타클로스 전설이 결합되었습니다.",
        modernCelebration: "12월 25일을 중심으로 한 달 이상 축제 분위기가 이어지며, 집집마다 화려한 장식을 하고 선물을 교환합니다. 록펠러 센터의 크리스마스 트리 점등식과 각종 크리스마스 마켓이 대표적인 행사입니다.",
        economicImpact: "미국 소매업계 연간 매출의 20% 이상을 차지하는 최대 쇼핑 시즌입니다. 선물, 장식품, 음식 등 관련 산업 전반에 걸쳐 수천억 달러의 경제 효과를 창출하며, 임시 고용 창출에도 크게 기여합니다."
      }
    ],
    KR: [
      {
        name: "설날",
        keywords: ["lunar new year", "설날", "korean new year"],
        description: "음력 새해 첫날로, 한국인들이 가장 중요하게 여기는 전통 명절입니다. 조상에게 차례를 지내고, 세배를 통해 어른들께 새해 인사를 드리며, 떡국을 먹어 한 살 더 먹는다는 의미를 담고 있습니다.\n\n온 가족이 모여 윷놀이, 연날리기 등 전통 놀이를 즐기며, 한복을 입고 조상의 지혜를 기리는 소중한 시간입니다. 새해를 맞아 덕담을 나누고 세뱃돈을 주고받는 따뜻한 정이 넘치는 명절이기도 합니다.",
        culturalContext: "농경사회의 계절 순환과 조상 숭배 사상이 결합된 전통으로, 한국인의 정신적 뿌리를 확인하는 가장 중요한 문화적 행사입니다.",
        historicalBackground: "삼국시대부터 이어진 전통으로, 음력을 기준으로 한 농업 사회의 새해 맞이 풍습에서 유래되었습니다. 고구려, 백제, 신라 시대부터 각각 다른 방식으로 새해를 맞이했으나, 통일신라 이후 현재와 유사한 형태로 발전했습니다.\n\n조선시대에는 궁중에서도 성대한 설날 행사를 치렀으며, 민간에서는 마을 공동체 중심의 세시풍속이 자리잡았습니다. 일제강점기와 한국전쟁을 거치면서도 끊이지 않고 전승되어 온 한민족의 대표적인 문화유산입니다.",
        modernCelebration: "현대에는 가족이 모여 전통 음식을 나누고, 윷놀이, 연날리기 등 전통 놀이를 즐기며, 한복을 입고 세배하는 문화가 이어지고 있습니다.\n\n특히 도시 지역에서는 전통과 현대가 조화된 새로운 형태의 설날 문화가 나타나고 있습니다. 아파트 단지에서는 공동으로 떡국 나누기 행사를 하고, 문화센터에서는 전통놀이 체험 프로그램을 운영합니다.\n\n젊은 세대들은 SNS를 통해 설날 인사를 나누고, 전통 한복 대신 개량 한복을 입는 등 시대에 맞는 새로운 설날 문화를 만들어가고 있습니다.",
        economicImpact: "명절 선물, 전통 음식 재료, 교통비 등으로 대규모 경제 활동이 일어나며, 귀성 및 여행 관련 산업에 큰 영향을 미칩니다.\n\n설날 연휴 기간 동안 한국 경제에 미치는 파급효과는 연간 10조원 이상으로 추산됩니다. 백화점과 대형마트의 설날 선물세트 매출이 급증하고, 한복 업계도 연간 매출의 상당 부분을 이 시기에 올립니다.\n\n교통업계에서는 전국적인 민족 대이동으로 인해 KTX, 고속버스, 항공편 예약이 폭증하며, 고속도로 통행료 수입도 크게 늘어납니다. 또한 전통시장에서는 떡국용 떡, 나물, 과일 등의 판매가 급증하여 지역 경제 활성화에도 기여합니다."
      },
      {
        name: "추석",
        keywords: ["chuseok", "추석", "harvest festival"],
        description: "음력 8월 15일로, 한 해 농사의 결실을 조상과 함께 나누는 한국의 대표적인 명절입니다. 송편을 빚어 먹고, 성묘를 통해 조상을 기리며, 보름달 아래에서 강강술래 등 전통 놀이를 즐깁니다.\n\n'한국의 추수감사절'이라 불리며, 풍요로운 가을의 정취와 함께 가족 간의 사랑을 확인하는 뜻깊은 날입니다. 온 가족이 모여 한 해 동안의 수고를 나누고, 조상들의 은혜에 감사하는 마음을 표현합니다.",
        culturalContext: "농업 중심 사회의 수확 축제와 조상 공경 문화의 융합으로, 한국인의 공동체 의식과 가족 중심 가치관을 가장 잘 보여주는 문화적 행사입니다.",
        historicalBackground: "신라시대부터 시작된 가배(嘉俳)라는 추수 축제에서 유래되었으며, 조선시대에 현재의 형태로 정착되었습니다. 삼국사기에 따르면 신라에서는 8월 한 달 동안 가배라는 큰 잔치를 벌였다고 기록되어 있습니다.\n\n고려시대에는 '가위'라고 불렸으며, 조선시대에 들어서면서 유교적 제례 문화와 결합하여 현재의 추석 형태로 발전했습니다. 특히 조선 후기에는 성리학의 영향으로 조상 숭배 의식이 더욱 체계화되었습니다.",
        modernCelebration: "현대에는 3일간의 연휴로 지정되어 가족이 모여 차례를 지내고, 성묘를 하며, 전통 음식을 나누어 먹는 시간을 갖습니다.\n\n도시화가 진행되면서 전통적인 추석 문화도 변화하고 있습니다. 아파트에서는 간소화된 차례상을 차리고, 성묘 대신 추모공원을 방문하는 경우가 늘어나고 있습니다. 또한 해외여행을 떠나는 가족들도 증가하면서 새로운 형태의 추석 문화가 나타나고 있습니다.\n\n젊은 세대들은 전통 송편 만들기 체험 프로그램에 참여하거나, SNS를 통해 추석 인사를 나누는 등 현대적 방식으로 명절을 기념하고 있습니다.",
        economicImpact: "한국 최대 규모의 민족 대이동이 일어나며, 교통, 숙박, 선물 관련 산업에 연간 수조원 규모의 경제 효과를 창출합니다.\n\n추석 연휴 기간 동안의 경제 파급효과는 설날과 함께 연간 20조원 이상으로 추산됩니다. 추석 선물세트 시장만으로도 수천억원 규모의 매출이 발생하며, 한우, 과일, 전통주 등의 판매가 급증합니다.\n\n고속도로 통행료, 철도 및 항공료 수입이 크게 늘어나고, 주유소와 휴게소 매출도 평소의 2-3배로 증가합니다. 또한 성묘용 꽃과 제수용품, 한복 등 관련 업계에도 상당한 경제적 효과를 가져다줍니다."
      },
      {
        name: "어린이날",
        keywords: ["children's day", "어린이날"],
        description: "어린이들의 인격을 존중하고 행복을 도모하기 위해 제정된 날로, 방정환 선생의 어린이 사랑 정신을 기리고 있습니다. 가족들이 함께 놀이공원이나 동물원을 방문하고, 어린이들에게 선물을 주며 특별한 하루를 만들어줍니다.\n\n단순한 휴일을 넘어 어린이의 권리와 미래에 대한 사회적 관심을 환기시키는 의미 있는 날입니다. 전국 곳곳에서 어린이를 위한 다양한 행사와 프로그램이 열리며, 어린이들의 꿈과 희망을 응원하는 따뜻한 사회 분위기가 조성됩니다.",
        culturalContext: "근대 아동 인권 의식과 교육 개혁 정신의 산물로, 동양에서는 최초로 어린이의 인격과 권리를 인정한 혁신적인 문화적 사건입니다.",
        historicalBackground: "1923년 방정환이 주도하여 제정된 세계 최초의 어린이날로, 일제강점기 어린이 인권 신장 운동의 상징이었습니다. 방정환은 '어린이'라는 말을 처음 사용하며 아동을 하나의 독립된 인격체로 인식해야 한다고 주장했습니다.\n\n색동회를 중심으로 한 어린이 운동은 단순한 복지 차원을 넘어 민족의식 고취와 교육 개혁을 목표로 했습니다. 해방 후 1946년 5월 5일로 날짜가 확정되었고, 1975년 공휴일로 지정되어 현재에 이르고 있습니다.",
        modernCelebration: "현재는 5월 5일 공휴일로 지정되어 전국의 놀이시설과 문화시설에서 어린이를 위한 특별 프로그램이 운영됩니다.\n\n놀이공원, 동물원, 박물관, 과학관 등에서는 어린이 무료 입장이나 할인 혜택을 제공하며, 각종 체험 프로그램과 공연이 열립니다. 백화점과 대형마트에서는 어린이 선물 코너를 특별히 마련하고, 가족 단위 고객을 위한 다양한 이벤트를 진행합니다.\n\n최근에는 어린이의 창의성과 상상력을 키우는 교육적 프로그램들이 인기를 끌고 있으며, 디지털 네이티브 세대에 맞는 IT 체험 프로그램도 늘어나고 있습니다.",
        economicImpact: "어린이 관련 상품, 놀이시설, 외식업계에 연간 1조원 이상의 경제 효과를 가져다주는 중요한 소비 촉진 기념일입니다.\n\n어린이날 연휴 기간 동안 테마파크 입장객이 평소의 3-4배로 증가하며, 완구업계 매출도 크게 늘어납니다. 패밀리 레스토랑과 키즈카페 등 어린이 친화적 업소들의 매출이 급증하고, 어린이 의류와 신발 판매도 활발해집니다.\n\n특히 교육용 장난감, 도서, 체험 상품권 등이 인기 선물로 각광받으며, 관련 업계에 상당한 경제적 파급효과를 가져다줍니다."
      },
      {
        name: "Buddha's Birthday",
        keywords: ["buddha", "부처님", "석가탄신일", "연등"],
        description: "석가모니 부처님의 탄생을 기념하는 불교 최대의 명절로, 음력 4월 8일에 기념됩니다. 전국의 사찰에서는 화려한 연등이 밝혀지고, 신도들은 부처님의 자비와 지혜를 기리며 마음의 평안을 구합니다. 특히 서울 조계사에서 시작되어 청계천을 따라 이어지는 연등축제는 봄밤을 수놓는 장관을 연출하며, 불교 신도뿐만 아니라 일반 시민들에게도 큰 볼거리가 되고 있습니다.",
        culturalContext: "한국 불교 문화의 정수를 보여주는 대표적 종교 축제로, 전통과 현대가 조화롭게 어우러진 문화적 행사",
        historicalBackground: "삼국시대 불교 전래와 함께 시작된 오랜 전통으로, 통일신라와 고려시대를 거치며 국가적 행사로 발전했습니다. 조선시대 숭유억불 정책으로 위축되었다가, 일제강점기와 해방 이후 다시 활성화되었습니다. 1975년 공휴일로 지정되면서 현재의 모습을 갖추게 되었으며, 1996년부터 시작된 연등축제는 이제 서울의 대표적인 봄 축제로 자리잡았습니다.",
        modernCelebration: "현대에는 전국 사찰에서 연등 점등식과 법요식이 거행되며, 서울 연등축제를 비롯해 각 지역에서 다양한 불교 문화 행사가 열립니다. 템플스테이 프로그램이 인기를 끌고 있으며, 불교 음식 체험, 전통 차 시음, 명상 프로그램 등이 일반인들에게도 개방됩니다. 특히 젊은 세대들 사이에서는 연등 만들기 체험과 SNS 인증샷 촬영이 새로운 트렌드로 자리잡고 있습니다.",
        economicImpact: "연등축제와 관련 문화 행사로 관광업계와 전통 공예업계에 상당한 경제적 효과를 가져다줍니다. 서울 연등축제만으로도 연간 수백억원의 관광 수입을 창출하며, 전국 사찰 주변 상권과 전통 찻집, 불교 용품점 등의 매출이 크게 증가합니다. 또한 템플스테이 관련 산업과 불교 문화 체험 프로그램 등 새로운 문화 관광 상품들이 지속적으로 개발되고 있습니다."
      },
      {
        name: "Memorial Day",
        keywords: ["memorial", "현충일", "추모", "국립묘지"],
        description: "나라를 위해 목숨을 바친 순국선열과 호국영령들을 추모하는 국가 기념일로, 매년 6월 6일에 기념됩니다. 오전 10시 정각에 전국에서 사이렌이 울리면 모든 국민이 1분간 묵념을 올리며, 대통령을 비롯한 정부 요인들은 국립현충원에서 추념식을 거행합니다. 이 날은 단순한 추모를 넘어 평화의 소중함과 자유민주주의의 가치를 되새기는 의미 깊은 시간입니다.",
        culturalContext: "국가를 위한 희생정신과 애국심을 기리는 숭고한 추모 문화로, 분단국가 한국의 특수한 역사적 상황을 반영한 국가적 의례",
        historicalBackground: "1956년 정부에서 제정한 기념일로, 6월 6일은 24절기 중 망종(芒種)에 해당하여 '호국영령들이 잠든 곳에 풀과 나무가 무성해진다'는 의미를 담고 있습니다. 한국전쟁 이후 전사자들을 추모하기 위해 시작되었으며, 1975년 공휴일로 지정되었습니다. 국립현충원은 1955년 조성되어 현재까지 25만여 위의 영령들이 안장되어 있으며, 매년 현충일에는 전국에서 참배객들이 몰려듭니다.",
        modernCelebration: "현대에는 국립현충원 추념식을 중심으로 전국 각지의 현충시설에서 추모 행사가 열립니다. 학교에서는 현충일의 의미를 교육하는 특별 수업이 진행되고, 각 가정에서는 태극기를 게양합니다. 최근에는 젊은 세대들이 SNS를 통해 호국영령들에 대한 감사 메시지를 전하는 새로운 추모 문화도 나타나고 있으며, 현충원 참배 후기를 공유하는 것이 하나의 트렌드가 되고 있습니다.",
        economicImpact: "직접적인 경제 활동보다는 국가 정체성 강화와 애국심 고취를 통한 사회 통합 효과가 큽니다. 현충원 주변 화환업계와 추모용품 업계에 일시적인 매출 증가가 있으며, 호국 관련 도서와 영화, 다큐멘터리 등 문화 콘텐츠에 대한 관심도 높아집니다. 또한 안보 관광과 역사 교육 프로그램 등이 활성화되어 교육 관련 산업에도 긍정적 영향을 미칩니다."
      },
      {
        name: "Liberation Day",
        keywords: ["liberation", "광복절", "해방", "독립"],
        description: "1945년 8월 15일 일제강점기로부터 해방된 것을 기념하는 국경일로, 광복절이라고도 불립니다. 35년간의 일제강점기가 끝나고 우리나라가 주권을 되찾은 역사적인 날을 기념하며, 독립을 위해 희생한 순국선열들의 숭고한 뜻을 기리는 날입니다. 전국에서 태극기가 게양되고, 광복회를 중심으로 한 기념행사가 열리며, 일제강점기 역사 교육과 평화 통일에 대한 의지를 다지는 시간이기도 합니다.",
        culturalContext: "일제강점기 극복과 민족 자주성 회복을 상징하는 국가적 자긍심의 원천으로, 분단 극복과 통일 의지를 다지는 역사적 의미를 지닌 날",
        historicalBackground: "1945년 8월 15일 일본이 연합군에 항복하면서 한반도가 해방된 날로, 1949년 '국경일에 관한 법률'에 의해 국경일로 지정되었습니다. 광복(光復)이라는 말은 '빛을 되찾는다'는 뜻으로, 나라의 주권을 되찾았다는 의미를 담고 있습니다. 해방 직후에는 8월 15일을 '해방절'이라고 불렀으나, 1949년부터 '광복절'로 명칭이 바뀌었습니다. 이 날은 남북한이 공통으로 기념하는 몇 안 되는 기념일 중 하나이기도 합니다.",
        modernCelebration: "현대에는 정부 주최로 세종문화회관에서 경축식이 열리고, 전국 각지에서 광복절 기념행사가 진행됩니다. 독립기념관과 서대문형무소역사관 등 일제강점기 관련 역사 교육장에는 많은 관람객이 몰리며, 학교에서는 광복절의 의미를 되새기는 교육 프로그램이 운영됩니다. 최근에는 젊은 세대들이 일제강점기 역사를 재조명하는 웹툰, 영화, 드라마 등을 통해 역사 의식을 새롭게 하고 있으며, SNS를 통한 역사 교육 콘텐츠도 활발히 공유되고 있습니다.",
        economicImpact: "역사 교육 관련 시설과 문화 콘텐츠 업계에 긍정적 영향을 미칩니다. 독립기념관, 서대문형무소역사관 등 역사 교육 시설의 관람객이 급증하며, 일제강점기와 광복 관련 도서, 영화, 다큐멘터리 등의 판매와 관람이 늘어납니다. 또한 태극기 판매와 광복절 기념품 시장도 활성화되며, 역사 체험 프로그램과 교육 여행 상품 등이 인기를 끌어 관련 업계에 경제적 효과를 가져다줍니다."
      },
      {
        name: "National Foundation Day",
        keywords: ["foundation", "개천절", "단군", "건국"],
        description: "단군왕검이 고조선을 건국한 것을 기념하는 국경일로, 매년 10월 3일에 기념됩니다. '하늘이 열린 날'이라는 뜻의 개천절은 우리 민족의 시조인 단군과 고조선 건국의 역사적 의미를 되새기는 날입니다. 전국에서 태극기가 게양되고, 강화도 마니산과 지리산 천왕봉 등에서는 개천절 기념 제천행사가 열리며, 우리 민족의 유구한 역사와 문화적 정체성을 확인하는 소중한 시간입니다.",
        culturalContext: "한민족의 건국 신화와 역사적 정체성을 기리는 민족적 자긍심의 상징으로, 5천년 역사의 시작점을 기념하는 문화적 의례",
        historicalBackground: "단군왕검이 기원전 2333년 10월 3일 고조선을 건국했다는 단군신화에 근거하여 제정된 기념일입니다. 일제강점기인 1909년 대종교에서 처음 기념하기 시작했으며, 1949년 '국경일에 관한 법률'에 의해 국경일로 지정되었습니다. 개천(開天)이라는 말은 '하늘이 열렸다'는 뜻으로, 단군이 하늘의 뜻을 받아 나라를 세웠다는 의미를 담고 있습니다. 이는 우리 민족의 천손사상과 홍익인간 이념을 반영한 것입니다.",
        modernCelebration: "현대에는 정부 주최로 세종문화회관에서 경축식이 열리고, 강화도 마니산 참성단에서는 전통 제천행사가 거행됩니다. 전국 각지의 단군성전과 사당에서도 제례가 올려지며, 학교에서는 우리나라 건국의 역사와 홍익인간 정신을 교육하는 프로그램이 운영됩니다. 최근에는 한국사에 대한 관심 증가와 함께 고조선과 단군에 대한 학술적 연구도 활발해지고 있으며, 관련 문화 콘텐츠와 교육 프로그램도 다양하게 개발되고 있습니다.",
        economicImpact: "역사 교육과 전통문화 관련 산업에 긍정적 영향을 미칩니다. 강화도 마니산과 지리산 등 개천절 관련 성지 순례 관광이 활성화되며, 단군과 고조선 관련 도서와 교육 자료의 판매가 증가합니다. 또한 전통 제례용품과 한국사 교육 프로그램, 역사 체험 상품 등의 수요가 늘어나 관련 업계에 경제적 효과를 가져다줍니다. 특히 국사 교육 강화 정책과 맞물려 역사 교육 관련 시장이 지속적으로 성장하고 있습니다."
      },
      {
        name: "Hangeul Day",
        keywords: ["hangeul", "한글날", "세종대왕", "훈민정음"],
        description: "세종대왕이 훈민정음(한글)을 창제하여 반포한 것을 기념하는 국경일로, 매년 10월 9일에 기념됩니다. 1446년 훈민정음 해례본이 간행된 날을 기념하여 제정된 이 날은 한글의 우수성과 세종대왕의 애민정신을 기리는 뜻깊은 날입니다. 전 세계에서 유일하게 문자 창제일을 국경일로 정한 나라답게, 한글의 과학성과 독창성을 자랑스럽게 여기며 우리 문화의 정체성을 확인하는 소중한 시간입니다.",
        culturalContext: "한민족의 문자 문화와 언어적 정체성을 기리는 세계 유일의 문자 기념일로, 세종대왕의 애민정신과 한글의 과학적 우수성을 상징하는 문화적 자산",
        historicalBackground: "1446년 세종대왕이 훈민정음을 창제하여 반포한 것을 기념하기 위해 1926년 조선어학회에서 처음 '가갸날'로 제정했습니다. 1928년부터 '한글날'로 명칭을 바꾸었고, 광복 후 1945년부터 10월 9일로 날짜를 확정했습니다. 1970년 공휴일로 지정되었다가 1991년 공휴일에서 제외되었으나, 2013년 다시 공휴일로 지정되어 현재에 이르고 있습니다. 이는 한글의 가치와 중요성에 대한 사회적 인식이 높아진 결과입니다.",
        modernCelebration: "현대에는 세종문화회관에서 한글날 경축식이 열리고, 전국 각지에서 한글 관련 행사와 전시회가 개최됩니다. 한글박물관과 세종대왕기념관에는 많은 관람객이 몰리며, 학교에서는 한글의 우수성과 세종대왕의 업적을 교육하는 프로그램이 운영됩니다. 최근에는 한글 디자인 공모전, 한글 캘리그래피 체험, 한글 관련 문화 콘텐츠 제작 등이 활발해지고 있으며, K-컬처의 세계적 확산과 함께 한글에 대한 국제적 관심도 높아지고 있습니다.",
        economicImpact: "한글 교육과 문화 콘텐츠 산업에 상당한 경제적 효과를 가져다줍니다. 한국어 교육 시장이 급성장하면서 한글 교재와 교육 프로그램의 수요가 크게 증가하고 있으며, 한글 디자인과 타이포그래피 관련 산업도 활성화되고 있습니다. 또한 한글날을 계기로 한국어와 한국 문화에 대한 관심이 높아지면서 관련 도서, 교육 상품, 문화 체험 프로그램 등의 시장이 지속적으로 확대되고 있습니다."
      }
    ],
    JP: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해", "신정"],
        description: "일본에서 가장 중요한 명절로, 새로운 한 해의 시작을 축하하는 날입니다. 가족들이 모여 오세치 요리를 나누어 먹고, 신사에 하츠모데(첫 참배)를 하며 한 해의 행운을 빕니다.",
        culturalContext: "일본 전통 문화와 현대적 축제가 조화롭게 어우러진 대표적 명절",
        historicalBackground: "메이지 유신 이후 서구식 태양력을 도입하면서 1월 1일이 공식 새해로 정착되었으며, 전통적인 정월 의식과 결합되었습니다.",
        modernCelebration: "현대 일본에서는 오세치 요리, 하츠모데, 연하장 교환, 오토시다마(세뱃돈) 주기 등의 전통이 이어지고 있습니다.",
        economicImpact: "일본 최대의 소비 시즌으로 연말연시 상품, 여행, 외식업계에 연간 수십조엔의 경제 효과를 창출합니다."
      },
      {
        name: "Golden Week",
        keywords: ["golden week", "골든위크", "연휴"],
        description: "4월 말부터 5월 초까지 이어지는 일본 최대의 연휴 기간으로, 여러 공휴일이 연결되어 형성됩니다. 쇼와의 날, 헌법기념일, 녹색의 날, 어린이날이 포함되며, 일본인들의 대표적인 휴가철입니다.\n\n일본 특유의 연휴 문화와 집단 휴가 시스템의 상징으로, 전 국민이 동시에 휴가를 즐기는 독특한 사회 현상을 보여줍니다. 이 기간 동안 일본 전체가 축제 분위기에 휩싸이며, 가족 단위의 여행과 레저 활동이 절정에 달합니다.",
        culturalContext: "일본 특유의 연휴 문화와 집단 휴가 시스템의 상징으로, 전후 일본 사회의 경제 발전과 여가 문화 확산을 보여주는 대표적 사례입니다.",
        historicalBackground: "1948년 공휴일법 제정 이후 여러 공휴일이 집중되면서 자연스럽게 형성된 연휴로, 1950년대부터 골든위크라는 명칭이 사용되기 시작했습니다. 이 명칭은 영화업계에서 흥행 성수기를 뜻하는 용어에서 유래되었으며, 점차 일반화되었습니다.\n\n전후 복구기를 거쳐 고도성장기에 접어들면서 일본인들의 생활 수준이 향상되고, 여가에 대한 관심이 높아지면서 골든위크는 국민적 휴가 기간으로 자리잡게 되었습니다. 1970년대 이후에는 해외여행 붐과 함께 국제적인 관광 시즌으로도 발전했습니다.",
        modernCelebration: "현대 일본에서는 해외여행, 국내관광, 가족 나들이의 최대 성수기로, 전국적으로 다양한 축제와 이벤트가 개최됩니다.\n\n특히 이 기간에는 전국의 관광지에서 특별 프로그램을 운영하고, 테마파크와 박물관에서는 골든위크 한정 이벤트를 개최합니다. 도시 지역에서는 대규모 야외 축제와 콘서트가 열리며, 지방에서는 전통 축제와 지역 특산품 행사가 활발히 진행됩니다.\n\n최근에는 코로나19의 영향으로 해외여행이 제한되면서 국내 관광에 더욱 집중하는 경향을 보이고 있으며, 캠핑과 아웃도어 활동이 새로운 골든위크 트렌드로 자리잡고 있습니다.",
        economicImpact: "일본 관광업계 최대의 성수기로 연간 관광 수입의 상당 부분을 차지하며, 교통, 숙박, 외식업계에 막대한 경제 효과를 가져다줍니다.\n\n골든위크 기간 동안의 경제 파급효과는 연간 수조엔 규모로 추산되며, 이는 일본 GDP의 상당 부분을 차지합니다. 항공업계와 철도업계는 이 시기에 연간 최대 매출을 기록하며, 호텔과 여관 등 숙박업계도 성수기 요금을 적용하여 높은 수익을 올립니다.\n\n또한 테마파크, 쇼핑몰, 레스토랑 등 서비스업 전반에 걸쳐 매출이 급증하며, 지방 관광지의 경우 연간 관광 수입의 30-40%를 이 기간에 올리는 경우도 많습니다. 최근에는 온라인 쇼핑과 배달 서비스 업계에서도 골든위크 특수를 누리고 있습니다."
      },
      {
        name: "Children's Day",
        keywords: ["children's day", "어린이날", "kodomo no hi"],
        description: "어린이의 인격을 존중하고 행복을 도모하며 어머니에게 감사하는 마음을 기르는 날입니다. 전통적으로 남자아이의 건강한 성장을 기원하는 단오절에서 유래되었으며, 집집마다 잉어 깃발(고이노보리)을 달고 무사 인형을 장식합니다.\n\n현재는 성별에 관계없이 모든 어린이의 건강과 행복을 기원하는 따뜻한 가족 명절로 자리잡았습니다. 5월의 신록과 함께 어린이들의 밝은 미래를 응원하는 일본 특유의 정서가 잘 드러나는 공휴일입니다.",
        culturalContext: "일본 전통 절기와 현대적 아동 복지 정신이 조화롭게 결합된 명절로, 가족 중심 문화와 어린이 사랑 정신을 보여주는 대표적 사례입니다.",
        historicalBackground: "원래는 중국에서 전해진 단오절(端午節)에서 유래되었으며, 헤이안 시대부터 남자아이의 건강과 출세를 기원하는 절기로 자리잡았습니다. 에도시대에는 무사 계급을 중심으로 갑옷과 투구를 장식하고 잉어 깃발을 다는 전통이 확립되었습니다.\n\n메이지 유신 이후 1948년 공휴일법 제정 시 '어린이의 인격을 존중하고 어린이의 행복을 도모하며 어머니에게 감사하는' 날로 재정의되면서 현재의 형태가 되었습니다. 이때부터 남녀 구분 없이 모든 어린이를 위한 날로 확대되었습니다.",
        modernCelebration: "현대 일본에서는 집집마다 고이노보리(잉어 깃발)를 달고, 실내에는 고바시(무사 인형)를 장식합니다. 가족들이 함께 가시와모치(떡)를 먹고, 창포탕에 목욕하는 전통도 이어지고 있습니다.\n\n최근에는 전통적인 의식과 함께 현대적인 어린이 축제 요소들이 결합되고 있습니다. 백화점과 쇼핑몰에서는 어린이 관련 상품 전시회를 열고, 각종 체험 프로그램과 워크숍을 운영합니다. 또한 지역 공동체에서는 어린이들을 위한 다양한 이벤트와 축제를 개최하여 현대적 의미의 어린이날을 만들어가고 있습니다.",
        economicImpact: "어린이 관련 상품과 서비스 업계에 상당한 경제적 효과를 가져다주는 중요한 소비 촉진 기념일입니다.\n\n고이노보리와 고바시 등 전통 장식품 판매가 급증하며, 어린이 의류, 장난감, 도서 등의 매출도 크게 늘어납니다. 특히 골든위크 기간 중에 위치하여 가족 단위 소비가 활발해지며, 테마파크와 어린이 시설의 입장객도 평소의 2-3배로 증가합니다.\n\n또한 어린이 관련 교육 서비스와 체험 프로그램 업계에도 긍정적 영향을 미치며, 관련 업계 전체적으로 연간 수천억엔 규모의 경제 효과를 창출하고 있습니다."
      }
    ],
    GB: [
      {
        name: "Boxing Day",
        keywords: ["boxing day", "박싱데이"],
        description: "크리스마스 다음 날인 12월 26일로, 영국과 영연방 국가들의 독특한 전통 휴일입니다. 과거 주인이 하인들에게 선물 상자를 주던 관습에서 유래되었으며, 현재는 가족과 함께 여유로운 시간을 보내거나 쇼핑을 즐기는 날입니다.",
        culturalContext: "빅토리아 시대 계급 사회의 온정주의가 현대적 휴일로 발전한 사례",
        historicalBackground: "중세 시대 교회에서 가난한 사람들을 위한 구호 상자(alms box)를 여는 날에서 유래되었으며, 빅토리아 시대에 현재의 형태로 정착되었습니다.",
        modernCelebration: "현대 영국에서는 축구 경기 관람, 가족 산책, 대규모 세일 쇼핑 등이 대표적인 활동이며, 크리스마스의 여운을 이어가는 특별한 날입니다.",
        economicImpact: "영국 소매업계의 최대 할인 시즌 중 하나로, 크리스마스와 함께 연말 소비의 핵심 동력 역할을 합니다."
      }
    ],
    FR: [
      {
        name: "Bastille Day",
        keywords: ["bastille day", "바스티유 데이", "프랑스 혁명"],
        description: "1789년 7월 14일 바스티유 감옥 습격 사건을 기념하는 프랑스 혁명 기념일입니다. 샹젤리제 거리에서 열리는 대규모 군사 퍼레이드와 에펠탑 불꽃놀이가 장관을 이루며, 자유, 평등, 박애의 공화국 정신을 되새기는 날입니다.",
        culturalContext: "근대 민주주의 혁명의 상징적 사건을 기념하는 공화국 정신의 축제",
        historicalBackground: "1789년 파리 시민들이 바스티유 감옥을 습격하여 정치범들을 해방시킨 사건으로, 프랑스 대혁명의 시작을 알리는 상징적 사건입니다.",
        modernCelebration: "현대 프랑스에서는 전국적으로 군사 퍼레이드, 불꽃놀이, 거리 축제가 열리며, 삼색기를 게양하고 라 마르세예즈를 부르는 전통이 있습니다.",
        economicImpact: "프랑스 관광업계의 중요한 성수기로, 국내외 관광객들이 몰려들어 상당한 경제적 효과를 창출합니다."
      }
    ]
  },

  en: {
    US: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해"],
        description: "New Year's Day marks the beginning of a new year and is one of the most universally celebrated holidays worldwide. In the United States, the iconic Times Square Ball Drop ceremony symbolizes the transition, while families gather to make resolutions and spend quality time together.",
        culturalContext: "Western tradition of celebrating the Gregorian calendar new year",
        historicalBackground: "Since the adoption of the Gregorian calendar, January 1st has been established as the official first day of the new year, with America developing a full festival culture from the 19th century.",
        modernCelebration: "Modern American celebrations include the Times Square Ball Drop, Rose Parade, family gatherings, and the particularly developed culture of New Year's Resolutions.",
        economicImpact: "The New Year holiday is crucial for American retail, with significant increases in sales of party supplies, champagne, and gifts, bringing considerable economic benefits to the tourism industry."
      },
      {
        name: "Independence Day",
        keywords: ["independence", "4th july", "독립기념일"],
        description: "Independence Day commemorates the adoption of the Declaration of Independence on July 4, 1776, making it America's greatest national holiday. Decorated in red, white, and blue colors of the flag, Americans celebrate freedom and independence with barbecue parties and fireworks.",
        culturalContext: "Symbol of national pride commemorating the historic moment of America's founding",
        historicalBackground: "The day when the Declaration of Independence was adopted by the Continental Congress in 1776, proclaiming the will for independence from Britain.",
        modernCelebration: "Parades, barbecue parties, and fireworks are held nationwide, with traditions of raising the flag and singing patriotic songs.",
        economicImpact: "Combined with summer vacation season, it brings significant economic effects to tourism, dining, and retail industries, while fireworks-related industries are greatly activated."
      }
    ],
    KR: [
      {
        name: "설날",
        keywords: ["lunar new year", "설날", "korean new year", "seollal", "Lunar New Year"],
        description: "Lunar New Year is the first day of the lunar calendar and the most important traditional holiday for Koreans. Families perform ancestral rites, give New Year greetings to elders through sebae, and eat tteokguk (rice cake soup) symbolizing growing a year older.",
        culturalContext: "Tradition combining agricultural society's seasonal cycles with ancestor worship",
        historicalBackground: "A tradition dating back to the Three Kingdoms period, originating from agricultural society's New Year customs based on the lunar calendar.",
        modernCelebration: "In modern times, families gather to share traditional foods, enjoy traditional games like yutnori and kite flying, and continue the culture of wearing hanbok and performing sebae.",
        economicImpact: "Large-scale economic activities occur through holiday gifts, traditional food ingredients, and transportation costs, significantly impacting homecoming and travel-related industries."
      },
      {
        name: "Chuseok",
        keywords: ["chuseok", "추석", "harvest festival"],
        description: "Chuseok falls on the 15th day of the 8th lunar month and is Korea's representative holiday for sharing the year's harvest with ancestors. Families make and eat songpyeon (rice cakes), honor ancestors through tomb visits, and enjoy traditional games like ganggangsullae under the full moon.",
        culturalContext: "Fusion of agricultural society's harvest festival with ancestor reverence culture",
        historicalBackground: "Originating from the harvest festival called gabae during the Silla Dynasty, it settled into its current form during the Joseon Dynasty.",
        modernCelebration: "In modern times, it's designated as a 3-day holiday where families gather to perform ancestral rites, visit graves, and share traditional foods.",
        economicImpact: "Korea's largest-scale ethnic migration occurs, creating economic effects worth trillions of won annually in transportation, accommodation, and gift-related industries."
      },
      {
        name: "Children's Day",
        keywords: ["children's day", "어린이날"],
        description: "Children's Day was established to respect children's dignity and promote their happiness, honoring the spirit of Bang Jeong-hwan's love for children. Families visit amusement parks or zoos together and give children gifts to create a special day.",
        culturalContext: "Product of modern child rights consciousness and educational reform spirit",
        historicalBackground: "Established in 1923 under Bang Jeong-hwan's leadership as the world's first Children's Day, it was a symbol of the children's rights movement during Japanese colonial rule.",
        modernCelebration: "Currently designated as a public holiday on May 5th, special programs for children are operated at amusement facilities and cultural facilities nationwide.",
        economicImpact: "An important consumption-promoting commemorative day that brings over 1 trillion won in economic effects annually to children-related products, amusement facilities, and the restaurant industry."
      }
    ],
    JP: [
      {
        name: "New Year's Day",
        keywords: ["new year", "새해", "신정"],
        description: "New Year's Day is Japan's most important holiday, celebrating the beginning of a new year. Families gather to share osechi cuisine and visit shrines for hatsumode (first shrine visit) to pray for good fortune in the coming year.",
        culturalContext: "Representative holiday where Japanese traditional culture and modern celebration harmoniously blend",
        historicalBackground: "After the Meiji Restoration, with the adoption of the Western solar calendar, January 1st became established as the official New Year, combining with traditional New Year ceremonies.",
        modernCelebration: "In modern Japan, traditions continue including osechi cuisine, hatsumode, exchanging nengajo (New Year cards), and giving otoshidama (New Year money).",
        economicImpact: "Japan's largest consumption season, creating economic effects worth tens of trillions of yen annually in year-end and New Year products, travel, and restaurant industries."
      },
      {
        name: "Golden Week",
        keywords: ["golden week", "골든위크", "연휴"],
        description: "Golden Week is Japan's largest holiday period extending from late April to early May, formed by connecting several public holidays. It includes Showa Day, Constitution Memorial Day, Greenery Day, and Children's Day, representing Japanese people's typical vacation season.",
        culturalContext: "Symbol of Japan's unique holiday culture and collective vacation system",
        historicalBackground: "A holiday period naturally formed after the establishment of the Public Holiday Law in 1948 when several public holidays became concentrated, with the term 'Golden Week' beginning to be used from the 1950s.",
        modernCelebration: "In modern Japan, it's the peak season for overseas travel, domestic tourism, and family outings, with various festivals and events held nationwide.",
        economicImpact: "The peak season for Japan's tourism industry, accounting for a significant portion of annual tourism revenue and bringing enormous economic effects to transportation, accommodation, and restaurant industries."
      }
    ],
    GB: [
      {
        name: "Boxing Day",
        keywords: ["boxing day", "박싱데이"],
        description: "Boxing Day, December 26th, is a unique traditional holiday in Britain and Commonwealth countries. Originating from the custom of masters giving gift boxes to servants, it's now a day for spending leisurely time with family or enjoying shopping.",
        culturalContext: "Example of Victorian era class society's paternalism evolved into a modern holiday",
        historicalBackground: "Originating from the medieval church practice of opening alms boxes for the poor, it settled into its current form during the Victorian era.",
        modernCelebration: "In modern Britain, typical activities include watching football matches, family walks, and large-scale sale shopping, continuing the Christmas spirit as a special day.",
        economicImpact: "One of the biggest discount seasons for British retail, serving as a core driver of year-end consumption along with Christmas."
      }
    ],
    FR: [
      {
        name: "Bastille Day",
        keywords: ["bastille day", "바스티유 데이", "프랑스 혁명"],
        description: "Bastille Day commemorates the storming of the Bastille prison on July 14, 1789, marking the French Revolution anniversary. The grand military parade on the Champs-Élysées and Eiffel Tower fireworks create a spectacular scene, reflecting on the republican spirit of liberty, equality, and fraternity.",
        culturalContext: "Festival of republican spirit commemorating the symbolic event of modern democratic revolution",
        historicalBackground: "The event when Parisian citizens stormed the Bastille prison to liberate political prisoners in 1789, a symbolic event marking the beginning of the French Revolution.",
        modernCelebration: "In modern France, military parades, fireworks, and street festivals are held nationwide, with traditions of raising the tricolor flag and singing La Marseillaise.",
        economicImpact: "An important peak season for France's tourism industry, attracting domestic and international tourists and creating significant economic effects."
      }
    ]
  }
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

  // 키워드 매칭 (더 정확한 매칭을 위해 개선)
  bestMatch = countryDescriptions.find(desc =>
    desc.keywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      return normalizedName.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedName) ||
        normalizedName === normalizedKeyword;
    })
  );

  return bestMatch || null;
}

/**
 * 국가 이름에서 국가 코드를 추출합니다
 */
function getCountryCodeFromName(countryName: string): string {
  const countryCodeMap: Record<string, string> = {
    'United States': 'US',
    'South Korea': 'KR',
    'Korea': 'KR',
    'Japan': 'JP',
    'United Kingdom': 'GB',
    'Britain': 'GB',
    'France': 'FR',
    'Canada': 'CA',
    'Germany': 'DE',
    'China': 'CN',
    'Australia': 'AU'
  };

  return countryCodeMap[countryName] || 'US';
}

/**
 * 한국어 페이지에서 공휴일 이름을 한국어로 변환
 */
function getLocalizedHolidayName(holidayName: string, countryCode: string, locale: string): string {
  if (locale !== 'ko') return holidayName;

  // 한국어 공휴일 이름 매핑
  const koreanNames: Record<string, string> = {
    'Lunar New Year': '설날',
    'Buddha\'s Birthday': '부처님오신날',
    'Memorial Day': '현충일',
    'Liberation Day': '광복절',
    'National Foundation Day': '개천절',
    'Hangeul Day': '한글날',
    'Children\'s Day': '어린이날',
    'Chuseok': '추석',
    'New Year\'s Day': '신정',
    'Christmas Day': '크리스마스',
    'Independence Day': '독립기념일',
    'Constitution Day': '제헌절'
  };

  return koreanNames[holidayName] || holidayName;
}

/**
 * 자연스럽고 흥미로운 공휴일 설명을 생성합니다
 * 기원과 유래, 역사적 맥락, 기념 방식, 현대적 의미, 흥미로운 일화를 포함한 하나의 자연스러운 글로 작성
 */
function generateSEOOptimizedDescription(
  holidayName: string,
  countryName: string,
  countryCode: string,
  locale: string = 'ko'
): string {
  const baseMatch = findBestMatch(holidayName, countryCode, locale);

  if (baseMatch) {
    // 기존 데이터를 활용하여 자연스러운 하나의 글로 재구성
    return createNaturalNarrative(baseMatch, holidayName, countryName, locale);
  }

  // 매칭되지 않은 경우 템플릿 기반 자연스러운 콘텐츠 생성
  return generateEnhancedTemplate(holidayName, countryName, countryCode, locale);
}

/**
 * 기존 데이터를 활용하여 자연스럽고 가독성 좋은 서술형 글로 재구성
 */
function createNaturalNarrative(
  match: HolidayDescription,
  holidayName: string,
  countryName: string,
  locale: string
): string {
  const isKorean = locale === 'ko';

  // 문단들을 자연스럽게 연결하는 접속어와 전환 표현들
  const transitions = {
    ko: {
      historical: ['이 공휴일의 기원을 살펴보면', '역사적으로 살펴보면', '이 날의 유래를 거슬러 올라가면'],
      modern: ['현대에 들어서는', '오늘날에는', '시대가 변하면서'],
      economic: ['이러한 문화적 의미를 넘어서', '사회경제적 관점에서 보면', '경제적 측면에서도'],
      interesting: ['흥미롭게도', '특히 주목할 점은', '재미있는 사실은'],
      conclusion: ['결국', '이처럼', '종합해보면']
    },
    en: {
      historical: ['Looking at the origins of this holiday', 'Historically speaking', 'Tracing back to its roots'],
      modern: ['In modern times', 'Today', 'As times have changed'],
      economic: ['Beyond its cultural significance', 'From a socioeconomic perspective', 'Economically speaking'],
      interesting: ['Interestingly', 'What\'s particularly noteworthy is', 'A fascinating aspect is'],
      conclusion: ['Ultimately', 'In this way', 'All things considered']
    }
  };

  const t = transitions[isKorean ? 'ko' : 'en'];

  // 한국어 페이지에서는 공휴일 이름을 한국어로 변환
  const localizedHolidayName = getLocalizedHolidayName(holidayName, countryName, locale);

  // 기본 설명으로 시작 (첫 번째 문단) - 한국어 이름으로 교체
  let narrative = match.description.replace(new RegExp(holidayName, 'g'), localizedHolidayName);

  // 역사적 배경을 새로운 문단으로 추가
  if (match.historicalBackground) {
    const transition = t.historical[Math.floor(Math.random() * t.historical.length)];
    narrative += `\n\n${transition}, ${match.historicalBackground}`;

    // 역사적 배경에 추가 설명 보강
    if (isKorean) {
      narrative += ' 이러한 역사적 배경은 현재까지도 이 날의 기념 방식과 의미에 깊은 영향을 미치고 있으며, 세대를 거쳐 전해져 내려오는 소중한 문화적 유산이 되었습니다.';
    } else {
      narrative += ' This historical background continues to deeply influence how this day is commemorated and its meaning today, becoming a precious cultural heritage passed down through generations.';
    }
  }

  // 현대적 기념 방식을 새로운 문단으로 추가
  if (match.modernCelebration) {
    const transition = t.modern[Math.floor(Math.random() * t.modern.length)];
    narrative += `\n\n${transition} ${match.modernCelebration}`;

    // 현대적 기념 방식에 추가 설명 보강
    if (isKorean) {
      narrative += ' 전통적인 요소들이 현대적 감각과 조화롭게 어우러지면서, 모든 세대가 함께 참여할 수 있는 의미 있는 문화적 행사로 발전하고 있습니다. 특히 젊은 세대들은 SNS와 디지털 매체를 통해 새로운 방식으로 이 날의 의미를 공유하고 확산시키고 있습니다.';
    } else {
      narrative += ' Traditional elements harmoniously blend with modern sensibilities, evolving into meaningful cultural events where all generations can participate together. Particularly, younger generations are sharing and spreading the meaning of this day in new ways through social media and digital platforms.';
    }
  }

  // 경제적 영향을 새로운 문단으로 추가
  if (match.economicImpact) {
    const transition = t.economic[Math.floor(Math.random() * t.economic.length)];
    narrative += `\n\n${transition} ${match.economicImpact}`;

    // 경제적 영향에 추가 설명 보강
    if (isKorean) {
      narrative += ' 이러한 경제적 파급효과는 단순한 소비 증가를 넘어서 지역 사회 발전과 문화 산업 육성에도 긍정적인 영향을 미치고 있으며, 관련 일자리 창출과 중소기업 매출 증대에도 기여하고 있습니다.';
    } else {
      narrative += ' These economic ripple effects go beyond simple consumption increases to positively impact regional development and cultural industry growth, also contributing to job creation and increased sales for small and medium enterprises.';
    }
  }

  // 지역별 차이점이나 흥미로운 사실을 새로운 문단으로 추가
  if (match.regionalVariations) {
    const transition = t.interesting[Math.floor(Math.random() * t.interesting.length)];
    narrative += `\n\n${transition} ${match.regionalVariations}`;

    // 흥미로운 사실에 추가 설명 보강
    if (isKorean) {
      narrative += ' 이러한 다양성은 해당 국가의 풍부한 문화적 스펙트럼을 보여주는 좋은 예시이며, 지역별 특색이 어우러져 더욱 풍성한 축제 문화를 만들어내고 있습니다.';
    } else {
      narrative += ' This diversity serves as an excellent example of the country\'s rich cultural spectrum, with regional characteristics coming together to create an even richer festival culture.';
    }
  }

  // 문화적 의미와 미래 전망으로 마무리 (마지막 문단)
  const conclusion = t.conclusion[Math.floor(Math.random() * t.conclusion.length)];
  const culturalContext = match.culturalContext ||
    (isKorean
      ? `${holidayName}은 ${countryName}의 독특한 문화적 정체성과 가치를 대표하는 중요한 날입니다`
      : `${holidayName} represents the unique cultural identity and values of ${countryName}`);

  const finalThought = isKorean
    ? '이는 단순한 휴일을 넘어 문화적 유산과 연결되고 성찰하는 의미 있는 시간이 되고 있습니다. 앞으로도 이 날은 과거와 현재, 전통과 현대를 잇는 문화적 가교 역할을 하며, 국민들의 정체성 형성과 사회 통합에 중요한 기여를 할 것으로 기대됩니다.'
    : 'This makes it not just a day off work, but a meaningful time for reflection and connection with cultural heritage. Going forward, this day is expected to continue serving as a cultural bridge connecting past and present, tradition and modernity, making important contributions to identity formation and social integration.';

  narrative += `\n\n${conclusion} ${culturalContext}. ${finalThought}`;

  return narrative;
}

/**
 * 향상된 템플릿 기반 콘텐츠 생성 (매칭되지 않은 공휴일용)
 */
function generateEnhancedTemplate(
  holidayName: string,
  countryName: string,
  countryCode: string,
  locale: string
): string {
  const isKorean = locale === 'ko';

  // 공휴일 이름에서 키워드 추출하여 맞춤형 내용 생성
  const keywords = extractKeywords(holidayName, locale);
  const thematicContent = generateThematicContent(keywords, countryName, locale);

  if (isKorean) {
    const localizedName = getLocalizedHolidayName(holidayName, countryCode, locale);
    return `${localizedName}은 ${countryName}에서 기념하는 의미 깊은 공휴일입니다. ${thematicContent.introduction} 이 날은 단순한 휴일을 넘어서 해당 국가의 문화적 정체성과 국민들의 가치관을 반영하는 중요한 시간으로 여겨지고 있습니다.

${thematicContent.historical} 이러한 역사적 배경은 현재까지도 이 날의 기념 방식과 의미에 깊은 영향을 미치고 있으며, 세대를 거쳐 전해져 내려오는 소중한 문화적 유산이 되었습니다. 특히 현대 사회에서는 이러한 역사적 의미를 재해석하고 새로운 관점에서 조명하려는 노력들이 지속되고 있습니다.

${thematicContent.modern} 전통적인 요소들이 현대적 감각과 조화롭게 어우러지면서, 모든 세대가 함께 참여할 수 있는 의미 있는 문화적 행사로 발전하고 있습니다. 특히 젊은 세대들은 소셜미디어와 디지털 플랫폼을 통해 새로운 방식으로 이 날의 의미를 공유하고 확산시키고 있으며, 이는 전통 문화의 현대적 계승이라는 측면에서 매우 긍정적인 현상으로 평가받고 있습니다.

${thematicContent.cultural} 이는 단순한 휴일을 넘어서 ${countryName} 국민들의 정체성과 가치관을 확인하는 소중한 시간이 되고 있습니다. 또한 이 날을 통해 국민들은 공동체 의식을 강화하고, 문화적 자긍심을 높이며, 미래 세대에게 전할 소중한 가치들을 되새기는 기회를 갖게 됩니다.

${thematicContent.economic} 이러한 경제적 파급효과는 단순한 소비 증가를 넘어서 지역 사회 발전과 문화 산업 육성에도 긍정적인 영향을 미치고 있습니다. 특히 관련 일자리 창출과 중소기업 매출 증대, 지역 관광 활성화 등을 통해 국가 경제 전반에 기여하고 있으며, 문화 콘텐츠 산업의 성장 동력으로도 작용하고 있습니다.

${thematicContent.conclusion} 앞으로도 이 날은 과거와 현재, 전통과 현대를 잇는 문화적 가교 역할을 하며, ${countryName} 사회의 지속가능한 발전과 문화적 정체성 유지에 중요한 기여를 할 것으로 기대됩니다.`;
  } else {
    return `${holidayName} is a meaningful public holiday celebrated in ${countryName}. ${thematicContent.introduction} This day goes beyond being a simple holiday to serve as an important time reflecting the country's cultural identity and people's values.

${thematicContent.historical} This historical background continues to deeply influence how this day is commemorated and its meaning today, becoming a precious cultural heritage passed down through generations. Particularly in modern society, there are ongoing efforts to reinterpret these historical meanings and illuminate them from new perspectives.

${thematicContent.modern} Traditional elements harmoniously blend with modern sensibilities, evolving into meaningful cultural events where all generations can participate together. Particularly, younger generations are sharing and spreading the meaning of this day in new ways through social media and digital platforms, which is evaluated as a very positive phenomenon in terms of modern succession of traditional culture.

${thematicContent.cultural} This goes beyond being just a holiday to become a precious time for confirming the identity and values of ${countryName}'s people. Through this day, people also have the opportunity to strengthen community consciousness, enhance cultural pride, and reflect on precious values to pass on to future generations.

${thematicContent.economic} These economic ripple effects go beyond simple consumption increases to positively impact regional development and cultural industry growth. Particularly through job creation, increased sales for small and medium enterprises, and regional tourism activation, it contributes to the overall national economy and serves as a growth engine for the cultural content industry.

${thematicContent.conclusion} Going forward, this day is expected to continue serving as a cultural bridge connecting past and present, tradition and modernity, making important contributions to ${countryName}'s sustainable development and maintenance of cultural identity.`;
  }
}

/**
 * 공휴일 이름에서 키워드 추출
 */
function extractKeywords(holidayName: string, locale: string): string[] {
  const keywords: string[] = [];
  const name = holidayName.toLowerCase();

  // 공통 키워드 패턴
  const patterns = {
    religious: ['christmas', 'easter', 'buddha', 'saint', 'holy', '크리스마스', '부처', '성인'],
    national: ['independence', 'national', 'republic', 'liberation', '독립', '국가', '해방', '광복'],
    seasonal: ['new year', 'harvest', 'spring', 'autumn', '새해', '추수', '봄', '가을'],
    family: ['mother', 'father', 'children', 'family', '어머니', '아버지', '어린이', '가족'],
    memorial: ['memorial', 'remembrance', 'veterans', 'martyrs', '기념', '추모', '순국'],
    cultural: ['festival', 'tradition', 'heritage', 'culture', '축제', '전통', '문화'],
    work: ['labor', 'worker', 'constitution', '노동', '근로', '헌법']
  };

  for (const [category, words] of Object.entries(patterns)) {
    if (words.some(word => name.includes(word))) {
      keywords.push(category);
    }
  }

  return keywords.length > 0 ? keywords : ['general'];
}

/**
 * 키워드 기반 테마별 콘텐츠 생성
 */
function generateThematicContent(keywords: string[], countryName: string, locale: string): any {
  const isKorean = locale === 'ko';
  const content: any = {};

  // 키워드에 따른 맞춤형 콘텐츠 생성
  if (keywords.includes('religious')) {
    content.introduction = isKorean
      ? '종교적 전통과 문화적 의미가 깊이 결합된 이 날은 신앙과 공동체 정신을 되새기는 소중한 시간입니다.'
      : 'This day, where religious tradition and cultural meaning are deeply intertwined, serves as a precious time to reflect on faith and community spirit.';

    content.historical = isKorean
      ? '오랜 종교적 전통에서 비롯된 이 공휴일은 세대를 거쳐 전해져 내려오면서 단순한 종교 의식을 넘어 문화적 축제로 발전했습니다.'
      : 'Originating from ancient religious traditions, this holiday has evolved beyond simple religious ceremonies into cultural celebrations as it has been passed down through generations.';
  } else if (keywords.includes('national')) {
    content.introduction = isKorean
      ? '국가적 자긍심과 역사적 의미가 담긴 이 날은 국민 통합과 애국심을 다지는 중요한 계기가 됩니다.'
      : 'This day, filled with national pride and historical significance, serves as an important opportunity to strengthen national unity and patriotism.';

    content.historical = isKorean
      ? '국가 형성과 발전 과정에서 중요한 전환점이 된 역사적 사건을 기념하며, 이는 현재 국민들의 정체성 형성에 핵심적인 역할을 하고 있습니다.'
      : 'Commemorating historical events that marked important turning points in national formation and development, this plays a key role in shaping current national identity.';
  } else if (keywords.includes('family')) {
    content.introduction = isKorean
      ? '가족의 소중함과 사랑을 되새기는 이 날은 현대 사회에서 점점 더 중요한 의미를 갖게 되었습니다.'
      : 'This day of reflecting on the preciousness and love of family has gained increasingly important meaning in modern society.';

    content.historical = isKorean
      ? '전통적인 가족 중심 문화에서 출발하여 현대적 가족 가치관과 조화를 이루며 발전해온 이 공휴일은 세대 간 소통의 다리 역할을 하고 있습니다.'
      : 'Starting from traditional family-centered culture and evolving in harmony with modern family values, this holiday serves as a bridge for intergenerational communication.';
  } else {
    // 기본 콘텐츠 (general 키워드 포함)
    content.introduction = isKorean
      ? '이 날은 해당 국가의 문화와 전통을 반영하는 의미 있는 공휴일로, 국민들에게 특별한 의미를 가지고 있습니다.'
      : 'This day is a meaningful public holiday reflecting the country\'s culture and traditions, holding special significance for its people.';

    content.historical = isKorean
      ? '오랜 역사와 전통을 바탕으로 형성된 이 공휴일은 시대의 변화와 함께 그 의미와 기념 방식이 발전해왔습니다.'
      : 'This holiday, formed based on long history and tradition, has evolved its meaning and commemoration methods along with the changes of the times.';
  }

  // 공통 콘텐츠 요소들
  content.modern = isKorean
    ? `현대 ${countryName}에서는 이 날을 맞아 다양한 문화 행사와 기념 활동이 전국적으로 펼쳐집니다. 전통적인 의식과 현대적인 축제가 조화롭게 어우러지면서, 모든 세대가 함께 참여할 수 있는 의미 있는 시간을 만들어가고 있습니다.`
    : `In modern ${countryName}, various cultural events and commemorative activities unfold nationwide on this day. Traditional ceremonies harmoniously blend with modern festivals, creating meaningful time for all generations to participate together.`;

  content.cultural = isKorean
    ? `이 공휴일은 ${countryName}의 독특한 문화적 정체성을 보여주는 대표적인 사례로, 국민들의 공동체 의식과 문화적 자긍심을 강화하는 중요한 역할을 담당하고 있습니다.`
    : `This holiday serves as a representative example of ${countryName}'s unique cultural identity, playing an important role in strengthening people's sense of community and cultural pride.`;

  content.economic = isKorean
    ? `경제적 측면에서도 이 공휴일은 관광업, 서비스업, 문화산업 등 다양한 분야에 상당한 파급효과를 가져다주며, 지역 경제 활성화에 기여하고 있습니다.`
    : `From an economic perspective, this holiday brings significant ripple effects to various sectors including tourism, service industries, and cultural industries, contributing to regional economic revitalization.`;

  content.conclusion = isKorean
    ? `결국 이 날은 과거와 현재, 전통과 현대를 잇는 문화적 가교 역할을 하며, ${countryName} 사회의 지속가능한 발전과 문화적 정체성 유지에 중요한 기여를 하고 있습니다.`
    : `Ultimately, this day serves as a cultural bridge connecting past and present, tradition and modernity, making important contributions to ${countryName}'s sustainable development and maintenance of cultural identity.`;

  return content;
}

/**
 * 자연스럽고 사람이 쓴 것 같은 템플릿 기반 콘텐츠 생성 (레거시 함수)
 */
function generateNaturalTemplate(holidayName: string, countryName: string, locale: string): string {
  const isKorean = locale === 'ko';
  const localizedName = isKorean ? getLocalizedHolidayName(holidayName, '', locale) : holidayName;

  if (isKorean) {
    return `${localizedName}은 ${countryName}에서 매년 기념하는 중요한 공휴일입니다. 이 특별한 날은 해당 국가의 역사와 문화적 전통을 반영하며, 국민들에게 깊은 의미를 가지고 있습니다. 단순한 휴일을 넘어서 국가적 정체성과 문화적 가치를 확인하는 소중한 시간으로 여겨지고 있습니다.

이 공휴일은 오랜 역사를 통해 형성되어 왔으며, 시대의 변화와 함께 그 의미와 기념 방식도 조금씩 달라져 왔습니다. 과거의 전통적인 의식과 현대적인 축제 문화가 자연스럽게 어우러지면서, 새로운 세대에게도 지속적으로 전승되고 있는 모습을 보여줍니다.

${countryName} 전역에서는 이 날을 맞아 다양한 기념 행사와 전통 의식이 열립니다. 가족들이 모여 특별한 음식을 나누고, 지역 공동체가 함께 참여하는 축제와 행사들이 개최됩니다. 이러한 활동들은 단순한 오락을 넘어서 문화적 유대감을 강화하고 공동체 의식을 함양하는 중요한 역할을 담당하고 있습니다.

특히 도시와 농촌 지역에서는 각각 다른 방식으로 이 날을 기념합니다. 도시 지역에서는 대규모 문화 행사와 공연이 열리는 반면, 농촌 지역에서는 보다 전통적이고 가족 중심적인 방식으로 기념하는 경우가 많습니다. 이러한 다양성은 ${countryName}의 풍부한 문화적 스펙트럼을 보여주는 좋은 예시라고 할 수 있습니다.

현대 사회에서 ${holidayName}은 단순한 휴일을 넘어 ${countryName} 국민들의 정체성을 확인하고 문화적 유대감을 강화하는 중요한 역할을 합니다. 이 날을 통해 전통과 현대가 조화롭게 어우러지는 모습을 볼 수 있으며, 특히 젊은 세대들에게는 자국의 문화와 역사를 이해하는 소중한 기회가 되고 있습니다.

교육 기관에서는 이 날을 활용하여 다양한 교육 프로그램을 운영하고, 문화 체험 활동을 통해 학생들이 자국의 전통과 역사를 직접 경험할 수 있도록 돕고 있습니다. 이러한 노력들은 문화적 정체성을 다음 세대에게 전승하는 중요한 통로 역할을 하고 있습니다.

또한 ${localizedName}은 ${countryName}의 사회적, 경제적 활동에도 상당한 영향을 미칩니다. 많은 기업과 기관이 휴무를 하며, 관광업계에서는 특별한 프로그램과 이벤트를 준비하여 국내외 방문객들에게 독특한 문화적 경험을 제공합니다. 이러한 활동들은 지역 경제 활성화에도 기여하고 있습니다.

특히 관광 산업에서는 이 시기를 활용하여 전통 문화 체험 프로그램, 특별 전시회, 문화 공연 등을 기획하여 방문객들에게 깊이 있는 문화적 경험을 제공하고 있습니다. 이는 단순한 관광을 넘어서 문화 교류와 상호 이해를 증진시키는 중요한 역할을 하고 있습니다.

미디어와 방송계에서도 이 날을 기념하여 특별 프로그램을 제작하고, 관련 다큐멘터리나 문화 콘텐츠를 통해 국민들의 이해를 높이는 데 기여하고 있습니다. 이러한 다각적인 접근은 ${holidayName}의 의미를 더욱 풍부하게 만들고, 현대 사회에서의 relevance를 유지하는 데 도움을 주고 있습니다.`;
  } else {
    return `${holidayName} is an important public holiday celebrated annually in ${countryName}. This special day reflects the country's history and cultural traditions, holding deep meaning for its people. Beyond being a simple holiday, it serves as a precious time to confirm national identity and cultural values.

This holiday has been shaped through long history, and its meaning and celebration methods have gradually evolved with the changing times. Traditional ceremonies from the past naturally blend with modern festival culture, showing how it continues to be passed down to new generations.

Throughout ${countryName}, various commemorative events and traditional ceremonies are held on this day. Families gather to share special foods, and communities come together for festivals and events. These activities go beyond simple entertainment to play an important role in strengthening cultural bonds and fostering community spirit.

Urban and rural areas celebrate this day in distinctly different ways. While large-scale cultural events and performances are held in urban areas, rural regions often commemorate it in more traditional and family-centered ways. This diversity serves as an excellent example of ${countryName}'s rich cultural spectrum.

Educational institutions utilize this day to operate various educational programs, helping students directly experience their country's traditions and history through cultural activities. These efforts serve as important channels for transmitting cultural identity to the next generation.

In modern society, ${holidayName} goes beyond being just a holiday - it plays a crucial role in confirming the identity of ${countryName}'s people and strengthening cultural bonds. Through this day, we can see how tradition and modernity harmoniously blend together, and it serves as a precious opportunity for younger generations to understand their country's culture and history.

The celebration also involves various social institutions and organizations that contribute to making the day more meaningful. Religious institutions, cultural centers, museums, and libraries often organize special exhibitions, lectures, and cultural programs that deepen public understanding of the holiday's significance.

Furthermore, ${holidayName} has a significant impact on ${countryName}'s social and economic activities. Many businesses and institutions close for the holiday, while the tourism industry prepares special programs and events to provide unique cultural experiences for domestic and international visitors. These activities also contribute to revitalizing local economies.

The tourism industry particularly leverages this period to organize traditional cultural experience programs, special exhibitions, and cultural performances, providing visitors with profound cultural experiences. This goes beyond simple tourism to play an important role in promoting cultural exchange and mutual understanding.

Media and broadcasting sectors also commemorate this day by producing special programs and creating related documentaries or cultural content that contribute to enhancing public understanding. This multifaceted approach helps enrich the meaning of ${holidayName} and maintain its relevance in modern society.`;
  }
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
 * 공휴일 설명을 생성합니다 (다국어 지원)
 */
export async function generateHolidayDescription(request: AIContentRequest, locale: string = 'ko', forceRegenerate: boolean = false): Promise<AIContentResponse> {
  try {
    logInfo(`공휴일 설명 생성 시작: ${request.holidayName} (${request.countryName}) - ${locale}`);

    const { holidayId, holidayName, countryName, existingDescription } = request;

    // 강제 재생성이 아니고 이미 설명이 있으면 그대로 반환
    if (!forceRegenerate && existingDescription && existingDescription.trim().length > 30) {
      logInfo(`기존 설명 사용: ${holidayName}`);
      return {
        holidayId,
        description: existingDescription.trim(),
        confidence: 1.0,
        generatedAt: new Date().toISOString()
      };
    }

    // 국가 코드 추출
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

    // 1. 강제 재생성이 아닌 경우 캐시에서 기존 설명 조회
    if (!forceRegenerate) {
      const cachedDescription = await getCachedDescription(holidayName, countryName, locale);
      if (cachedDescription) {
        logInfo(`캐시에서 설명 조회 성공: ${holidayName}`);
        return {
          holidayId,
          description: cachedDescription.description,
          confidence: cachedDescription.confidence,
          generatedAt: cachedDescription.generatedAt
        };
      }
    }

    // 2. 실시간 AI 생성 시도
    if (forceRegenerate || process.env.ENABLE_AI_GENERATION === 'true') {
      try {
        logInfo(`실시간 AI 생성 시작: ${holidayName}`);
        const aiDescription = await generateAIHolidayDescription(holidayName, countryName, new Date().toISOString(), locale);

        // 캐시에 저장
        await setCachedDescription(holidayId, holidayName, countryName, locale, aiDescription, 0.95);

        logInfo(`실시간 AI 생성 완료: ${holidayName}`);
        return {
          holidayId,
          description: aiDescription,
          confidence: 0.95,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        logWarning(`AI 생성 실패, 폴백 사용: ${holidayName}`, error);
      }
    } else {
      logInfo(`실시간 AI 생성 건너뜀 (캐시 우선): ${holidayName}`);
    }

    // 2. SEO 최적화된 설명 생성 (AI 실패시 폴백)
    const description = generateSEOOptimizedDescription(holidayName, countryName, countryCode, locale);

    // 콘텐츠 품질 검증
    if (!validateContent(description)) {
      logWarning(`콘텐츠 품질 검증 실패, 폴백 사용: ${holidayName}`);
      return generateFallbackDescription(request, locale);
    }

    logInfo(`SEO 최적화 설명 생성 완료: ${holidayName}`);
    return {
      holidayId,
      description,
      confidence: 0.9,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    const aiError = error as Error;
    logApiError('generateHolidayDescription', aiError, {
      holidayId: request.holidayId,
      holidayName: request.holidayName,
      countryName: request.countryName
    });

    return generateFallbackDescription(request, locale);
  }
}

/**
 * 최종 폴백 설명을 생성합니다
 */
function generateFallbackDescription(request: AIContentRequest, locale: string = 'ko'): AIContentResponse {
  logWarning(`기본 폴백 설명 사용: ${request.holidayName} - ${locale}`);

  const localizedName = locale === 'ko' ? getLocalizedHolidayName(request.holidayName, '', locale) : request.holidayName;
  let fallbackDescription: string;

  if (locale === 'en') {
    fallbackDescription = `${localizedName} is a special day celebrated in ${request.countryName}. This holiday provides an opportunity for families to gather and spend meaningful time together, continuing cultural values. It serves as an important day for strengthening community bonds and cultural transmission between generations through unique customs and traditions of each region.`;
  } else {
    fallbackDescription = `${localizedName}은(는) ${request.countryName}에서 기념하는 특별한 날입니다. 이 날에는 전통적인 의식과 함께 가족들이 모여 의미 있는 시간을 보내며, 문화적 가치를 이어가는 소중한 기회가 됩니다. 각 지역의 고유한 관습과 전통을 통해 공동체의 결속을 다지고, 세대 간 문화 전승의 역할을 하는 중요한 날입니다.`;
  }

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
 * 콘텐츠 품질을 검증합니다
 */
export function validateContent(description: string): boolean {
  // 최소 길이 체크
  if (description.length < 30) return false;

  // 최대 길이 체크 (너무 길면 안됨)
  if (description.length > 2000) return false;

  // 기본적인 문장 구조 체크
  const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length < 1 || sentences.length > 20) return false;

  return true;
}