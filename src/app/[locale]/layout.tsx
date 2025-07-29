import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Locale } from '@/types/i18n';
import { I18nProvider } from '@/lib/i18n-context';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { loadTranslationsSync } from '@/lib/translation-loader';
import HreflangTags from '@/components/seo/HreflangTags';
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/seo/StructuredData';
import LanguageUpdater from '@/components/seo/LanguageUpdater';
import SideBanner from '@/components/ads/SideBanner';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

/**
 * 언어별 동적 메타데이터를 생성합니다
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  // 언어 검증
  if (locale !== 'ko' && locale !== 'en') {
    return {};
  }
  
  const validLocale = locale as Locale;
  const translations = loadTranslationsSync(validLocale, 'common');
  const siteData = translations.site || {};
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  
  return {
    title: siteData.title || "World Holiday Calendar",
    description: siteData.description || "Check worldwide holiday information at a glance",
    keywords: siteData.keywords || "holidays, public holidays, national holidays, world holidays",
    alternates: {
      canonical: `${baseUrl}/${validLocale}`,
      languages: {
        'ko': `${baseUrl}/ko`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}/ko`,
      }
    },
    openGraph: {
      title: siteData.title || "World Holiday Calendar",
      description: siteData.description || "Check worldwide holiday information at a glance",
      type: "website",
      url: `${baseUrl}/${validLocale}`,
      locale: validLocale === 'ko' ? 'ko_KR' : 'en_US',
      alternateLocale: validLocale === 'ko' ? 'en_US' : 'ko_KR',
      siteName: siteData.title || "World Holiday Calendar",
    },
    twitter: {
      card: 'summary_large_image',
      title: siteData.title || "World Holiday Calendar",
      description: siteData.description || "Check worldwide holiday information at a glance",
    },
    other: {
      // hreflang 태그를 위한 추가 메타데이터
      'hreflang-ko': `${baseUrl}/ko`,
      'hreflang-en': `${baseUrl}/en`,
      'hreflang-x-default': `${baseUrl}/ko`,
    },
  };
}

export default async function LocaleLayout({ 
  children, 
  params 
}: LocaleLayoutProps) {
  const { locale } = await params;
  
  // 언어 검증
  if (locale !== 'ko' && locale !== 'en') {
    notFound();
  }
  
  const validLocale = locale as Locale;
  
  return (
    <>
      {/* 언어별 html lang 속성 동적 업데이트 */}
      <LanguageUpdater />
      {/* hreflang 태그 추가 */}
      <HreflangTags currentLocale={validLocale} />
      {/* 다국어 지원 구조화된 데이터 */}
      <WebsiteStructuredData locale={validLocale} />
      <OrganizationStructuredData locale={validLocale} />
      
      <I18nProvider initialLocale={validLocale}>
        <Header />
        <main className="flex-1 relative">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          {/* 사이드 배너 - 구글 애드센스와 겹치지 않도록 우측에 고정 배치 */}
          <SideBanner className="hidden lg:block" />
        </main>
        <Footer />
      </I18nProvider>
    </>
  );
}