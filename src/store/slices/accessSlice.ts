import { createSelector, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mobileApi } from '../../services/api';
import { signOut } from './authSlice';

export interface AccessState {
  loaded: boolean;
  loading: boolean;
  hasActiveSubscription: boolean;
  /** A package with no scopes unlocks everything. */
  platformWide: boolean;
  /** Exam portals unlocked in full, including every unit inside them. */
  portalKeys: string[];
  /** Individually unlocked unit keys. */
  unitKeys: string[];
  subscriptions: any[];
}

const initialState: AccessState = {
  loaded: false,
  loading: false,
  hasActiveSubscription: false,
  platformWide: false,
  portalKeys: [],
  unitKeys: [],
  subscriptions: [],
};

/**
 * What the signed-in student has paid for. The server flattens plan scopes into
 * plain key lists so screens do not have to reason about package overlaps.
 */
export const fetchAccess = createAsyncThunk('access/fetch', async (_, { rejectWithValue }) => {
  const res = await mobileApi('/subscriptions/my-access');
  if (!res.success) return rejectWithValue(res.message || 'Could not load your subscription.');
  return res.data;
});

export const accessSlice = createSlice({
  name: 'access',
  initialState,
  reducers: {
    clearAccess: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccess.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccess.fulfilled, (state, action) => {
        const d = action.payload || {};
        state.loading = false;
        state.loaded = true;
        state.hasActiveSubscription = Boolean(d.hasActiveSubscription);
        state.platformWide = Boolean(d.platformWide);
        state.portalKeys = d.portalKeys || [];
        state.unitKeys = d.unitKeys || [];
        state.subscriptions = d.subscriptions || [];
      })
      .addCase(fetchAccess.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })

      // One student's entitlements must never linger for the next person to
      // sign in on the same device.
      .addCase(signOut.fulfilled, () => initialState);
  },
});

export const { clearAccess } = accessSlice.actions;
export default accessSlice.reducer;

const selectAccess = (s: { access: AccessState }) => s.access;

/**
 * Whether a portal — and a unit inside it, when the portal has units — is
 * unlocked. A portal-wide package covers every unit in it. Plain function, not
 * a selector: a list screen checking many subjects at once cannot call a hook
 * once per row, so this is exported for direct use against `state.access`.
 */
export function hasAccess(
  access: Pick<AccessState, 'platformWide' | 'portalKeys' | 'unitKeys'>,
  portalKey?: string,
  unitKey?: string,
): boolean {
  if (access.platformWide) return true;
  if (!portalKey) return false;
  if (access.portalKeys.includes(portalKey)) return true;
  if (unitKey && access.unitKeys.includes(unitKey)) return true;
  return false;
}

/** Same check as a memoized selector, for a screen scoped to one portal/unit. */
export const makeSelectHasAccess = (portalKey?: string, unitKey?: string) =>
  createSelector([selectAccess], (access) => hasAccess(access, portalKey, unitKey));

export interface EnrolledExam {
  portalKey: string;
  portalTitleEn: string;
  portalTitleBn: string;
  portalIcon?: string | null;
  unitKey?: string;
  unitTitleEn?: string;
  unitTitleBn?: string;
}

/**
 * What the student is actually enrolled in — one row per portal, or per unit
 * inside a portal sold unit-by-unit — derived from their active subscriptions'
 * own scopes rather than the flattened key lists, so a DU ক purchase and an RU
 * A purchase are never confused just because both happen to use the key "A".
 * Meaningless while platformWide (everything is enrolled at that point).
 */
export const selectEnrolledExams = createSelector([selectAccess], (access): EnrolledExam[] => {
  const seen = new Set<string>();
  const rows: EnrolledExam[] = [];

  for (const sub of access.subscriptions) {
    for (const scope of sub.scopes || []) {
      if (!scope.portal) continue;

      const key = `${scope.portal.key}::${scope.unit?.key || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        portalKey: scope.portal.key,
        portalTitleEn: scope.portal.titleEn,
        portalTitleBn: scope.portal.titleBn,
        portalIcon: scope.portal.icon,
        unitKey: scope.unit?.key,
        unitTitleEn: scope.unit?.titleEn,
        unitTitleBn: scope.unit?.titleBn,
      });
    }
  }

  return rows;
});
