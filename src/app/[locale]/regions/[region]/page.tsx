import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CURRENT_YEAR } from '@/lib/constants';

interface PageProps {
  params: {
    locale: string;
    region: string;
  };
}

// 지역별 국가 매핑 (확장된 버전)
const REGION_COUNTRIES: Record<string, string[]> = {
  'asia': ['KR', 'JP', 'CN', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN', 'TW', 'HK', 'MO', 'BD', 'LK', 'MM', 'KH', 'LA', 'BN', 'MN'],
  'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'PT', 'GR', 'IE', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY', 'IS', 'ME', 'RS', 'BA', 'MK', 'AL', 'MD', 'UA', 'BY', 'RU'],
  'middle-east': ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'IR', 'IL', 'PS', 'TR', 'YE'],
  'north-america': ['US', 'CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', 'CU', 'JM', 'HT', 'DO', 'TT', 'BB', 'GD', 'LC', 'VC', 'AG', 'DM', 'KN', 'BS', 'PR'],
  'south-america': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'GY', 'SR', 'GF'],
  'africa': ['ZA', 'NG', 'EG', 'KE', 'GH', 'TZ', 'UG', 'ZW', 'ZM', 'MW', 'MZ', 'BW', 'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'ET', 'SO', 'DJ', 'ER', 'SD', 'SS', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ST', 'CV', 'GW', 'GN', 'SL', 'LR', 'CI', 'BF', 'ML', 'NE', 'SN', 'GM', 'MR', 'MA', 'DZ', 'TN', 'LY'],
  'oceania': ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF', 'WS', 'TO', 'KI', 'NR', 'PW', 'FM', 'MH', 'TV', 'CK', 'NU', 'TK']
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  
  // 지역이 유효하지 않으면 404
  if (!REGION_COUNTRIES[resolvedParams.region]) {
    return { title: 'Not Found' };
  }
  
  return {
    title: 'Redirecting...',
    description: 'Redirecting to current year page'
  };
}

export default async function RegionPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // 지역이 유효하지 않으면 404
  if (!REGION_COUNTRIES[resolvedParams.region]) {
    notFound();
  }
  
  // 현재 연도 페이지로 리다이렉트
  redirect(`/${resolvedParams.locale}/regions/${resolvedParams.region}/${CURRENT_YEAR}`);
}