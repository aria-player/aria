import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en_us from "../shared/locales/en_us/translation.json";
import en_gb from "../shared/locales/en_gb/translation.json";

const resources = {
  "en-US": {
    translation: en_us
  },
  "en-GB": {
    translation: en_gb
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en-US",
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
