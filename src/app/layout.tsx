import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { loadTranslationsSync } from "@/lib/translation-loader";
import { Locale } from "@/types/i18n";
import { headers } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 언어별 메타데이터를 생성합니다
 * @param locale 언어 코드
 * @returns 메타데이터 객체
 */
function generateMetadataForLocale(locale: Locale): Metadata {
  const translations = loadTranslationsSync(locale, 'common');
  const siteData = translations.site || {};
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  
  return {
    metadataBase: new URL(baseUrl),
    title: siteData.title || "World Holiday Calendar",
    description: siteData.description || "Check worldwide holiday information at a glance",
    keywords: siteData.keywords || "holidays, public holidays, national holidays, world holidays",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'ko': `${baseUrl}/ko`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}/ko`, // 기본 언어를 한국어로 설정
      }
    },
    icons: {
      icon: [
        {
          url: '/icon.svg',
          type: 'image/svg+xml',
        },
        {
          url: '/calendar-icon.svg',
          type: 'image/svg+xml',
          sizes: '512x512',
        }
      ],
      shortcut: '/calendar-icon.svg',
      apple: '/calendar-icon.svg',
    },
    openGraph: {
      title: siteData.title || "World Holiday Calendar",
      description: siteData.description || "Check worldwide holiday information at a glance",
      type: "website",
      url: `${baseUrl}/${locale}`,
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      alternateLocale: locale === 'ko' ? 'en_US' : 'ko_KR',
      siteName: siteData.title || "World Holiday Calendar",
    },
    twitter: {
      card: 'summary_large_image',
      title: siteData.title || "World Holiday Calendar",
      description: siteData.description || "Check worldwide holiday information at a glance",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// 기본 메타데이터 (한국어)
export const metadata: Metadata = generateMetadataForLocale('ko');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9099299007950279" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9099299007950279"
          crossOrigin="anonymous"
        />
        {/* Google Analytics (gtag.js) */}
        <script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-LD1TMF47X6"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LD1TMF47X6');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
