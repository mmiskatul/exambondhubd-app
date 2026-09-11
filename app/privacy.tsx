import React from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from '../src/components/SafeScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';

export default function PrivacyScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <ScreenHeader title="Privacy Policy" />

      <ScrollView className="flex-1 px-5 py-5" showsVerticalScrollIndicator={false}>
        <Text className="text-xs text-slate-400 mb-4">Last updated: September 2026</Text>
        <Text className="text-sm text-slate-700 leading-relaxed">
          Your student credentials, exam answers, and score analytics are encrypted and securely
          stored.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
