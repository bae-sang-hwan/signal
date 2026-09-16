import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { ko } from './ko';
import { en } from './en';
import { ja } from './ja';

export type AppLanguage = 'ko' | 'en' | 'ja';

export const dictionaries = { ko, en, ja };

export const LANGUAGE_STORAGE_KEY = 'languagePreference';

export function resolveSystemLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  if (code === 'ko' || code === 'en' || code === 'ja') return code;
  return 'en';
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'ko' || value === 'en' || value === 'ja';
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

// 위젯(react-native-android-widget)은 React 컨텍스트 트리 밖에서 렌더링되므로
// 이 헬퍼로 저장된 언어 설정을 직접 읽어 번역한다.
export async function getWidgetTranslation(
  key: string,
  params?: Record<string, string | number>,
): Promise<string> {
  const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language = isAppLanguage(saved) ? saved : resolveSystemLanguage();
  const value = getByPath(dictionaries[language], key);
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
}

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren<object>) {
  // 저장된 선택이 없으면 시스템 언어를 최초 기본값으로 사용한다.
  const [language, setLanguageState] = useState<AppLanguage>('ko');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        setLanguageState(isAppLanguage(saved) ? saved : resolveSystemLanguage());
      })
      .finally(() => setLoaded(true));
  }, []);

  async function setLanguage(lang: AppLanguage) {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }

  const t = useMemo(() => {
    const dict = dictionaries[language];
    return (key: string, params?: Record<string, string | number>) => {
      const value = getByPath(dict, key);
      if (typeof value !== 'string') return key;
      return interpolate(value, params);
    };
  }, [language]);

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
