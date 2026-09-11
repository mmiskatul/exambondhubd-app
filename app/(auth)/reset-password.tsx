import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { BackButton } from '../../src/components/ScreenHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { resetPassword, forgotPassword } from '../../src/store/slices/authSlice';
import { fetchAccess } from '../../src/store/slices/accessSlice';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

/** Reached from forgot-password with the email carried as a route param. */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.auth.loading);

  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleReset() {
    if (code.length !== CODE_LENGTH) {
      toast.error('Enter the 6-digit code.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Your new password must be at least 6 characters.');
      return;
    }

    Keyboard.dismiss();
    const result = await dispatch(resetPassword({ email, code, newPassword }));

    if (resetPassword.fulfilled.match(result)) {
      dispatch(fetchAccess());
      toast.success('Password updated — welcome back!');
      router.replace('/(tabs)');
    } else {
      toast.error((result.payload as string) || 'That code was not accepted.');
      setCode('');
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;

    setResending(true);
    const result = await dispatch(forgotPassword({ email }));
    setResending(false);

    if (forgotPassword.fulfilled.match(result)) {
      toast.success(result.payload as string);
      setCooldown(RESEND_COOLDOWN_S);
      setCode('');
    } else {
      toast.error((result.payload as string) || 'Could not resend the code.');
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

          <View className="items-center mb-6 mt-2">
            <Text className="text-2xl font-bold text-slate-900">Enter the code</Text>
            <Text className="text-xs text-slate-500 mt-1.5 font-sans text-center">
              We sent a 6-digit reset code to
            </Text>
            <Text className="text-sm font-bold text-slate-800 mt-0.5">{email}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-center gap-2 mb-5"
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                className={`w-11 h-13 rounded-xl border-2 items-center justify-center ${
                  i === code.length
                    ? 'border-emerald-500 bg-emerald-50'
                    : code[i]
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-200 bg-white'
                }`}
                style={{ height: 52 }}
              >
                <Text className="text-xl font-black text-slate-900">{code[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            autoFocus
            maxLength={CODE_LENGTH}
            className="opacity-0 h-0 w-0 absolute"
          />

          <View className="mb-5">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">New Password</Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Lock color="#64748b" size={18} />
              <TextInput
                placeholder="At least 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
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
          </View>

          <TouchableOpacity
            onPress={handleReset}
            disabled={loading || code.length !== CODE_LENGTH || newPassword.length < 6}
            className={`py-3.5 rounded-xl items-center ${
              loading || code.length !== CODE_LENGTH || newPassword.length < 6
                ? 'bg-emerald-300'
                : 'bg-emerald-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-1.5 mt-6">
            <Text className="text-xs text-slate-500">Didn't get a code?</Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending}>
              <Text
                className={`text-xs font-bold ${
                  cooldown > 0 || resending ? 'text-slate-400' : 'text-emerald-700'
                }`}
              >
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
