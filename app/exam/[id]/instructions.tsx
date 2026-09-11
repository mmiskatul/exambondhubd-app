import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from '../../../src/components/SafeScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, BookOpen, CheckCircle, Lock } from 'lucide-react-native';
import { mobileApi } from '../../../src/services/api';
import { useExamStore } from '../../../src/store/useExamStore';

export default function ExamInstructionsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [locked, setLocked] = useState<{ portalKey?: string; unitKey?: string } | null>(null);
  const setAttempt = useExamStore((state) => state.setAttempt);

  useEffect(() => {
    async function loadExam() {
      const res = await mobileApi(`/exams/${id}`);
      if (res.success && res.data) {
        setExam(res.data);
      }
      setLoading(false);
    }
    loadExam();
  }, [id]);

  async function handleStartExam() {
    setStarting(true);
    const res = await mobileApi('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ examId: exam.id }),
    });

    setStarting(false);

    if (res.success && res.data) {
      setAttempt(res.data);
      router.replace(`/exam/${exam.id}/live`);
    } else if ((res as any).error?.code === 'SUBSCRIPTION_REQUIRED') {
      setLocked({
        portalKey: (res as any).error?.details?.portalKey,
        unitKey: (res as any).error?.details?.unitKey,
      });
    } else {
      Alert.alert('Unable to Start', res.message || 'Please check your internet connection.');
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  if (locked) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-8 space-y-3">
          <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center">
            <Lock color="#b45309" size={24} />
          </View>
          <Text className="text-sm font-bold text-slate-800 text-center">
            A package is needed to take this exam
          </Text>
          <Text className="text-xs text-slate-500 text-center leading-relaxed">
            {exam?.titleEn} is part of a paid package you haven't purchased yet.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.replace(
                (`/subscription/pay?portalKey=${encodeURIComponent(locked.portalKey || '')}` +
                  (locked.unitKey ? `&unitKey=${encodeURIComponent(locked.unitKey)}` : '')) as any,
              )
            }
            className="px-6 py-3 bg-emerald-600 rounded-xl mt-2"
          >
            <Text className="text-xs font-bold text-white uppercase tracking-wider">
              Buy Package
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="mt-1">
            <Text className="text-xs font-bold text-slate-500">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-slate-900">{exam?.titleEn}</Text>
          <Text className="text-sm text-slate-600 font-sans mt-1">{exam?.titleBn}</Text>
        </View>

        {/* Stats Grid */}
        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center">
              <Clock color="#059669" size={20} />
            </View>
            <View>
              <Text className="text-[11px] text-slate-500 font-semibold uppercase">Duration</Text>
              <Text className="text-sm font-bold text-slate-900">
                {exam?.durationMinutes} Minutes
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center">
              <BookOpen color="#2563eb" size={20} />
            </View>
            <View>
              <Text className="text-[11px] text-slate-500 font-semibold uppercase">Questions</Text>
              <Text className="text-sm font-bold text-slate-900">{exam?.totalQuestions} MCQs</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View className="space-y-4 mb-8">
          <Text className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Examination Rules & Scoring
          </Text>

          {[
            `Each question carries +${exam?.marksPerQuestion ?? 1} mark for correct answers.`,
            Number(exam?.negativeMark) > 0
              ? `A negative mark of -${exam.negativeMark} will be deducted for each incorrect answer.`
              : 'This exam has no negative marking.',
            'Server-synchronized timer will automatically submit your exam once time expires.',
            'Every option selection is auto-saved. You can close and resume the app anytime.',
            'Unanswered questions carry 0 penalty.',
          ].map((rule, idx) => (
            <View key={idx} className="flex-row items-start gap-2.5">
              <View className="mt-0.5">
                <CheckCircle color="#059669" size={16} />
              </View>
              <Text className="text-xs text-slate-700 flex-1 leading-relaxed">{rule}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Start Action */}
      <View className="p-5 border-t border-slate-200 bg-white">
        <TouchableOpacity
          onPress={handleStartExam}
          disabled={starting}
          className="bg-emerald-600 py-3.5 rounded-xl items-center shadow-md shadow-emerald-700/20"
        >
          <Text className="text-sm font-bold text-white uppercase tracking-wider">
            {starting ? 'Generating Session...' : 'Start Examination'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
