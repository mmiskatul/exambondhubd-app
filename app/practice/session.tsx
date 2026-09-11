import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Bookmark,
  RotateCcw,
  Sparkles,
  Trophy,
  Lock,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  startPractice,
  answer,
  next,
  previous,
  resetPractice,
  selectPracticeScore,
  type PracticeMode,
} from '../../src/store/slices/practiceSlice';
import { toggleBookmark } from '../../src/store/slices/bookmarksSlice';
import { useToast } from '../../src/components/Toast';
import { useLang } from '../../src/i18n';

/**
 * One question at a time, answer revealed immediately with its explanation —
 * the Practice tab's "Mistakes Sprint" and per-subject buttons used to be
 * alerts that went nowhere.
 */
export default function PracticeSessionScreen() {
  const { pick, t } = useLang();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const params = useLocalSearchParams<{
    mode?: string;
    title?: string;
    subtitle?: string;
    subjectId?: string;
    topicId?: string;
    portalKey?: string;
    unitKey?: string;
  }>();

  const { questions, answers, index, loading, error, lockedScope, finished } = useAppSelector(
    (s) => s.practice,
  );
  const score = useAppSelector(selectPracticeScore);
  const bookmarkIds = useAppSelector((s) => s.bookmarks.ids);
  const isSignedIn = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    dispatch(
      startPractice({
        mode: (params.mode as PracticeMode) || 'subject',
        title: params.title || 'Practice',
        subtitle: params.subtitle,
        subjectId: params.subjectId,
        topicId: params.topicId,
        portalKey: params.portalKey,
        unitKey: params.unitKey,
      }),
    );

    return () => {
      dispatch(resetPractice());
    };
  }, [params.mode, params.subjectId, params.topicId, params.portalKey, params.unitKey]);

  const question = questions[index];
  const chosen = question ? answers[question.id] : undefined;
  const correctKey = question?.options?.find((o: any) => o.isCorrect)?.optionKey;
  const isBookmarked = question ? bookmarkIds.includes(question.id) : false;

  function handleBookmark() {
    if (!question) return;
    if (!isSignedIn) {
      toast.error('Sign in to save questions for later.');
      return;
    }
    dispatch(toggleBookmark(question.id));
    toast.success(isBookmarked ? 'Removed from bookmarks.' : 'Saved to bookmarks.');
  }

  const header = (
    <ScreenHeader
      title={params.title || 'Practice'}
      subtitle={
        questions.length > 0 && !finished
          ? `Question ${index + 1} of ${questions.length}`
          : undefined
      }
      center
      right={
        <View className="w-9 items-end">
          {questions.length > 0 && !finished && (
            <Text className="text-[11px] font-bold text-emerald-600">{score.correct}✓</Text>
          )}
        </View>
      }
    />
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {header}

      {loading ? (
        <ActivityIndicator color="#059669" className="py-16" />
      ) : lockedScope ? (
        /* The server refused: no package covers this subject yet. Route
           straight to buying the one that would, rather than a dead-end
           error — this is the other half of "what you bought is what you
           can practice": a locked subject sends you to buy it, not to a
           confusing failure. */
        <View className="p-8 items-center space-y-3">
          <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center">
            <Lock color="#b45309" size={24} />
          </View>
          <Text className="text-sm font-bold text-slate-800 text-center">{t('buyPackage')}</Text>
          <Text className="text-xs text-slate-500 text-center leading-relaxed">{error}</Text>
          <TouchableOpacity
            onPress={() =>
              router.replace(
                (`/subscription/pay?portalKey=${encodeURIComponent(lockedScope.portalKey || '')}` +
                  (lockedScope.unitKey
                    ? `&unitKey=${encodeURIComponent(lockedScope.unitKey)}`
                    : '')) as any,
              )
            }
            className="px-6 py-3 bg-emerald-600 rounded-xl mt-2"
          >
            <Text className="text-xs font-bold text-white uppercase tracking-wider">
              {t('buyPackage')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="mt-1">
            <Text className="text-xs font-bold text-slate-500">{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <View className="p-8 items-center space-y-3">
          <Text className="text-sm font-bold text-slate-800 text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-5 py-2.5 bg-slate-900 rounded-xl"
          >
            <Text className="text-xs font-bold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : questions.length === 0 ? (
        <View className="p-8 items-center space-y-2">
          <Sparkles color="#94a3b8" size={32} />
          <Text className="text-sm font-bold text-slate-800 text-center">
            No questions here yet
          </Text>
          <Text className="text-xs text-slate-400 text-center">
            {params.mode === 'mistakes'
              ? 'Sit a mock test first — the ones you get wrong collect here.'
              : 'Questions for this topic will appear once they are published.'}
          </Text>
        </View>
      ) : finished ? (
        /* ---- Session summary ---- */
        <ScrollView className="flex-1 px-4 py-6">
          <View className="bg-slate-900 rounded-3xl p-6 items-center space-y-2">
            <Trophy color="#34d399" size={36} />
            <Text className="text-lg font-bold text-white">Practice complete</Text>
            <Text className="text-xs text-slate-400 font-sans">{params.title}</Text>

            <View className="flex-row gap-3 pt-4 w-full">
              {[
                { label: 'Correct', value: score.correct, color: 'text-emerald-400' },
                { label: 'Wrong', value: score.wrong, color: 'text-rose-400' },
                { label: 'Skipped', value: score.remaining, color: 'text-slate-400' },
              ].map((s) => (
                <View
                  key={s.label}
                  className="flex-1 bg-slate-800/70 rounded-2xl p-3 items-center border border-slate-700"
                >
                  <Text className={`text-xl font-black ${s.color}`}>{s.value}</Text>
                  <Text className="text-[10px] text-slate-400">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              dispatch(
                startPractice({
                  mode: (params.mode as PracticeMode) || 'subject',
                  title: params.title || 'Practice',
                  subjectId: params.subjectId,
                  topicId: params.topicId,
                  portalKey: params.portalKey,
                  unitKey: params.unitKey,
                }),
              )
            }
            className="mt-5 py-3.5 bg-emerald-600 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <RotateCcw color="#ffffff" size={16} />
            <Text className="text-xs font-bold text-white uppercase tracking-wider">
              Practice Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-3 py-3.5 bg-white border border-slate-200 rounded-2xl items-center"
          >
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">Done</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ---- One question ---- */
        <>
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  {question.subject && (
                    <Text className="text-[10px] font-bold text-emerald-700 uppercase">
                      {question.subject.titleEn}
                      {question.topic ? ` · ${question.topic.titleEn}` : ''}
                    </Text>
                  )}
                  <Text className="text-sm font-bold text-slate-900 leading-snug mt-1">
                    {pick(question, 'question')}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleBookmark} hitSlop={8}>
                  <Bookmark
                    color={isBookmarked ? '#059669' : '#94a3b8'}
                    fill={isBookmarked ? '#059669' : 'transparent'}
                    size={18}
                  />
                </TouchableOpacity>
              </View>

              <View className="space-y-2 pt-1">
                {question.options?.map((opt: any) => {
                  const picked = chosen === opt.optionKey;
                  const isRight = opt.optionKey === correctKey;

                  let box = 'bg-slate-50 border-slate-200';
                  let label = 'text-slate-800';

                  if (chosen) {
                    if (isRight) {
                      box = 'bg-emerald-50 border-emerald-400';
                      label = 'text-emerald-900 font-bold';
                    } else if (picked) {
                      box = 'bg-rose-50 border-rose-400';
                      label = 'text-rose-900 font-bold';
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={opt.id || opt.optionKey}
                      disabled={Boolean(chosen)}
                      onPress={() =>
                        dispatch(answer({ questionId: question.id, optionKey: opt.optionKey }))
                      }
                      className={`p-3 rounded-xl border flex-row items-center gap-2.5 ${box}`}
                    >
                      <View className="w-6 h-6 rounded-full bg-white border border-slate-300 items-center justify-center">
                        <Text className="text-xs font-bold text-slate-700">{opt.optionKey}</Text>
                      </View>
                      <Text className={`text-xs flex-1 ${label}`}>{pick(opt, 'text')}</Text>
                      {chosen && isRight && <CheckCircle2 color="#059669" size={16} />}
                      {chosen && picked && !isRight && <XCircle color="#e11d48" size={16} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {chosen && pick(question, 'explanation') && (
                <View className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1 mt-1">
                  <Text className="text-[10px] font-bold text-amber-800 uppercase">ব্যাখ্যা</Text>
                  <Text className="text-xs text-amber-950 font-sans leading-relaxed">
                    {pick(question, 'explanation')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="px-4 py-3 bg-white border-t border-slate-200 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => dispatch(previous())}
              disabled={index === 0}
              className={`px-4 py-3 rounded-xl border ${
                index === 0 ? 'border-slate-200 opacity-40' : 'border-slate-300'
              }`}
            >
              <ArrowLeft color="#334155" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => dispatch(next())}
              className="flex-1 py-3 bg-emerald-600 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Text className="text-xs font-bold text-white uppercase tracking-wider">
                {index === questions.length - 1 ? 'Finish' : chosen ? 'Next' : 'Skip'}
              </Text>
              <ArrowRight color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
