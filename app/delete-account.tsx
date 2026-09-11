import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '../src/components/SafeScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useRouter } from 'expo-router';
import { Lock, TriangleAlert } from 'lucide-react-native';
import { mobileApi } from '../src/services/api';
import { useToast } from '../src/components/Toast';
import { useAppDispatch } from '../src/store';
import { signOut } from '../src/store/slices/authSlice';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function confirmAndDelete() {
    Alert.alert(
      'Delete your account?',
      'This permanently removes your account, subscriptions, saved questions, and every result. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    setSubmitting(true);
    const res = await mobileApi('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);

    if (res.success) {
      await dispatch(signOut());
      toast.success('Your account has been deleted.');
      router.replace('/(auth)/login' as any);
    } else {
      toast.error(res.message || 'Could not delete your account.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScreenHeader title="Delete Account" />

        <View className="flex-1 px-6 pt-6">
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex-row gap-3 mb-6">
            <TriangleAlert color="#e11d48" size={20} />
            <Text className="text-xs text-rose-800 flex-1 leading-relaxed">
              Deleting your account permanently removes your subscriptions, saved questions, exam
              results, and everything else tied to it. This cannot be undone.
            </Text>
          </View>

          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
              Confirm Your Password
            </Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Lock color="#64748b" size={18} />
              <TextInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <Text className="text-[11px] text-slate-400 mb-6">
            Signed in with Google and have no password? Leave this blank.
          </Text>

          <TouchableOpacity
            onPress={confirmAndDelete}
            disabled={submitting}
            className={`py-3.5 rounded-xl items-center ${submitting ? 'bg-rose-300' : 'bg-rose-600'}`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Delete My Account
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
