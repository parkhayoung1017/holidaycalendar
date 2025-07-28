'use client';

import React from 'react';
import ResponsiveBanner from '@/components/ads/ResponsiveBanner';
import { useTranslation } from '@/hooks/useTranslation';
import { formatLocalizedDate } from '@/lib/translation-utils';

export default function Footer() {
  const { t, locale } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container py-8">
        {/* Footer 광고 */}
        <div className="mb-8 flex justify-center">
          <ResponsiveBanner />
        </div>
        
        <div className="text-center text-gray-600">
          <p>{t('footer.copyright', { year: currentYear.toString() })}</p>
          <p className="mt-2 text-sm">
            {t('footer.description')}
          </p>
        </div>
      </div>
    </footer>
  );
}