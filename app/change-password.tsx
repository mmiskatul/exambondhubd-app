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
import { SafeAreaView } from '../src/components/SafeScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { mobileApi } from '../src/services/api';
import { useToast } from '../src/components/Toast';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Left blank on purpose for a Google-only account with no password yet —
    // the server skips the current-password check when there is none to check.
    if (newPassword.length < 6) {
      toast.error('Your new password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const res = await mobileApi('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    setSubmitting(false);

    if (res.success) {
      toast.success(res.message || 'Password updated.');
      router.back();
    } else {
      toast.error(res.message || 'Could not update your password.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScreenHeader title="Change Password" />

        <View className="flex-1 px-6 pt-6">
          <View className="mb-5">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">
              Current Password
            </Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Lock color="#64748b" size={18} />
              <TextInput
                placeholder="••••••••"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                autoCapitalize="none"
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowOld((v) => !v)} hitSlop={8}>
                {showOld ? <EyeOff color="#94a3b8" size={17} /> : <Eye color="#94a3b8" size={17} />}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">New Password</Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Lock color="#64748b" size={18} />
              <TextInput
                placeholder="At least 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                {showNew ? <EyeOff color="#94a3b8" size={17} /> : <Eye color="#94a3b8" size={17} />}
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-[11px] text-slate-400 mb-6">
            Signed in with Google and have no password yet? Leave "Current Password" blank.
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`py-3.5 rounded-xl items-center ${submitting ? 'bg-emerald-400' : 'bg-emerald-600'}`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
