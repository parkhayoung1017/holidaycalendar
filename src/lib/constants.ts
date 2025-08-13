// ===== 국가 및 지역 상수 =====

// 지원하는 국가 목록 (수집된 데이터 기반으로 자동 생성됨)
export const SUPPORTED_COUNTRIES = [
  { code: 'AD', name: 'Andorra', region: 'Europe', flag: '🇦🇩' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪' },
  { code: 'AF', name: 'Afghanistan', region: 'Middle East', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', region: 'Europe', flag: '🇦🇱' },
  { code: 'AM', name: 'Armenia', region: 'Asia', flag: '🇦🇲' },
  { code: 'AO', name: 'Angola', region: 'Africa', flag: '🇦🇴' },
  { code: 'AR', name: 'Argentina', region: 'South America', flag: '🇦🇷', popular: true },
  { code: 'AT', name: 'Austria', region: 'Europe', flag: '🇦🇹' },
  { code: 'AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺', popular: true },
  { code: 'AZ', name: 'Azerbaijan', region: 'Asia', flag: '🇦🇿' },
  { code: 'BA', name: 'Bosnia and Herzegovina', region: 'Europe', flag: '🇧🇦' },
  { code: 'BB', name: 'Barbados', region: 'North America', flag: '🇧🇧' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', flag: '🇧🇩' },
  { code: 'BE', name: 'Belgium', region: 'Europe', flag: '🇧🇪' },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', flag: '🇧🇫' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe', flag: '🇧🇬' },
  { code: 'BH', name: 'Bahrain', region: 'Middle East', flag: '🇧🇭' },
  { code: 'BI', name: 'Burundi', region: 'Africa', flag: '🇧🇮' },
  { code: 'BJ', name: 'Benin', region: 'Africa', flag: '🇧🇯' },
  { code: 'BN', name: 'Brunei', region: 'Asia', flag: '🇧🇳' },
  { code: 'BO', name: 'Bolivia', region: 'South America', flag: '🇧🇴' },
  { code: 'BR', name: 'Brazil', region: 'South America', flag: '🇧🇷', popular: true },
  { code: 'BS', name: 'Bahamas', region: 'North America', flag: '🇧🇸' },
  { code: 'BT', name: 'Bhutan', region: 'Asia', flag: '🇧🇹' },
  { code: 'BW', name: 'Botswana', region: 'Africa', flag: '🇧🇼' },
  { code: 'BY', name: 'Belarus', region: 'Europe', flag: '🇧🇾' },
  { code: 'BZ', name: 'Belize', region: 'North America', flag: '🇧🇿' },
  { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦', popular: true },
  { code: 'CD', name: 'Democratic Republic of the Congo', region: 'Africa', flag: '🇨🇩' },
  { code: 'CF', name: 'Central African Republic', region: 'Africa', flag: '🇨🇫' },
  { code: 'CG', name: 'Republic of the Congo', region: 'Africa', flag: '🇨🇬' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭' },
  { code: 'CI', name: 'Ivory Coast', region: 'Africa', flag: '🇨🇮' },
  { code: 'CL', name: 'Chile', region: 'South America', flag: '🇨🇱' },
  { code: 'CM', name: 'Cameroon', region: 'Africa', flag: '🇨🇲' },
  { code: 'CN', name: 'China', region: 'Asia', flag: '🇨🇳', popular: true },
  { code: 'CO', name: 'Colombia', region: 'South America', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', region: 'North America', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', region: 'North America', flag: '🇨🇺' },
  { code: 'CV', name: 'Cape Verde', region: 'Africa', flag: '🇨🇻' },
  { code: 'CY', name: 'Cyprus', region: 'Europe', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', flag: '🇨🇿' },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪', popular: true },
  { code: 'DJ', name: 'Djibouti', region: 'Africa', flag: '🇩🇯' },
  { code: 'DK', name: 'Denmark', region: 'Europe', flag: '🇩🇰' },
  { code: 'DM', name: 'Dominica', region: 'North America', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', region: 'North America', flag: '🇩🇴' },
  { code: 'DZ', name: 'Algeria', region: 'Africa', flag: '🇩🇿' },
  { code: 'EC', name: 'Ecuador', region: 'South America', flag: '🇪🇨' },
  { code: 'EE', name: 'Estonia', region: 'Europe', flag: '🇪🇪' },
  { code: 'EG', name: 'Egypt', region: 'Africa', flag: '🇪🇬', popular: true },
  { code: 'ER', name: 'Eritrea', region: 'Africa', flag: '🇪🇷' },
  { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸', popular: true },
  { code: 'ET', name: 'Ethiopia', region: 'Africa', flag: '🇪🇹' },
  { code: 'FI', name: 'Finland', region: 'Europe', flag: '🇫🇮' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', flag: '🇫🇯' },
  { code: 'FO', name: 'Faroe Islands', region: 'Europe', flag: '🇫🇴' },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷', popular: true },
  { code: 'GA', name: 'Gabon', region: 'Africa', flag: '🇬🇦' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧', popular: true },
  { code: 'GD', name: 'Grenada', region: 'North America', flag: '🇬🇩' },
  { code: 'GE', name: 'Georgia', region: 'Asia', flag: '🇬🇪' },
  { code: 'GG', name: 'Guernsey', region: 'Europe', flag: '🇬🇬' },
  { code: 'GH', name: 'Ghana', region: 'Africa', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', region: 'Europe', flag: '🇬🇮' },
  { code: 'GL', name: 'Greenland', region: 'Europe', flag: '🇬🇱' },
  { code: 'GM', name: 'Gambia', region: 'Africa', flag: '🇬🇲' },
  { code: 'GN', name: 'Guinea', region: 'Africa', flag: '🇬🇳' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa', flag: '🇬🇶' },
  { code: 'GR', name: 'Greece', region: 'Europe', flag: '🇬🇷' },
  { code: 'GT', name: 'Guatemala', region: 'North America', flag: '🇬🇹' },
  { code: 'GU', name: 'Guam', region: 'North America', flag: '🇬🇺' },
  { code: 'GW', name: 'Guinea-Bissau', region: 'Africa', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', region: 'South America', flag: '🇬🇾' },
  { code: 'HK', name: 'Hong Kong', region: 'Asia', flag: '🇭🇰' },
  { code: 'HN', name: 'Honduras', region: 'North America', flag: '🇭🇳' },
  { code: 'HR', name: 'Croatia', region: 'Europe', flag: '🇭🇷' },
  { code: 'HT', name: 'Haiti', region: 'North America', flag: '🇭🇹' },
  { code: 'HU', name: 'Hungary', region: 'Europe', flag: '🇭🇺' },
  { code: 'ID', name: 'Indonesia', region: 'Asia', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', region: 'Middle East', flag: '🇮🇱' },
  { code: 'IM', name: 'Isle of Man', region: 'Europe', flag: '🇮🇲' },
  { code: 'IN', name: 'India', region: 'Asia', flag: '🇮🇳', popular: true },
  { code: 'IQ', name: 'Iraq', region: 'Middle East', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', region: 'Middle East', flag: '🇮🇷' },
  { code: 'IS', name: 'Iceland', region: 'Europe', flag: '🇮🇸' },
  { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹', popular: true },
  { code: 'JE', name: 'Jersey', region: 'Europe', flag: '🇯🇪' },
  { code: 'JM', name: 'Jamaica', region: 'North America', flag: '🇯🇲' },
  { code: 'JO', name: 'Jordan', region: 'Middle East', flag: '🇯🇴' },
  { code: 'JP', name: 'Japan', region: 'Asia', flag: '🇯🇵', popular: true },
  { code: 'KE', name: 'Kenya', region: 'Africa', flag: '🇰🇪' },
  { code: 'KG', name: 'Kyrgyzstan', region: 'Asia', flag: '🇰🇬' },
  { code: 'KH', name: 'Cambodia', region: 'Asia', flag: '🇰🇭' },
  { code: 'KI', name: 'Kiribati', region: 'Oceania', flag: '🇰🇮' },
  { code: 'KM', name: 'Comoros', region: 'Africa', flag: '🇰🇲' },
  { code: 'KN', name: 'Saint Kitts and Nevis', region: 'North America', flag: '🇰🇳' },
  { code: 'KR', name: 'South Korea', region: 'Asia', flag: '🇰🇷', popular: true },
  { code: 'KW', name: 'Kuwait', region: 'Middle East', flag: '🇰🇼' },
  { code: 'KY', name: 'Cayman Islands', region: 'North America', flag: '🇰🇾' },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia', flag: '🇰🇿' },
  { code: 'LA', name: 'Laos', region: 'Asia', flag: '🇱🇦' },
  { code: 'LB', name: 'Lebanon', region: 'Middle East', flag: '🇱🇧' },
  { code: 'LC', name: 'Saint Lucia', region: 'North America', flag: '🇱🇨' },
  { code: 'LI', name: 'Liechtenstein', region: 'Europe', flag: '🇱🇮' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', flag: '🇱🇰' },
  { code: 'LR', name: 'Liberia', region: 'Africa', flag: '🇱🇷' },
  { code: 'LS', name: 'Lesotho', region: 'Africa', flag: '🇱🇸' },
  { code: 'LT', name: 'Lithuania', region: 'Europe', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe', flag: '🇱🇺' },
  { code: 'LV', name: 'Latvia', region: 'Europe', flag: '🇱🇻' },
  { code: 'LY', name: 'Libya', region: 'Africa', flag: '🇱🇾' },
  { code: 'MA', name: 'Morocco', region: 'Africa', flag: '🇲🇦' },
  { code: 'MC', name: 'Monaco', region: 'Europe', flag: '🇲🇨' },
  { code: 'MD', name: 'Moldova', region: 'Europe', flag: '🇲🇩' },
  { code: 'ME', name: 'Montenegro', region: 'Europe', flag: '🇲🇪' },
  { code: 'MG', name: 'Madagascar', region: 'Africa', flag: '🇲🇬' },
  { code: 'MH', name: 'Marshall Islands', region: 'Oceania', flag: '🇲🇭' },
  { code: 'MK', name: 'North Macedonia', region: 'Europe', flag: '🇲🇰' },
  { code: 'ML', name: 'Mali', region: 'Africa', flag: '🇲🇱' },
  { code: 'MM', name: 'Myanmar', region: 'Asia', flag: '🇲🇲' },
  { code: 'MN', name: 'Mongolia', region: 'Asia', flag: '🇲🇳' },
  { code: 'MO', name: 'Macau', region: 'Asia', flag: '🇲🇴' },
  { code: 'MR', name: 'Mauritania', region: 'Africa', flag: '🇲🇷' },
  { code: 'MS', name: 'Montserrat', region: 'North America', flag: '🇲🇸' },
  { code: 'MT', name: 'Malta', region: 'Europe', flag: '🇲🇹' },
  { code: 'MU', name: 'Mauritius', region: 'Africa', flag: '🇲🇺' },
  { code: 'MV', name: 'Maldives', region: 'Africa', flag: '🇲🇻' },
  { code: 'MW', name: 'Malawi', region: 'Africa', flag: '🇲🇼' },
  { code: 'MX', name: 'Mexico', region: 'North America', flag: '🇲🇽', popular: true },
  { code: 'MY', name: 'Malaysia', region: 'Asia', flag: '🇲🇾' },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia', region: 'Africa', flag: '🇳🇦' },
  { code: 'NC', name: 'New Caledonia', region: 'Oceania', flag: '🇳🇨' },
  { code: 'NE', name: 'Niger', region: 'Africa', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', flag: '🇳🇬' },
  { code: 'NI', name: 'Nicaragua', region: 'North America', flag: '🇳🇮' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱', popular: true },
  { code: 'NO', name: 'Norway', region: 'Europe', flag: '🇳🇴' },
  { code: 'NP', name: 'Nepal', region: 'Asia', flag: '🇳🇵' },
  { code: 'NR', name: 'Nauru', region: 'Oceania', flag: '🇳🇷' },
  { code: 'NU', name: 'Niue', region: 'Oceania', flag: '🇳🇺' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', flag: '🇳🇿', popular: true },
  { code: 'OM', name: 'Oman', region: 'Middle East', flag: '🇴🇲' },
  { code: 'PA', name: 'Panama', region: 'North America', flag: '🇵🇦' },
  { code: 'PE', name: 'Peru', region: 'South America', flag: '🇵🇪' },
  { code: 'PF', name: 'French Polynesia', region: 'Oceania', flag: '🇵🇫' },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania', flag: '🇵🇬' },
  { code: 'PH', name: 'Philippines', region: 'Asia', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', region: 'Asia', flag: '🇵🇰' },
  { code: 'PL', name: 'Poland', region: 'Europe', flag: '🇵🇱' },
  { code: 'PR', name: 'Puerto Rico', region: 'North America', flag: '🇵🇷' },
  { code: 'PS', name: 'Palestine', region: 'Middle East', flag: '🇵🇸' },
  { code: 'PT', name: 'Portugal', region: 'Europe', flag: '🇵🇹' },
  { code: 'PW', name: 'Palau', region: 'Oceania', flag: '🇵🇼' },
  { code: 'PY', name: 'Paraguay', region: 'South America', flag: '🇵🇾' },
  { code: 'QA', name: 'Qatar', region: 'Middle East', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', region: 'Europe', flag: '🇷🇴' },
  { code: 'RS', name: 'Serbia', region: 'Europe', flag: '🇷🇸' },
  { code: 'RU', name: 'Russia', region: 'Europe', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', region: 'Africa', flag: '🇷🇼' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania', flag: '🇸🇧' },
  { code: 'SC', name: 'Seychelles', region: 'Africa', flag: '🇸🇨' },
  { code: 'SD', name: 'Sudan', region: 'Africa', flag: '🇸🇩' },
  { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', region: 'Asia', flag: '🇸🇬', popular: true },
  { code: 'SH', name: 'Saint Helena', region: 'Africa', flag: '🇸🇭' },
  { code: 'SI', name: 'Slovenia', region: 'Europe', flag: '🇸🇮' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', region: 'Europe', flag: '🇸🇯' },
  { code: 'SK', name: 'Slovakia', region: 'Europe', flag: '🇸🇰' },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', flag: '🇸🇱' },
  { code: 'SM', name: 'San Marino', region: 'Europe', flag: '🇸🇲' },
  { code: 'SN', name: 'Senegal', region: 'Africa', flag: '🇸🇳' },
  { code: 'SO', name: 'Somalia', region: 'Africa', flag: '🇸🇴' },
  { code: 'SR', name: 'Suriname', region: 'South America', flag: '🇸🇷' },
  { code: 'SS', name: 'South Sudan', region: 'Africa', flag: '🇸🇸' },
  { code: 'ST', name: 'São Tomé and Príncipe', region: 'Africa', flag: '🇸🇹' },
  { code: 'SV', name: 'El Salvador', region: 'North America', flag: '🇸🇻' },
  { code: 'SX', name: 'Sint Maarten', region: 'North America', flag: '🇸🇽' },
  { code: 'SY', name: 'Syria', region: 'Middle East', flag: '🇸🇾' },
  { code: 'SZ', name: 'Eswatini', region: 'Africa', flag: '🇸🇿' },
  { code: 'TC', name: 'Turks and Caicos Islands', region: 'North America', flag: '🇹🇨' },
  { code: 'TD', name: 'Chad', region: 'Africa', flag: '🇹🇩' },
  { code: 'TG', name: 'Togo', region: 'Africa', flag: '🇹🇬' },
  { code: 'TH', name: 'Thailand', region: 'Asia', flag: '🇹🇭' },
  { code: 'TJ', name: 'Tajikistan', region: 'Asia', flag: '🇹🇯' },
  { code: 'TL', name: 'East Timor', region: 'Asia', flag: '🇹🇱' },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia', flag: '🇹🇲' },
  { code: 'TN', name: 'Tunisia', region: 'Africa', flag: '🇹🇳' },
  { code: 'TO', name: 'Tonga', region: 'Oceania', flag: '🇹🇴' },
  { code: 'TR', name: 'Turkey', region: 'Middle East', flag: '🇹🇷' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'North America', flag: '🇹🇹' },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania', flag: '🇹🇻' },
  { code: 'TW', name: 'Taiwan', region: 'Asia', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', flag: '🇹🇿' },
  { code: 'UA', name: 'Ukraine', region: 'Europe', flag: '🇺🇦' },
  { code: 'UG', name: 'Uganda', region: 'Africa', flag: '🇺🇬' },
  { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸', popular: true },
  { code: 'UY', name: 'Uruguay', region: 'South America', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', region: 'Asia', flag: '🇺🇿' },
  { code: 'VA', name: 'Vatican City', region: 'Europe', flag: '🇻🇦' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', region: 'North America', flag: '🇻🇨' },
  { code: 'VE', name: 'Venezuela', region: 'South America', flag: '🇻🇪' },
  { code: 'VG', name: 'British Virgin Islands', region: 'North America', flag: '🇻🇬' },
  { code: 'VI', name: 'U.S. Virgin Islands', region: 'North America', flag: '🇻🇮' },
  { code: 'VN', name: 'Vietnam', region: 'Asia', flag: '🇻🇳' },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', flag: '🇻🇺' },
  { code: 'WF', name: 'Wallis and Futuna', region: 'Oceania', flag: '🇼🇫' },
  { code: 'WS', name: 'Samoa', region: 'Oceania', flag: '🇼🇸' },
  { code: 'YE', name: 'Yemen', region: 'Middle East', flag: '🇾🇪' },
  { code: 'ZA', name: 'South Africa', region: 'Africa', flag: '🇿🇦', popular: true },
  { code: 'ZM', name: 'Zambia', region: 'Africa', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', flag: '🇿🇼' }
] as const;

// 지역 목록 (수집된 데이터 기반으로 자동 생성됨)
export const REGIONS = [
  { 
    name: 'Asia', 
    displayName: '아시아', 
    countries: ['AM', 'AZ', 'BD', 'BN', 'BT', 'CN', 'GE', 'HK', 'ID', 'IN', 'JP', 'KG', 'KH', 'KR', 'KZ', 'LA', 'LK', 'MM', 'MN', 'MO', 'MY', 'NP', 'PH', 'PK', 'SG', 'TH', 'TJ', 'TL', 'TM', 'TW', 'UZ', 'VN'],
    displayOrder: 1
  },
  { 
    name: 'Europe', 
    displayName: '유럽', 
    countries: ['AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GL', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'UA', 'VA'],
    displayOrder: 2
  },
  { 
    name: 'North America', 
    displayName: '북미', 
    countries: ['BB', 'BS', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'GD', 'GT', 'GU', 'HN', 'HT', 'JM', 'KN', 'KY', 'LC', 'MS', 'MX', 'NI', 'PA', 'PR', 'SV', 'SX', 'TC', 'TT', 'US', 'VC', 'VG', 'VI'],
    displayOrder: 3
  },
  { 
    name: 'South America', 
    displayName: '남미', 
    countries: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'],
    displayOrder: 4
  },
  { 
    name: 'Oceania', 
    displayName: '오세아니아', 
    countries: ['AU', 'FJ', 'KI', 'MH', 'NC', 'NR', 'NU', 'NZ', 'PF', 'PG', 'PW', 'SB', 'TO', 'TV', 'VU', 'WF', 'WS'],
    displayOrder: 5
  },
  { 
    name: 'Africa', 
    displayName: '아프리카', 
    countries: ['AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EG', 'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG', 'ML', 'MR', 'MU', 'MV', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SC', 'SD', 'SH', 'SL', 'SN', 'SO', 'SS', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'ZA', 'ZM', 'ZW'],
    displayOrder: 6
  },
  { 
    name: 'Middle East', 
    displayName: '중동', 
    countries: ['AE', 'AF', 'BH', 'IL', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'YE'],
    displayOrder: 7
  }
] as const;

// 인기 국가 (홈페이지 바로가기용)
export const POPULAR_COUNTRIES = SUPPORTED_COUNTRIES.filter(country => country.popular);

// ===== 날짜 및 시간 상수 =====

// 현재 연도와 지원 연도 범위 (2020-2030년까지 확장)
export const CURRENT_YEAR = new Date().getFullYear();
export const SUPPORTED_YEARS = Array.from(
  { length: 11 }, 
  (_, i) => 2020 + i
); // 2020부터 2030년까지

// 월 이름 (다국어 지원)
export const MONTH_NAMES = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 
       'July', 'August', 'September', 'October', 'November', 'December']
} as const;

// 요일 이름
export const DAY_NAMES = {
  ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
} as const;

// ===== API 관련 상수 =====

// API 엔드포인트
export const API_ENDPOINTS = {
  HOLIDAY_API: process.env.HOLIDAY_API_BASE_URL || 'https://calendarific.com/api/v2',
  NAGER_DATE_API: 'https://date.nager.at/api/v3',
  OPENAI_API: 'https://api.openai.com/v1'
} as const;

// API 설정
export const API_CONFIG = {
  RATE_LIMIT: {
    HOLIDAY_API: 1000, // requests per month
    OPENAI_API: 60,    // requests per minute
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ===== 공휴일 타입 상수 =====

// 공휴일 타입 정의
export const HOLIDAY_TYPES = {
  PUBLIC: 'public',
  BANK: 'bank', 
  SCHOOL: 'school',
  OPTIONAL: 'optional'
} as const;

// 공휴일 타입 표시명
export const HOLIDAY_TYPE_LABELS = {
  [HOLIDAY_TYPES.PUBLIC]: '공휴일',
  [HOLIDAY_TYPES.BANK]: '은행휴무일',
  [HOLIDAY_TYPES.SCHOOL]: '학교휴무일',
  [HOLIDAY_TYPES.OPTIONAL]: '선택휴무일'
} as const;

// ===== 캐시 관련 상수 =====

// 캐시 TTL (Time To Live) 설정
export const CACHE_TTL = {
  HOLIDAY_DATA: 24 * 60 * 60 * 1000, // 24 hours
  COUNTRY_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  AI_CONTENT: 30 * 24 * 60 * 60 * 1000, // 30 days
  TODAY_HOLIDAYS: 60 * 60 * 1000, // 1 hour
} as const;

// ===== SEO 관련 상수 =====

// 기본 메타데이터
export const DEFAULT_METADATA = {
  TITLE: 'Global Holidays - 전세계 공휴일 정보',
  DESCRIPTION: '전세계 주요 국가의 공휴일 정보를 한눈에 확인하세요. 여행 계획과 업무 일정에 도움이 되는 정확한 공휴일 데이터를 제공합니다.',
  KEYWORDS: ['공휴일', '휴일', '여행', '해외여행', '국가별공휴일', 'holiday', 'vacation', 'travel', 'global holidays'],
  OG_IMAGE: '/og-image.png',
  SITE_NAME: 'Global Holidays'
} as const;

// URL 패턴
export const URL_PATTERNS = {
  HOME: '/',
  COUNTRY_YEAR: '/[country]-[year]',
  REGION: '/regions/[region]/[year]',
  TODAY: '/today',
  HOLIDAY_DETAIL: '/holiday/[country]/[slug]'
} as const;

// ===== 에러 메시지 상수 =====

export const ERROR_MESSAGES = {
  API_ERROR: 'API 요청 중 오류가 발생했습니다.',
  DATA_NOT_FOUND: '요청하신 데이터를 찾을 수 없습니다.',
  INVALID_COUNTRY: '지원하지 않는 국가입니다.',
  INVALID_YEAR: '지원하지 않는 연도입니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  RATE_LIMIT_EXCEEDED: 'API 요청 한도를 초과했습니다.',
  AI_GENERATION_FAILED: 'AI 콘텐츠 생성에 실패했습니다.'
} as const;

// ===== 기본 설정 상수 =====

// 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

// 검색 설정
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300 // milliseconds
} as const;

// 빌드 설정
export const BUILD_CONFIG = {
  STATIC_GENERATION: true,
  INCREMENTAL_REGENERATION: true,
  REVALIDATE_INTERVAL: 3600 // 1 hour in seconds
} as const;

// ===== 유틸리티 상수 =====

// 정규표현식 패턴
export const REGEX_PATTERNS = {
  COUNTRY_CODE: /^[A-Z]{2}$/,
  YEAR: /^\d{4}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  SLUG: /^[a-z0-9-]+$/
} as const;

// 날짜 포맷
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'YYYY년 MM월 DD일',
  SHORT: 'MM/DD',
  LONG: 'YYYY년 MM월 DD일 (dddd)'
} as const;