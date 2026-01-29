import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko'],
  defaultLocale: 'en',
  localePrefix: 'never',      // URL에 prefix 없음
  localeDetection: true,      // 브라우저 감지 활성화
});