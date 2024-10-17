import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en_us from "../shared/locales/en_us/translation.json";
import en_gb from "../shared/locales/en_gb/translation.json";

export const supportedLanguages = {
  "en-US": {
    title: "English (United States)",
    translation: en_us
  },
  "en-GB": {
    title: "English (United Kingdom)",
    translation: en_gb
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: supportedLanguages,
    fallbackLng: "en-US",
    debug: import.meta.env.VITE_ENABLE_I18N_DEBUG_MODE == "true",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
