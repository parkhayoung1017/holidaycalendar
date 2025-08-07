import { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: '어드민 관리자 페이지',
  description: '공휴일 설명 관리 시스템',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  other: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 보안 헤더 설정
  const headersList = headers();
  
  return (
    <>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="no-referrer" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" />
      </head>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  );
}