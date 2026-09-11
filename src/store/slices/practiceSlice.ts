import { createSelector, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mobileApi } from '../../services/api';
import { signOut } from './authSlice';

export type PracticeMode = 'subject' | 'chapter' | 'mistakes';

export interface PracticeScope {
  mode: PracticeMode;
  title: string;
  subtitle?: string;
  portalKey?: string;
  unitKey?: string;
  subjectId?: string;
  topicId?: string;
}

interface PracticeState {
  scope: PracticeScope | null;
  questions: any[];
  /** questionId -> chosen option key */
  answers: Record<string, string>;
  /** Questions the student has asked to see the answer for. */
  revealed: string[];
  index: number;
  loading: boolean;
  error: string | null;
  /** Set only when the server refused for lack of a package. */
  lockedScope: { portalKey?: string; unitKey?: string } | null;
  finished: boolean;
}

const initialState: PracticeState = {
  scope: null,
  questions: [],
  answers: {},
  revealed: [],
  index: 0,
  loading: false,
  error: null,
  lockedScope: null,
  finished: false,
};

export interface PracticeError {
  message: string;
  /** 'SUBSCRIPTION_REQUIRED' when the session screen should offer to buy the package. */
  code?: string;
  portalKey?: string;
  unitKey?: string;
}

/**
 * Loads a practice set. The Practice tab used to be two dead alerts; this backs
 * it with either the shuffled question feed or the student's own mistakes.
 * The server enforces the actual purchase gate (a locked subject cannot be
 * fed here no matter what the app sends) — this just surfaces that refusal.
 */
export const startPractice = createAsyncThunk<
  { scope: PracticeScope; questions: any[] },
  PracticeScope,
  { rejectValue: PracticeError }
>('practice/start', async (scope, { rejectWithValue }) => {
  let res: any;

  if (scope.mode === 'mistakes') {
    res = await mobileApi('/attempts/practice/mistakes?count=20');
  } else {
    const params = new URLSearchParams();
    if (scope.portalKey) params.set('portalKey', scope.portalKey);
    if (scope.unitKey) params.set('unitKey', scope.unitKey);
    if (scope.subjectId) params.set('subjectId', scope.subjectId);
    if (scope.topicId) params.set('topicId', scope.topicId);
    params.set('limit', '20');

    res = await mobileApi(`/questions/practice/feed?${params.toString()}`);
  }

  if (!res.success) {
    return rejectWithValue({
      message: res.message || 'Could not start practice.',
      code: res.error?.code,
      portalKey: res.error?.details?.portalKey || scope.portalKey,
      unitKey: res.error?.details?.unitKey || scope.unitKey,
    });
  }

  // The two sources differ in shape: the mistakes route answers
  // { totalMistakes, questions }, the feed answers { items, total }.
  const raw = Array.isArray(res.data) ? res.data : res.data?.questions || res.data?.items || [];
  const questions = raw.map((row: any) => row.question || row).filter(Boolean);

  return { scope, questions };
});

export const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    answer: (state, action: PayloadAction<{ questionId: string; optionKey: string }>) => {
      const { questionId, optionKey } = action.payload;
      // Answers are final once given, so the score cannot be gamed by retrying.
      if (state.answers[questionId]) return;
      state.answers[questionId] = optionKey;
      if (!state.revealed.includes(questionId)) state.revealed.push(questionId);
    },
    reveal: (state, action: PayloadAction<string>) => {
      if (!state.revealed.includes(action.payload)) state.revealed.push(action.payload);
    },
    next: (state) => {
      if (state.index < state.questions.length - 1) state.index += 1;
      else state.finished = true;
    },
    previous: (state) => {
      if (state.index > 0) state.index -= 1;
    },
    goTo: (state, action: PayloadAction<number>) => {
      state.index = Math.max(0, Math.min(action.payload, state.questions.length - 1));
    },
    finish: (state) => {
      state.finished = true;
    },
    resetPractice: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(startPractice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lockedScope = null;
        state.questions = [];
        state.answers = {};
        state.revealed = [];
        state.index = 0;
        state.finished = false;
      })
      .addCase(startPractice.fulfilled, (state, action) => {
        state.loading = false;
        state.scope = action.payload.scope;
        state.questions = action.payload.questions;
      })
      .addCase(startPractice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Could not start practice.';
        state.lockedScope =
          action.payload?.code === 'SUBSCRIPTION_REQUIRED'
            ? { portalKey: action.payload.portalKey, unitKey: action.payload.unitKey }
            : null;
      })

      // A half-finished session belongs to the student who started it.
      .addCase(signOut.fulfilled, () => initialState);
  },
});

export const { answer, reveal, next, previous, goTo, finish, resetPractice } =
  practiceSlice.actions;
export default practiceSlice.reducer;

/**
 * Correct / wrong / remaining for the current session. Memoized because it
 * returns a fresh object, which would otherwise re-render the session screen on
 * every store change.
 */
export const selectPracticeScore = createSelector(
  [
    (s: { practice: PracticeState }) => s.practice.questions,
    (s: { practice: PracticeState }) => s.practice.answers,
  ],
  (questions, answers) => {
    let correct = 0;
    let wrong = 0;

    for (const q of questions) {
      const chosen = answers[q.id];
      if (!chosen) continue;
      const right = q.options?.find((o: any) => o.isCorrect)?.optionKey;
      if (chosen === right) correct += 1;
      else wrong += 1;
    }

    return {
      correct,
      wrong,
      answered: correct + wrong,
      total: questions.length,
      remaining: questions.length - (correct + wrong),
    };
  },
);
