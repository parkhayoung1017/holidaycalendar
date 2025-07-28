// 다국어 지원을 위한 타입 정의

export type Locale = 'ko' | 'en';

export interface TranslationNamespace {
  common: any;
  navigation: any;
  holidays: any;
  countries: any;
}

export type TranslationKey = keyof TranslationNamespace;

export interface TranslationHook {
  t: (key: string, params?: Record<string, string>) => string;
  locale: Locale;
  locales: Locale[];
}

export interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Partial<TranslationNamespace>;
  isLoading: boolean;
}

export interface TranslationParams {
  [key: string]: string | number;
}

export interface TranslationOptions {
  fallback?: string;
  params?: TranslationParams;
}