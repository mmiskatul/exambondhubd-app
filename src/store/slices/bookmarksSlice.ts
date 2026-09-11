import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mobileApi } from '../../services/api';
import { signOut } from './authSlice';

interface BookmarksState {
  items: any[];
  /** Question ids, so any screen can show the correct bookmark icon. */
  ids: string[];
  loaded: boolean;
  loading: boolean;
  pending: string[];
}

const initialState: BookmarksState = {
  items: [],
  ids: [],
  loaded: false,
  loading: false,
  pending: [],
};

export const fetchBookmarks = createAsyncThunk(
  'bookmarks/fetch',
  async (_, { rejectWithValue }) => {
    const res = await mobileApi('/bookmarks');
    if (!res.success) return rejectWithValue(res.message || 'Could not load bookmarks.');
    return Array.isArray(res.data) ? res.data : [];
  },
);

/**
 * Toggling used to be faked on the paper screen — it toasted "Bookmarked" and
 * never called the API. This actually persists it and keeps every screen's
 * icon in step.
 */
export const toggleBookmark = createAsyncThunk(
  'bookmarks/toggle',
  async (questionId: string, { rejectWithValue, dispatch }) => {
    const res = await mobileApi('/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ questionId }),
    });

    if (!res.success) return rejectWithValue(res.message || 'Could not update the bookmark.');

    // The list is small; refetching keeps it authoritative.
    dispatch(fetchBookmarks());
    return { questionId, data: res.data };
  },
);

export const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload;
        state.ids = action.payload.map((b: any) => b.questionId || b.question?.id).filter(Boolean);
      })
      .addCase(fetchBookmarks.rejected, (state) => {
        state.loading = false;
      })

      .addCase(toggleBookmark.pending, (state, action) => {
        const id = action.meta.arg;
        state.pending.push(id);
        // Optimistic, so the icon responds immediately.
        state.ids = state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id];
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        state.pending = state.pending.filter((x) => x !== action.payload.questionId);
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        const id = action.meta.arg;
        state.pending = state.pending.filter((x) => x !== id);
        // Put it back the way it was.
        state.ids = state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id];
      })

      // Signing out must not leave one student's saved questions on screen
      // for the next person to sign in on this device.
      .addCase(signOut.fulfilled, () => initialState);
  },
});

export default bookmarksSlice.reducer;

export const selectIsBookmarked = (questionId: string) => (s: { bookmarks: BookmarksState }) =>
  s.bookmarks.ids.includes(questionId);
