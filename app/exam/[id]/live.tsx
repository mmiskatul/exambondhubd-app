import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '../../../src/components/SafeScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, Flag, Grid, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useExamStore } from '../../../src/store/useExamStore';
import { mobileApi } from '../../../src/services/api';

export default function LiveExamScreen() {
  const router = useRouter();
  const { id: examId } = useLocalSearchParams<{ id: string }>();
  const {
    activeAttempt,
    currentQuestionIndex,
    remainingSeconds,
    answersMap,
    flaggedMap,
    setAttempt,
    setCurrentIndex,
    decrementTimer,
    selectOption,
    toggleFlag,
  } = useExamStore();

  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Every entry point into this screen (instructions, resume, a custom test)
  // already fetches the attempt and calls setAttempt() before navigating —
  // but trusting every caller to remember that is exactly how the "Continue
  // where you left off" resume flow silently broke. This is the fallback:
  // if the store doesn't hold the right attempt (a cold start, a deep link,
  // a future caller that forgets), the screen fetches it itself instead of
  // sitting on a spinner forever. /attempts/start resumes the existing
  // in-progress attempt for this exam if there is one, same as a fresh start.
  useEffect(() => {
    if (!examId) return;
    if (activeAttempt && activeAttempt.examId === examId) return;

    let cancelled = false;

    (async () => {
      const res = await mobileApi('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({ examId }),
      });

      if (cancelled) return;

      if (res.success && res.data) {
        setAttempt(res.data);
      } else {
        setRestoreError(res.message || 'Could not restore this exam session.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, activeAttempt?.examId]);

  // Server-Synchronized Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle Auto-submission on timer expiry
  useEffect(() => {
    if (activeAttempt && remainingSeconds <= 0 && activeAttempt.status === 'IN_PROGRESS') {
      handleSubmitExam(true);
    }
  }, [remainingSeconds]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function handleSubmitExam(isAuto = false) {
    if (!activeAttempt) return;
    setIsSubmitting(true);

    const res = await mobileApi(`/attempts/${activeAttempt.id}/submit`, {
      method: 'POST',
    });

    setIsSubmitting(false);
    setIsSubmitModalOpen(false);

    if (res.success && res.data) {
      router.replace({
        pathname: `/exam/${activeAttempt.examId}/result`,
        params: { attemptId: activeAttempt.id },
      });
    } else {
      Alert.alert('Submission Issue', res.message || 'Unable to submit exam.');
    }
  }

  if (restoreError) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center px-8"
      >
        <AlertCircle color="#e11d48" size={32} />
        <Text className="text-sm font-bold text-slate-800 mt-3 text-center">{restoreError}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-5 px-6 py-3 bg-slate-900 rounded-xl"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // A matching attempt with zero questions (e.g. a custom test built from a
  // chapter with nothing published in it yet) is a dead end, not a loading
  // state — nothing further will ever arrive to fill it in.
  if (activeAttempt && activeAttempt.examId === examId && activeAttempt.questions?.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center px-8"
      >
        <AlertCircle color="#e11d48" size={32} />
        <Text className="text-sm font-bold text-slate-800 mt-3 text-center">
          No questions matched what you picked. Try different subjects or chapters.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-5 px-6 py-3 bg-slate-900 rounded-xl"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!activeAttempt || activeAttempt.examId !== examId || !activeAttempt.questions) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center"
      >
        <ActivityIndicator color="#059669" size="large" />
        <Text className="text-xs text-slate-500 mt-2 font-medium">Restoring Exam State...</Text>
      </SafeAreaView>
    );
  }

  const currentItem = activeAttempt.questions[currentQuestionIndex];
  const question = currentItem.question;
  const currentAnswer = answersMap[question.id];
  const isFlagged = flaggedMap[question.id] || false;

  const totalQuestions = activeAttempt.questions.length;
  const answeredCount = Object.keys(answersMap).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-100">
      {/* Top Fixed Exam Header & Timer */}
      <View className="bg-white px-5 py-3 border-b border-slate-200 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {question.subject?.titleEn || 'General'}
          </Text>
          <Text className="text-sm font-bold text-slate-900">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>

        {/* Synchronized Server Timer */}
        <View className="flex-row items-center bg-slate-900 px-3 py-1.5 rounded-full">
          <Clock color="#10b981" size={14} />
          <Text className="text-xs font-mono font-bold text-emerald-400 ml-1.5">
            {formatTime(remainingSeconds)}
          </Text>
        </View>

        {/* Grid Navigator Button */}
        <TouchableOpacity
          onPress={() => setIsGridModalOpen(true)}
          className="w-9 h-9 rounded-lg bg-slate-100 items-center justify-center border border-slate-200"
        >
          <Grid color="#334155" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main Question Card Scrollable Area */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="bg-emerald-50 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-emerald-700">
                  Q.{currentQuestionIndex + 1}
                </Text>
              </View>
              {question.year && (
                <View className="bg-slate-100 px-2 py-0.5 rounded">
                  <Text className="text-[10px] font-bold text-slate-600">Year {question.year}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => toggleFlag(question.id)}
              className={`flex-row items-center px-2.5 py-1 rounded-lg border ${
                isFlagged ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Flag color={isFlagged ? '#d97706' : '#64748b'} size={13} />
              <Text
                className={`text-[11px] font-semibold ml-1 ${isFlagged ? 'text-amber-700' : 'text-slate-600'}`}
              >
                {isFlagged ? 'Flagged' : 'Flag'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Question Text in English & Bangla */}
          <View className="space-y-1">
            <Text className="text-base font-bold text-slate-900 leading-snug">
              {question.questionEn}
            </Text>
            {question.questionBn && (
              <Text className="text-sm text-slate-700 font-sans font-medium">
                {question.questionBn}
              </Text>
            )}
          </View>

          {/* 4 Options Grid */}
          <View className="space-y-3 pt-2">
            {question.options?.map((option: any) => {
              const isSelected = currentAnswer === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => selectOption(question.id, option.id)}
                  activeOpacity={0.7}
                  className={`p-4 rounded-xl border flex-row items-center ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center mr-3 font-bold ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}
                    >
                      {option.optionKey}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-xs font-medium ${isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}
                    >
                      {option.textEn}
                    </Text>
                    {option.textBn && (
                      <Text className="text-[11px] text-slate-500 font-sans">{option.textBn}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Toolbar */}
      <View className="bg-white px-5 py-3 border-t border-slate-200 flex-row items-center justify-between">
        <TouchableOpacity
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentIndex(currentQuestionIndex - 1)}
          className={`px-4 py-2.5 rounded-xl border flex-row items-center ${
            currentQuestionIndex === 0 ? 'border-slate-200 opacity-40' : 'border-slate-300 bg-white'
          }`}
        >
          <ChevronLeft color="#334155" size={16} />
          <Text className="text-xs font-bold text-slate-700 ml-1">Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSubmitModalOpen(true)}
          className="px-5 py-2.5 bg-rose-600 rounded-xl"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">Submit Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={currentQuestionIndex === totalQuestions - 1}
          onPress={() => setCurrentIndex(currentQuestionIndex + 1)}
          className={`px-4 py-2.5 rounded-xl border flex-row items-center ${
            currentQuestionIndex === totalQuestions - 1
              ? 'border-slate-200 opacity-40'
              : 'border-slate-300 bg-white'
          }`}
        >
          <Text className="text-xs font-bold text-slate-700 mr-1">Next</Text>
          <ChevronRight color="#334155" size={16} />
        </TouchableOpacity>
      </View>

      {/* Question Navigator Grid Modal */}
      <Modal visible={isGridModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-900">Question Navigator</Text>
              <TouchableOpacity onPress={() => setIsGridModalOpen(false)}>
                <Text className="text-sm font-bold text-slate-500">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mb-4 text-xs font-semibold">
              <Text className="text-emerald-700">● {answeredCount} Answered</Text>
              <Text className="text-slate-500">○ {unansweredCount} Unanswered</Text>
              <Text className="text-amber-600">🚩 {Object.keys(flaggedMap).length} Flagged</Text>
            </View>

            <ScrollView className="space-y-2">
              <View className="flex-row flex-wrap gap-2 justify-center">
                {activeAttempt.questions.map((q: any, idx: number) => {
                  const isAns = !!answersMap[q.question.id];
                  const isCur = idx === currentQuestionIndex;
                  const isFlg = !!flaggedMap[q.question.id];

                  return (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => {
                        setCurrentIndex(idx);
                        setIsGridModalOpen(false);
                      }}
                      className={`w-11 h-11 rounded-xl items-center justify-center border ${
                        isCur
                          ? 'border-slate-900 bg-slate-900'
                          : isAns
                            ? 'bg-emerald-600 border-emerald-600'
                            : isFlg
                              ? 'bg-amber-100 border-amber-400'
                              : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isCur || isAns ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Submission Confirmation Modal */}
      <Modal visible={isSubmitModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 items-center justify-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <View className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 items-center justify-center mx-auto">
              <AlertCircle color="#e11d48" size={24} />
            </View>

            <View className="text-center items-center">
              <Text className="text-lg font-bold text-slate-900">Submit Examination?</Text>
              <Text className="text-xs text-slate-500 mt-1 text-center">
                You have answered{' '}
                <Text className="font-bold text-emerald-700">{answeredCount}</Text> of{' '}
                <Text className="font-bold text-slate-800">{totalQuestions}</Text> questions.
              </Text>
            </View>

            <View className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-row justify-between text-xs">
              <Text className="text-slate-600">Unanswered:</Text>
              <Text className="font-bold text-rose-600">{unansweredCount} Questions</Text>
            </View>

            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                onPress={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-3 border border-slate-300 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-white uppercase">
                  {isSubmitting ? 'Scoring...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
