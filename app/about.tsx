import React from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from '../src/components/SafeScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import Constants from 'expo-constants';

export default function AboutScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <ScreenHeader title="About ExamBondhuBD" />

      <ScrollView className="flex-1 px-5 py-5" showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-slate-700 leading-relaxed">
          ExamBondhuBD is Bangladesh&apos;s leading competitive examination &amp; MCQ testing
          platform built for BCS, University Admission, Medical, and Govt Job examinees.
        </Text>
        <Text className="text-xs text-slate-400 mt-6">
          Version {Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
