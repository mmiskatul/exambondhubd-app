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
import { MailCheck } from 'lucide-react-native';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { verifyEmail, resendVerificationCode } from '../../src/store/slices/authSlice';
import { fetchAccess } from '../../src/store/slices/accessSlice';
import { useLang } from '../../src/i18n';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

/**
 * Lands here right after registration (email carried as a route param) or
 * from the login screen when the server refuses a sign-in with
 * EMAIL_NOT_VERIFIED. Either way there is no session yet — verifying the code
 * is what actually signs the student in.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { t } = useLang();

  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || '';

  const loading = useAppSelector((s) => s.auth.loading);

  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const inputRef = useRef<TextInput>(null);

  // A fresh code was just emailed on the way in, so the resend button starts
  // on cooldown rather than inviting an instant duplicate request.
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleVerify() {
    if (code.length !== CODE_LENGTH) {
      toast.error(t('enterSixDigitCode'));
      return;
    }

    Keyboard.dismiss();
    const result = await dispatch(verifyEmail({ email, code }));

    if (verifyEmail.fulfilled.match(result)) {
      if (result.payload.alreadyVerified) {
        toast.success('Already verified — please sign in.');
        router.replace('/(auth)/login' as any);
        return;
      }

      dispatch(fetchAccess());
      toast.success(`Welcome, ${result.payload.user?.name || 'student'}!`);
      router.replace('/(tabs)');
    } else {
      toast.error((result.payload as string) || 'That code was not accepted.');
      setCode('');
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;

    setResending(true);
    const result = await dispatch(resendVerificationCode({ email }));
    setResending(false);

    if (resendVerificationCode.fulfilled.match(result)) {
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

          <View className="items-center mb-8 mt-4">
            <View className="w-16 h-16 rounded-2xl bg-emerald-50 items-center justify-center mb-4">
              <MailCheck color="#059669" size={28} />
            </View>
            <Text className="text-2xl font-bold text-slate-900">{t('verifyEmailTitle')}</Text>
            <Text className="text-xs text-slate-500 mt-1.5 font-sans text-center">
              {t('verifyEmailSubtitle')}
            </Text>
            <Text className="text-sm font-bold text-slate-800 mt-0.5">{email}</Text>
          </View>

          {/* Single input driving 6 visual boxes keeps the OTP UX without the
            complexity of managing six separate refs and paste handling. */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-center gap-2 mb-6"
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

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || code.length !== CODE_LENGTH}
            className={`py-3.5 rounded-xl items-center ${
              loading || code.length !== CODE_LENGTH ? 'bg-emerald-300' : 'bg-emerald-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                {t('verifyButton')}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-1.5 mt-6">
            <Text className="text-xs text-slate-500">{t('didNotGetCode')}</Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending}>
              <Text
                className={`text-xs font-bold ${
                  cooldown > 0 || resending ? 'text-slate-400' : 'text-emerald-700'
                }`}
              >
                {resending
                  ? t('loading')
                  : cooldown > 0
                    ? `${t('resendIn')} ${cooldown}s`
                    : t('resendCode')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[11px] text-slate-400 text-center mt-8 leading-relaxed">
            {t('checkAccountCreated')}
          </Text>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/register' as any)}
            className="mt-4 items-center"
          >
            <Text className="text-xs font-bold text-slate-500">{t('changeEmail')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
