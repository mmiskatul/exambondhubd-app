import { useCallback } from 'react';
import { useAppSelector } from '../store';
import { selectLanguage } from '../store/slices/languageSlice';
import { strings, type StringKey } from './strings';

export type { Language } from '../store/slices/languageSlice';
export { strings } from './strings';

/**
 * Reading the app in the student's language.
 *
 * `t('key')`            — the app's own text.
 * `pick(obj, 'title')`  — content from the API, which always ships both
 *                         `titleEn` and `titleBn`. The API is deliberately
 *                         language-neutral; the choice happens here.
 */
export function useLang() {
  const language = useAppSelector(selectLanguage);

  const t = useCallback(
    (key: StringKey) => {
      const entry = strings[key];
      if (!entry) return key;
      return language === 'bn' ? entry.bn : entry.en;
    },
    [language],
  );

  const pick = useCallback(
    (row: any, field: string): string => {
      if (!row) return '';

      const bn = row[`${field}Bn`];
      const en = row[`${field}En`];

      // Falls back to the other language rather than showing nothing, so a
      // subject with only an English title still reads.
      if (language === 'bn') return bn || en || row[field] || '';
      return en || bn || row[field] || '';
    },
    [language],
  );

  const isBangla = language === 'bn';

  return { language, isBangla, t, pick };
}
