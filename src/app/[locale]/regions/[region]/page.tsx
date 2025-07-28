import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CURRENT_YEAR } from '@/lib/constants';

interface PageProps {
  params: {
    locale: string;
    region: string;
  };
}

// 지역별 국가 매핑
const REGION_COUNTRIES: Record<string, string[]> = {
  'asia': ['KR', 'JP', 'CN', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN'],
  'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'],
  'north-america': ['US', 'CA', 'MX'],
  'south-america': ['BR', 'AR', 'CL', 'CO', 'PE'],
  'africa': ['ZA', 'NG', 'EG'],
  'oceania': ['AU', 'NZ']
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