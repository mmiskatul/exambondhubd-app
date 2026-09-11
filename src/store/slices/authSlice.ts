import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../../services/api';

const TOKEN_KEY = 'user_access_token';
const USER_KEY = 'user_profile';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  profile?: any;
  subscriptions?: any[];
  activeSubscription?: any;
  pushNotificationsEnabled?: boolean;
}

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,
};

/** Restores a stored session at startup so the app opens signed in. */
export const restoreSession = createAsyncThunk('auth/restore', async () => {
  const [token, userStr] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);

  if (!token) return null;

  let user: AppUser | null = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  return { token, user };
});

/** Pulls the live profile, so streak and stats are never stale. */
export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  const res = await mobileApi('/users/me');
  if (!res.success) return rejectWithValue(res.message || 'Could not load your profile.');
  return res.data;
});

export interface SignInError {
  message: string;
  /** 'EMAIL_NOT_VERIFIED' when the login screen should route to verify-email. */
  code?: string;
  email?: string;
}

export const signIn = createAsyncThunk<
  { token: string; user: AppUser },
  { email: string; password: string },
  { rejectValue: SignInError }
>('auth/signIn', async (payload, { rejectWithValue }) => {
  const res: any = await mobileApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.success) {
    return rejectWithValue({
      message: res.message || 'Wrong email or password.',
      code: res.error?.code,
      email: res.error?.details?.email,
    });
  }

  const { accessToken, user } = res.data;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [USER_KEY, JSON.stringify(user)],
  ]);

  return { token: accessToken, user };
});

/**
 * Creates the account and sends a verification code — no session yet. An
 * unconfirmed email might not belong to whoever typed it, so `verifyEmail` is
 * what actually signs the student in.
 */
export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      referralCode?: string;
    },
    { rejectWithValue },
  ) => {
    const res = await mobileApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'Could not create your account.');

    // { requiresVerification: true, email }
    return res.data as { requiresVerification: boolean; email: string };
  },
);

/** Confirms the code from `register` (or a resend) and signs the student in. */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (payload: { email: string; code: string }, { rejectWithValue }) => {
    const res = await mobileApi('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'That code was not accepted.');

    // Verifying an already-verified email is treated as success server-side
    // but carries no session — send that case back to the login screen.
    if (res.data?.alreadyVerified) {
      return { alreadyVerified: true as const };
    }

    const { accessToken, user } = res.data;
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { alreadyVerified: false as const, token: accessToken, user };
  },
);

/** Rate-limited on the server; the message names how long to wait. */
export const resendVerificationCode = createAsyncThunk(
  'auth/resendVerification',
  async (payload: { email: string }, { rejectWithValue }) => {
    const res = await mobileApi('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'Could not resend the code.');
    return res.message as string;
  },
);

/** Always answers success, whether or not the email actually has an account. */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: { email: string }, { rejectWithValue }) => {
    const res = await mobileApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'Could not send the reset code.');
    return res.message as string;
  },
);

/** Confirms the code from `forgotPassword` and signs the student in with their new password. */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: { email: string; code: string; newPassword: string }, { rejectWithValue }) => {
    const res = await mobileApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'That code was not accepted.');

    const { accessToken, user } = res.data;
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { token: accessToken, user };
  },
);

/**
 * The Google token comes from Supabase on the device; the server verifies it
 * against Supabase before issuing a session, so a caller cannot simply claim
 * to own an email address.
 */
export const signInWithGoogle = createAsyncThunk(
  'auth/google',
  async (payload: { supabaseAccessToken: string }, { rejectWithValue }) => {
    const res = await mobileApi('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'Google sign-in failed.');

    const { accessToken, user } = res.data;
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { token: accessToken, user };
  },
);

/** Updates name/phone and keeps the persisted copy in sync, not just memory. */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    payload: { name?: string; phone?: string; pushNotificationsEnabled?: boolean },
    { rejectWithValue },
  ) => {
    const res = await mobileApi('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.success) return rejectWithValue(res.message || 'Could not update your profile.');

    const user = res.data.user;
    const raw = await AsyncStorage.getItem(USER_KEY);
    const merged = { ...(raw ? JSON.parse(raw) : {}), ...user };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));

    return user;
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AppUser>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.isInitialized = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isInitialized = true;
      })

      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = { ...(state.user || {}), ...action.payload };
        state.isAuthenticated = true;
      })

      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Sign-in failed.';
      })

      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        // No session yet — register only sends the code. verifyEmail signs in.
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not create your account.';
      })

      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.alreadyVerified) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'That code was not accepted.';
      })

      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Could not resend the code.';
      })

      .addCase(forgotPassword.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Could not send the reset code.';
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'That code was not accepted.';
      })

      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Google sign-in failed.';
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...(state.user || {}), ...action.payload };
      })

      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
