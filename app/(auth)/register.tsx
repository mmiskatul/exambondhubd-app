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
import { BackButton } from '../../src/components/ScreenHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, Gift } from 'lucide-react-native';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { register } from '../../src/store/slices/authSlice';

export default function RegisterScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ ref?: string }>();

  const loading = useAppSelector((s) => s.auth.loading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referralCode, setReferralCode] = useState(params.ref || '');
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!email.includes('@') || email.trim().length < 5) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Your password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('The two passwords do not match.');
      return;
    }

    const result = await dispatch(
      register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      }),
    );

    if (register.fulfilled.match(result)) {
      toast.success('Account created! Check your email for a verification code.');
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: result.payload.email },
      } as any);
    } else {
      toast.error((result.payload as string) || 'Could not create your account.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 32 }}>
          <BackButton className="mb-6" />

          <Text className="text-2xl font-bold text-slate-900">অ্যাকাউন্ট তৈরি করুন</Text>
          <Text className="text-xs text-slate-500 mt-1 font-sans mb-6">
            আপনার প্রস্তুতি, ফলাফল ও বুকমার্ক সব এক জায়গায় সংরক্ষিত থাকবে।
          </Text>

          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Full Name <Text className="text-rose-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <User color="#64748b" size={18} />
                <TextInput
                  placeholder="আপনার নাম"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Email <Text className="text-rose-500">*</Text>
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
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Phone <Text className="text-slate-400 normal-case">(optional)</Text>
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Phone color="#64748b" size={18} />
                <TextInput
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Referral Code <Text className="text-slate-400 normal-case">(optional)</Text>
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Gift color="#64748b" size={18} />
                <TextInput
                  placeholder="e.g. PP4K7QRT"
                  value={referralCode}
                  onChangeText={(v) => setReferralCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Password <Text className="text-rose-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Lock color="#64748b" size={18} />
                <TextInput
                  placeholder="কমপক্ষে ৬ অক্ষর"
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
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
                Confirm Password <Text className="text-rose-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
                <Lock color="#64748b" size={18} />
                <TextInput
                  placeholder="আবার লিখুন"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 ml-2.5 text-sm text-slate-900"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              {confirm.length > 0 && confirm !== password && (
                <Text className="text-[11px] text-rose-600 mt-1">পাসওয়ার্ড দুটি মিলছে না।</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`py-3.5 rounded-xl items-center ${loading ? 'bg-emerald-400' : 'bg-emerald-600'}`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-sm font-bold text-white uppercase tracking-wider">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login' as any)}
            className="mt-6 items-center"
          >
            <Text className="text-xs text-slate-500">
              আগে থেকেই অ্যাকাউন্ট আছে? <Text className="font-bold text-emerald-700">সাইন ইন</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
