import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-native';
import { store } from '../store';
import { setLanguageLocal } from '../store/slices/languageSlice';
import { useLang } from './index';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useLang', () => {
  afterEach(() => {
    act(() => {
      store.dispatch(setLanguageLocal('bn'));
    });
  });

  it('picks the Bangla field by default', () => {
    const { result } = renderHook(() => useLang(), { wrapper });

    const text = result.current.pick({ titleEn: 'Physics', titleBn: 'পদার্থবিজ্ঞান' }, 'title');

    expect(text).toBe('পদার্থবিজ্ঞান');
    expect(result.current.isBangla).toBe(true);
  });

  it('picks the English field once the language is switched', () => {
    const { result } = renderHook(() => useLang(), { wrapper });

    act(() => {
      store.dispatch(setLanguageLocal('en'));
    });

    const text = result.current.pick({ titleEn: 'Physics', titleBn: 'পদার্থবিজ্ঞান' }, 'title');

    expect(text).toBe('Physics');
    expect(result.current.isBangla).toBe(false);
  });

  it('falls back to the other language when one field is missing', () => {
    const { result } = renderHook(() => useLang(), { wrapper });

    expect(result.current.pick({ titleEn: 'Physics' }, 'title')).toBe('Physics');
  });

  it('returns an empty string for a missing row instead of throwing', () => {
    const { result } = renderHook(() => useLang(), { wrapper });

    expect(result.current.pick(null, 'title')).toBe('');
  });
});
