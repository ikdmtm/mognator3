import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { ja } from './translations/ja';
import { en } from './translations/en';

const LOCALE_STORAGE_KEY = 'app_locale';

export type Locale = 'ja' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  ja: ja as Record<string, string>,
  en: en as Record<string, string>,
};

/** 端末が日本語なら ja、それ以外は en */
function getDeviceLocale(): Locale {
  const deviceLocales = Localization.getLocales();
  const preferred = deviceLocales?.[0]?.languageCode?.slice(0, 2);
  if (preferred === 'ja') return 'ja';
  return 'en';
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return Object.keys(params).reduce(
    (acc, key) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), params[key] ?? ''),
    template
  );
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getDeviceLocale());

  // 保存済みの言語を読み込み（未設定なら端末に従う）
  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
      if (stored === 'ja' || stored === 'en') {
        setLocaleState(stored);
      }
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const dict = translations[locale];
      const fallback = locale === 'en' ? (ja as Record<string, string>) : (en as Record<string, string>);
      const raw = dict[key] ?? fallback[key] ?? key;
      return interpolate(raw, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
