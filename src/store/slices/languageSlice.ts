import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'bn' | 'en';

const KEY = 'app_language';

interface LanguageState {
  language: Language;
  loaded: boolean;
}

// Bangla first: the students this is built for read Bangla by default.
const initialState: LanguageState = { language: 'bn', loaded: false };

export const restoreLanguage = createAsyncThunk('language/restore', async () => {
  const stored = await AsyncStorage.getItem(KEY);
  return stored === 'en' || stored === 'bn' ? (stored as Language) : 'bn';
});

export const setLanguage = createAsyncThunk('language/set', async (language: Language) => {
  await AsyncStorage.setItem(KEY, language);
  return language;
});

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguageLocal: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
        state.loaded = true;
      })
      .addCase(restoreLanguage.rejected, (state) => {
        state.loaded = true;
      })
      .addCase(setLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
      });
  },
});

export const { setLanguageLocal } = languageSlice.actions;
export default languageSlice.reducer;

export const selectLanguage = (s: { language: LanguageState }) => s.language.language;
