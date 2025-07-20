import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // 정적 사이트 생성 최적화 (환경변수로 제어)
  output: process.env.BUILD_MODE === 'export' ? 'export' : undefined,
  distDir: process.env.BUILD_MODE === 'export' ? 'out' : '.next',
  
  // SEO 최적화 설정
  trailingSlash: false,
  generateEtags: true,
  poweredByHeader: false,
  compress: true,
  
  // 이미지 최적화 설정
  images: {
    unoptimized: process.env.BUILD_MODE === 'export', // 정적 export일 때만 비활성화
    domains: ['world-holiday-calendar.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 환경변수 설정
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://world-holiday-calendar.com',
  },
  
  // 빌드 최적화
  experimental: {
    optimizePackageImports: ['date-fns'],
  },
  
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
