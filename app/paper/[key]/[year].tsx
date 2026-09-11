import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '../../../src/components/SafeScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  Award,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { mobileApi } from '../../../src/services/api';
import { useToast } from '../../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../../src/store';
import { toggleBookmark, fetchBookmarks } from '../../../src/store/slices/bookmarksSlice';
import { useLang } from '../../../src/i18n';

export default function YearWiseQuestionPaperScreen() {
  const { pick } = useLang();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const bookmarkIds = useAppSelector((st) => st.bookmarks.ids);
  const isSignedIn = useAppSelector((st) => st.auth.isAuthenticated);

  useEffect(() => {
    if (isSignedIn) dispatch(fetchBookmarks());
  }, [isSignedIn]);

  // This used to only toast — the bookmark was never saved anywhere.
  function handleBookmark(questionId: string) {
    if (!isSignedIn) {
      toast.error('Sign in to save questions for later.');
      return;
    }
    const wasSaved = bookmarkIds.includes(questionId);
    dispatch(toggleBookmark(questionId));
    toast.success(wasSaved ? 'Removed from bookmarks.' : 'Saved to bookmarks.');
  }
  const {
    key,
    year,
    unit,
    unitBn: unitBnParam,
  } = useLocalSearchParams<{
    key: string;
    year: string;
    unit?: string;
    unitBn?: string;
  }>();
  const examKey = typeof key === 'string' ? decodeURIComponent(key) : '';
  const examYear = typeof year === 'string' ? year : '';
  // Carried from the portal screen so the paper stays inside one unit.
  const unitKey = typeof unit === 'string' ? decodeURIComponent(unit) : '';
  const unitBn = typeof unitBnParam === 'string' ? decodeURIComponent(unitBnParam) : '';

  const [mode, setMode] = useState<'study' | 'test'>('study');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [locked, setLocked] = useState<{ portalKey?: string; unitKey?: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [unitLabel, setUnitLabel] = useState('');

  // The portal screen passes the Bangla label along, so the header is correct
  // on first paint. The lookup below is only a fallback for a direct deep link.
  useEffect(() => {
    if (!examKey || !unitKey) {
      setUnitLabel('');
      return;
    }

    if (unitBn) {
      setUnitLabel(unitBn);
      return;
    }

    setUnitLabel(unitKey);

    mobileApi('/categories/portals').then((res) => {
      if (!res.success || !res.data) return;
      const all = [...(res.data.university || []), ...(res.data.jobs || [])];
      const match = all
        .find((p: any) => p.key === examKey)
        ?.units?.find((u: any) => u.key === unitKey);
      if (match) setUnitLabel(match.titleBn);
    });
  }, [examKey, unitKey, unitBn]);

  // Test Mode States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    correct: number;
    wrong: number;
    unanswered: number;
    totalScore: number;
  } | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [examKey, examYear, unitKey]);

  async function loadQuestions() {
    setLoading(true);
    setLocked(null);
    const res = await mobileApi(
      `/questions?year=${examYear}&portalKey=${encodeURIComponent(examKey)}` +
        (unitKey ? `&unitKey=${encodeURIComponent(unitKey)}` : '') +
        '&limit=100',
    );

    if (res.success && res.data && res.data.items) {
      setQuestions(res.data.items);
    } else {
      setQuestions([]);
      if ((res as any).error?.code === 'SUBSCRIPTION_REQUIRED') {
        setLocked({
          portalKey: (res as any).error?.details?.portalKey || examKey,
          unitKey: (res as any).error?.details?.unitKey || unitKey,
        });
      }
    }
    setLoading(false);
  }

  // Filter questions by subject
  const availableSubjects = Array.from(
    new Set(questions.map((q) => q.subject?.titleEn || 'General')),
  );

  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject === 'ALL') return true;
    return (q.subject?.titleEn || 'General') === selectedSubject;
  });

  function handleSelectOption(questionId: string, optionKey: string) {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  }

  function handleSubmitTest() {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    filteredQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correctOpt = q.options?.find((o: any) => o.isCorrect)?.optionKey;

      if (!selected) {
        unanswered += 1;
      } else if (selected === correctOpt) {
        correct += 1;
      } else {
        wrong += 1;
      }
    });

    const totalScore = Number((correct * 1.0 - wrong * 0.25).toFixed(2));
    setScoreResult({ correct, wrong, unanswered, totalScore });
    setIsSubmitted(true);
  }

  function handleResetTest() {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScoreResult(null);
  }

  function renderQuestion({ item: q, index: idx }: { item: any; index: number }) {
    const userSelected = selectedAnswers[q.id];

    return (
      <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Question Header */}
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-row items-start gap-2 flex-1">
            <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center mt-0.5">
              <Text className="text-xs font-bold text-slate-700">{idx + 1}</Text>
            </View>
            <View className="flex-1 space-y-0.5">
              {q.subject && (
                <Text className="text-[10px] font-bold text-emerald-700 uppercase">
                  {q.subject.titleEn}
                </Text>
              )}
              <Text className="text-sm font-bold text-slate-900 leading-snug">
                {pick(q, 'question')}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => handleBookmark(q.id)} hitSlop={8}>
            <Bookmark
              color={bookmarkIds.includes(q.id) ? '#059669' : '#94a3b8'}
              fill={bookmarkIds.includes(q.id) ? '#059669' : 'transparent'}
              size={16}
            />
          </TouchableOpacity>
        </View>

        {/* MCQ Options Grid */}
        <View className="space-y-2 pt-1">
          {q.options?.map((opt: any) => {
            const isChoice = userSelected === opt.optionKey;
            const isRight = opt.isCorrect;

            let optionBg = 'bg-slate-50 border-slate-200';
            let optionText = 'text-slate-800';

            if (mode === 'study') {
              if (isRight) {
                optionBg = 'bg-emerald-50 border-emerald-400';
                optionText = 'text-emerald-900 font-bold';
              }
            } else if (isSubmitted) {
              if (isRight) {
                optionBg = 'bg-emerald-50 border-emerald-400';
                optionText = 'text-emerald-900 font-bold';
              } else if (isChoice && !isRight) {
                optionBg = 'bg-rose-50 border-rose-400';
                optionText = 'text-rose-900 font-bold';
              }
            } else if (isChoice) {
              optionBg = 'bg-emerald-50 border-emerald-600';
              optionText = 'text-emerald-900 font-bold';
            }

            return (
              <TouchableOpacity
                key={opt.id || opt.optionKey}
                onPress={() => handleSelectOption(q.id, opt.optionKey)}
                disabled={mode === 'study' || isSubmitted}
                className={`p-3 rounded-xl border flex-row items-center gap-2.5 ${optionBg}`}
              >
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center font-bold text-xs ${
                    isRight && (mode === 'study' || isSubmitted)
                      ? 'bg-emerald-600 text-white'
                      : isChoice
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isChoice || (isRight && (mode === 'study' || isSubmitted))
                        ? 'text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {opt.optionKey}
                  </Text>
                </View>

                <Text className={`text-xs flex-1 ${optionText}`}>{pick(opt, 'text')}</Text>

                {isRight && (mode === 'study' || isSubmitted) && (
                  <CheckCircle2 color="#059669" size={16} />
                )}
                {isChoice && !isRight && isSubmitted && <XCircle color="#e11d48" size={16} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation in Study Mode or after Submission */}
        {(mode === 'study' || isSubmitted) && pick(q, 'explanation') && (
          <View className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs space-y-1 mt-2">
            <View className="flex-row items-center gap-1 text-amber-800 font-bold">
              <Sparkles color="#d97706" size={12} />
              <Text className="text-[10px] font-bold text-amber-800 uppercase">
                ব্যাখ্যা ও প্রমিত পাঠ্যবই তথ্য:
              </Text>
            </View>
            <Text className="text-xs text-amber-950 font-sans leading-relaxed">
              {pick(q, 'explanation')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {/* Top Header Bar */}
      <ScreenHeader
        title={`${examKey}${unitLabel ? ` ${unitLabel}` : ''} — ${examYear}`}
        subtitle={`${questions.length} Questions Solved Paper`}
        center
        right={
          <View className="flex-row bg-slate-100 p-1 rounded-xl border border-slate-200">
            <TouchableOpacity
              onPress={() => {
                setMode('study');
                setIsSubmitted(false);
              }}
              className={`px-2.5 py-1 rounded-lg ${
                mode === 'study' ? 'bg-emerald-600 shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  mode === 'study' ? 'text-white' : 'text-slate-600'
                }`}
              >
                Study
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('test')}
              className={`px-2.5 py-1 rounded-lg ${
                mode === 'test' ? 'bg-emerald-600 shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  mode === 'test' ? 'text-white' : 'text-slate-600'
                }`}
              >
                Test
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <ActivityIndicator color="#059669" className="py-12" />
      ) : locked ? (
        <View className="p-8 bg-white rounded-2xl border border-slate-200 items-center space-y-3 m-4">
          <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center">
            <Lock color="#b45309" size={24} />
          </View>
          <Text className="text-sm font-bold text-slate-800 text-center">
            A package is needed to view this paper
          </Text>
          <Text className="text-xs text-slate-500 text-center leading-relaxed">
            Buy the package that covers this exam to unlock every question here.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push(
                (`/subscription/pay?portalKey=${encodeURIComponent(locked.portalKey || '')}` +
                  (locked.unitKey ? `&unitKey=${encodeURIComponent(locked.unitKey)}` : '')) as any,
              )
            }
            className="px-6 py-3 bg-emerald-600 rounded-xl mt-1"
          >
            <Text className="text-xs font-bold text-white uppercase tracking-wider">
              Buy Package
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          keyExtractor={(q) => q.id}
          renderItem={renderQuestion}
          extraData={[selectedAnswers, isSubmitted, mode]}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="space-y-4 mb-4">
              {/* Test Result Score Banner */}
              {isSubmitted && scoreResult && (
                <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Award color="#34d399" size={24} />
                      <Text className="text-base font-bold text-white">Your Test Score</Text>
                    </View>
                    <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      <Text className="text-xs font-black text-emerald-400">
                        {scoreResult.totalScore} / {filteredQuestions.length}
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-3 gap-2 text-center pt-1">
                    <View className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/20">
                      <Text className="text-base font-bold text-emerald-400">
                        {scoreResult.correct}
                      </Text>
                      <Text className="text-[10px] text-emerald-200">Correct (+1)</Text>
                    </View>
                    <View className="p-2.5 bg-rose-950/40 rounded-xl border border-rose-500/20">
                      <Text className="text-base font-bold text-rose-400">{scoreResult.wrong}</Text>
                      <Text className="text-[10px] text-rose-200">Wrong (-0.25)</Text>
                    </View>
                    <View className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                      <Text className="text-base font-bold text-slate-300">
                        {scoreResult.unanswered}
                      </Text>
                      <Text className="text-[10px] text-slate-400">Skipped</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleResetTest}
                    className="py-2.5 bg-emerald-600 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <RotateCcw color="#ffffff" size={14} />
                    <Text className="text-xs font-bold text-white">Retake Test</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Subject Filter Pills */}
              {availableSubjects.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  <TouchableOpacity
                    onPress={() => setSelectedSubject('ALL')}
                    className={`px-3 py-1.5 rounded-xl border ${
                      selectedSubject === 'ALL'
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedSubject === 'ALL' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      All Subjects ({questions.length})
                    </Text>
                  </TouchableOpacity>

                  {availableSubjects.map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setSelectedSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        selectedSubject === sub
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedSubject === sub ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="p-8 bg-white rounded-2xl border border-slate-200 text-center items-center space-y-2 m-4">
              <HelpCircle color="#94a3b8" size={32} />
              <Text className="text-sm font-bold text-slate-800">
                No questions found for {unitLabel ? `${unitLabel} ` : ''}
                {examYear}
              </Text>
              <Text className="text-xs text-slate-400 text-center">
                Questions uploaded in Admin Dashboard under year {examYear} will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={
            mode === 'test' && !isSubmitted && filteredQuestions.length > 0 ? (
              <TouchableOpacity
                onPress={handleSubmitTest}
                className="py-4 bg-emerald-600 rounded-2xl items-center shadow-md mt-6"
              >
                <Text className="text-sm font-bold text-white uppercase tracking-wider">
                  Submit & Check Marks
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
