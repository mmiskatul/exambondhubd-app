import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { signIn, signInWithGoogle } from '../../src/store/slices/authSlice';
import { fetchAccess } from '../../src/store/slices/accessSlice';
import { supabase } from '../../src/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const loading = useAppSelector((s) => s.auth.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email.includes('@') || email.trim().length < 5) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    const result = await dispatch(signIn({ email: email.trim(), password }));

    if (signIn.fulfilled.match(result)) {
      dispatch(fetchAccess());
      toast.success(`Welcome back, ${result.payload.user?.name || 'student'}!`);
      router.replace('/(tabs)');
    } else if (result.payload?.code === 'EMAIL_NOT_VERIFIED') {
      // The password was right; the address just was not confirmed yet, so
      // this is a hand-off to the same screen the register flow uses rather
      // than a dead-end error.
      toast.info(result.payload.message);
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: result.payload.email || email.trim() },
      } as any);
    } else {
      toast.error(result.payload?.message || 'Wrong email or password.');
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });

      if (error) {
        toast.error(error.message);
        return;
      }

      // The session lands once the browser flow returns; the server verifies
      // the token before trusting any of it.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Google sign-in did not complete. Please try again.');
        return;
      }

      const result = await dispatch(signInWithGoogle({ supabaseAccessToken: accessToken }));

      if (signInWithGoogle.fulfilled.match(result)) {
        dispatch(fetchAccess());
        toast.success(`Welcome, ${result.payload.user?.name || 'student'}!`);
        router.replace('/(tabs)');
      } else {
        toast.error((result.payload as string) || 'Google sign-in failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 48 }}
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-emerald-600 items-center justify-center mb-4 shadow-xl shadow-emerald-600/30">
              <Text className="text-3xl font-black text-white">E</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900">ExamBondhuBD</Text>
            <Text className="text-xs text-slate-500 mt-1 font-sans text-center">
              Bangladesh Competitive Examination &amp; MCQ Preparation
            </Text>
          </View>

          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <View>
              <Text className="text-base font-bold text-slate-900">Sign In</Text>
              <Text className="text-xs text-slate-500 mt-0.5">আপনার অ্যাকাউন্টে প্রবেশ করুন।</Text>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Email Address
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Mail color="#64748b" size={18} />
                <TextInput
                  placeholder="e.g. rahim@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">Password</Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Lock color="#64748b" size={18} />
                <TextInput
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff color="#94a3b8" size={17} />
                  ) : (
                    <Eye color="#94a3b8" size={17} />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/forgot-password',
                    params: { email: email.trim() },
                  } as any)
                }
                className="items-end mt-1.5"
              >
                <Text className="text-xs font-bold text-emerald-700">Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`py-3.5 rounded-xl items-center ${loading ? 'bg-emerald-400' : 'bg-emerald-600'}`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-sm font-bold text-white uppercase tracking-wider">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="text-[10px] font-bold text-slate-400 uppercase">or</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              className="py-3.5 rounded-xl items-center border border-slate-300 bg-white flex-row justify-center gap-2"
            >
              {googleLoading ? (
                <ActivityIndicator color="#334155" size="small" />
              ) : (
                <>
                  <Text className="text-base">🇬</Text>
                  <Text className="text-sm font-bold text-slate-700">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register' as any)}
            className="mt-6 items-center"
          >
            <Text className="text-xs text-slate-500">
              নতুন? <Text className="font-bold text-emerald-700">অ্যাকাউন্ট তৈরি করুন</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
