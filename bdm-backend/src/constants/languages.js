
// ============================================
// FILE: src/constants/languages.js
// ============================================

const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  PT: 'pt',
  RU: 'ru',
  ZH: 'zh',
  JA: 'ja',
  KO: 'ko',
  AR: 'ar',
  HI: 'hi'
};

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi'
};

const isValidLanguage = (lang) => {
  return Object.values(LANGUAGES).includes(lang);
};

module.exports = {
  LANGUAGES,
  LANGUAGE_NAMES,
  isValidLanguage
};