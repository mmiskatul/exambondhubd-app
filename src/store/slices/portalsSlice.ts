import { createSelector, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mobileApi } from '../../services/api';

export interface PortalUnit {
  id: string;
  key: string;
  titleEn: string;
  titleBn: string;
  badge?: string | null;
  questionCount?: number;
}

export interface Portal {
  key: string;
  title: string;
  bn: string;
  icon?: string;
  badge?: string;
  color?: string;
  isEnabled?: boolean;
  units?: PortalUnit[];
  hasUnits?: boolean;
}

interface PortalsState {
  university: Portal[];
  jobs: Portal[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PortalsState = {
  university: [],
  jobs: [],
  loaded: false,
  loading: false,
  error: null,
};

/**
 * The home screen and every portal screen need this list. Fetching it once into
 * the store means unit labels are available instantly on later screens instead
 * of each one asking again.
 */
export const fetchPortals = createAsyncThunk('portals/fetch', async (_, { rejectWithValue }) => {
  const res = await mobileApi('/categories/portals');
  if (!res.success) return rejectWithValue(res.message || 'Could not load exam portals.');
  return res.data;
});

export const portalsSlice = createSlice({
  name: 'portals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortals.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.university = action.payload.university || [];
        state.jobs = action.payload.jobs || [];
      })
      .addCase(fetchPortals.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not load exam portals.';
      });
  },
});

export default portalsSlice.reducer;

/** Every enabled portal, both groups, in one list. */
/**
 * Memoized: spreading the two lists builds a new array on every call, which
 * react-redux sees as changed state and re-renders for, warning as it goes.
 */
export const selectAllPortals = createSelector(
  [
    (s: { portals: PortalsState }) => s.portals.university,
    (s: { portals: PortalsState }) => s.portals.jobs,
  ],
  (university, jobs) => [...university, ...jobs],
);

export const selectPortalByKey = (key: string) => (s: { portals: PortalsState }) =>
  selectAllPortals(s).find((p) => p.key === key) || null;
