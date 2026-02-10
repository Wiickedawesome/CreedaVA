import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    supportedLngs: ['en', 'es'],
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

// Sync HTML lang attribute with the resolved language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})
// Set initial lang attribute
if (i18n.language) {
  document.documentElement.lang = i18n.language
}

export default i18n
