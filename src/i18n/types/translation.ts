export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface I18nContextValue {
  currentLanguage: string;
  supportedLanguages: Language[];
  changeLanguage: (languageCode: string) => void;
  t: (key: string) => string;
}
