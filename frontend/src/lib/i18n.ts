import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from '@/locales/en/common.json';
import authEN from '@/locales/en/auth.json';
import errorsEN from '@/locales/en/errors.json';
import homeEN from '@/locales/en/home.json';
import commonES from '@/locales/es/common.json';
import authES from '@/locales/es/auth.json';
import errorsES from '@/locales/es/errors.json';
import homeES from '@/locales/es/home.json';

// the translations
const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    errors: errorsEN,
    home: homeEN,
  },
  es: {
    common: commonES,
    auth: authES,
    errors: errorsES,
    home: homeES,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Options for language detection
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    // Namespace configuration
    ns: ['common', 'auth', 'errors', 'home'],
    defaultNS: 'common',
  });

export default i18n;