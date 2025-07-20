import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://world-holiday-calendar.com'),
  title: "World Holiday Calendar - 전세계 공휴일 정보",
  description: "전세계 주요 국가의 연도별 공휴일 정보를 제공하는 웹 서비스입니다. 여행 계획과 업무 일정에 도움이 되는 정확한 공휴일 정보를 확인하세요.",
  keywords: "공휴일, 휴일, 국가별 공휴일, 여행, 해외 공휴일",
  openGraph: {
    title: "World Holiday Calendar",
    description: "전세계 공휴일 정보를 한눈에 확인하세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
