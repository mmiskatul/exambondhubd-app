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
import { User, Phone } from 'lucide-react-native';
import { useToast } from '../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../src/store';
import { updateProfile } from '../src/store/slices/authSlice';

export default function EditProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const account = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState(account?.name || '');
  const [phone, setPhone] = useState(account?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(updateProfile({ name: name.trim(), phone: phone.trim() }));
    setSubmitting(false);

    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated.');
      router.back();
    } else {
      toast.error((result.payload as string) || 'Could not update your profile.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScreenHeader title="Edit Profile" />

        <View className="flex-1 px-6 pt-6">
          <View className="mb-5">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <User color="#64748b" size={18} />
              <TextInput
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">Phone Number</Text>
            <View className="flex-row items-center bg-white border border-slate-300 rounded-xl px-3.5 py-3">
              <Phone color="#64748b" size={18} />
              <TextInput
                placeholder="e.g. 01710000000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="flex-1 ml-2.5 text-sm text-slate-900"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <Text className="text-[11px] text-slate-400 mb-6">
            {account?.email} — your sign-in email can't be changed here.
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
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
