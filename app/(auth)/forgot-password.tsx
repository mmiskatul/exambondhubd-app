import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { BackButton } from '../../src/components/ScreenHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, KeyRound } from 'lucide-react-native';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { forgotPassword } from '../../src/store/slices/authSlice';

/** Reached from the login screen. Always succeeds — the reset screen next handles a wrong email. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.auth.loading);

  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.includes('@') || email.trim().length < 5) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(forgotPassword({ email: email.trim() }));
    setSubmitting(false);

    if (forgotPassword.fulfilled.match(result)) {
      toast.success(result.payload as string);
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: email.trim() },
      } as any);
    } else {
      toast.error((result.payload as string) || 'Could not send the reset code.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-6 pt-4">
          <BackButton className="mb-6" />

          <View className="items-center mb-8 mt-4">
            <View className="w-16 h-16 rounded-2xl bg-emerald-50 items-center justify-center mb-4">
              <KeyRound color="#059669" size={28} />
            </View>
            <Text className="text-2xl font-bold text-slate-900">Reset your password</Text>
            <Text className="text-xs text-slate-500 mt-1.5 font-sans text-center">
              Enter your account email — if it has an account, we'll send a 6-digit reset code to
              it.
            </Text>
          </View>

          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Mail color="#64748b" size={18} />
              <TextInput
                placeholder="e.g. rahim@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || submitting}
            className={`py-3.5 rounded-xl items-center mt-5 ${
              loading || submitting ? 'bg-emerald-400' : 'bg-emerald-600'
            }`}
          >
            {loading || submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Send Reset Code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login' as any)}
            className="mt-6 items-center"
          >
            <Text className="text-xs font-bold text-slate-500">Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
