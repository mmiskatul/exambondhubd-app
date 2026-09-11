import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import portalsReducer from './slices/portalsSlice';
import bookmarksReducer from './slices/bookmarksSlice';
import practiceReducer from './slices/practiceSlice';
import accessReducer from './slices/accessSlice';
import languageReducer from './slices/languageSlice';

/**
 * Screens used to hold everything in local state, so the portal list, the
 * signed-in user and the bookmark set were re-fetched on every navigation and
 * could disagree with each other. They live here now.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    portals: portalsReducer,
    bookmarks: bookmarksReducer,
    practice: practiceReducer,
    access: accessReducer,
    language: languageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
