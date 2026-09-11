import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../../src/components/SafeScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Trophy,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  ArrowRight,
  Home,
} from 'lucide-react-native';
import { mobileApi } from '../../../src/services/api';

export default function ExamResultScreen() {
  const { attemptId } = useLocalSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      const res = await mobileApi(`/attempts/${attemptId}/result`);
      if (res.success && res.data) {
        setResult(res.data);
      }
      setLoading(false);
    }
    loadResult();
  }, [attemptId]);

  if (loading || !result) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center"
      >
        <ActivityIndicator color="#059669" size="large" />
        <Text className="text-xs text-slate-500 mt-2 font-medium">Calculating Final Scores...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Score Header Card */}
        <View className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm items-center text-center mb-6">
          <View className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-3">
            <Trophy color="#059669" size={28} />
          </View>

          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {result.examTitleEn}
          </Text>

          <View className="flex-row items-baseline my-2">
            <Text className="text-4xl font-black text-slate-900">{result.score}</Text>
            <Text className="text-lg font-bold text-slate-400 ml-1">/ {result.maxScore}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className={`px-3 py-1 rounded-full ${result.isPassed ? 'bg-emerald-100' : 'bg-rose-100'}`}
            >
              <Text
                className={`text-xs font-bold ${result.isPassed ? 'text-emerald-800' : 'text-rose-800'}`}
              >
                {result.isPassed ? 'QUALIFIED / PASSED' : 'NEEDS IMPROVEMENT'}
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-600">Accuracy: {result.accuracy}%</Text>
          </View>
        </View>

        {/* 4 Performance Metrics */}
        <View className="grid grid-cols-2 gap-3 mb-6">
          <View className="bg-white p-4 rounded-xl border border-slate-200 flex-row items-center gap-3">
            <CheckCircle color="#059669" size={22} />
            <View>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase">Correct</Text>
              <Text className="text-base font-bold text-slate-900">{result.correctCount} Qs</Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-xl border border-slate-200 flex-row items-center gap-3">
            <XCircle color="#e11d48" size={22} />
            <View>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase">
                Wrong (-{result.negativeMarksApplied})
              </Text>
              <Text className="text-base font-bold text-slate-900">{result.wrongCount} Qs</Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-xl border border-slate-200 flex-row items-center gap-3">
            <MinusCircle color="#64748b" size={22} />
            <View>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase">Skipped</Text>
              <Text className="text-base font-bold text-slate-900">
                {result.unansweredCount} Qs
              </Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-xl border border-slate-200 flex-row items-center gap-3">
            <Clock color="#2563eb" size={22} />
            <View>
              <Text className="text-[11px] font-semibold text-slate-400 uppercase">Time Used</Text>
              <Text className="text-base font-bold text-slate-900">
                {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
              </Text>
            </View>
          </View>
        </View>

        {/* Subject-Wise Accuracy Breakdown */}
        <View className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 space-y-4">
          <Text className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Subject-Wise Analytics
          </Text>

          <View className="space-y-3">
            {result.subjectBreakdown?.map((sub: any) => (
              <View key={sub.subjectId} className="space-y-1">
                <View className="flex-row justify-between text-xs font-semibold">
                  <Text className="text-slate-800">{sub.subjectNameEn}</Text>
                  <Text className="text-emerald-700">
                    {Math.round(sub.accuracy)}% ({sub.correctCount}/{sub.totalQuestions})
                  </Text>
                </View>
                <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, sub.accuracy))}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View className="p-4 bg-white border-t border-slate-200 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="flex-1 py-3.5 border border-slate-300 rounded-xl items-center justify-center flex-row"
        >
          <Home color="#334155" size={16} />
          <Text className="text-xs font-bold text-slate-700 ml-1.5">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: `/exam/${result.examId}/review`, params: { attemptId } })
          }
          className="flex-1 bg-emerald-600 px-6 py-3.5 rounded-xl items-center justify-center flex-row shadow-sm"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider mr-1">
            Review Solutions
          </Text>
          <ArrowRight color="#ffffff" size={16} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
