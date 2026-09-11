import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  Clock,
  ChevronRight,
  Target,
  Flame,
  PlayCircle,
  Lock,
} from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchProfile } from '../../src/store/slices/authSlice';
import { fetchAccess, hasAccess } from '../../src/store/slices/accessSlice';
import { useExamStore } from '../../src/store/useExamStore';
import { useToast } from '../../src/components/Toast';

/** Attempts that can still be resumed rather than reviewed. */
const OPEN_STATUSES = ['CREATED', 'IN_PROGRESS'];

export default function MyExamsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const setAttempt = useExamStore((state) => state.setAttempt);

  const profile = useAppSelector((s) => s.auth.user?.profile);
  const isSignedIn = useAppSelector((s) => s.auth.isAuthenticated);
  const access = useAppSelector((s) => s.access);

  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumingId, setResumingId] = useState<string | null>(null);

  async function handleResume(attemptId: string) {
    setResumingId(attemptId);
    const res = await mobileApi(`/attempts/${attemptId}`);
    setResumingId(null);

    if (res.success && res.data) {
      setAttempt(res.data);
      router.push(`/exam/${res.data.examId}/live` as any);
    } else {
      toast.error(res.message || 'Could not resume this exam.');
    }
  }

  useEffect(() => {
    load();
  }, [isSignedIn]);

  async function load() {
    setLoading(true);

    const [examsRes, attemptsRes] = await Promise.all([
      mobileApi('/exams'),
      isSignedIn
        ? mobileApi('/attempts?limit=20')
        : Promise.resolve({ success: true, data: { items: [] } }),
    ]);

    if (examsRes.success && Array.isArray(examsRes.data)) setExams(examsRes.data);
    if (attemptsRes.success && attemptsRes.data?.items) setAttempts(attemptsRes.data.items);

    if (isSignedIn) {
      dispatch(fetchProfile());
      dispatch(fetchAccess());
    }
    setLoading(false);
  }

  const resumable = attempts.filter((a) => OPEN_STATUSES.includes(a.status));
  const finished = attempts.filter((a) => !OPEN_STATUSES.includes(a.status));

  const stats = [
    { label: 'Tests taken', value: profile?.totalExams ?? 0, icon: GraduationCap },
    {
      label: 'Accuracy',
      value: profile?.accuracy ? `${profile.accuracy.toFixed(0)}%` : '—',
      icon: Target,
    },
    { label: 'Day streak', value: profile?.studyStreak ?? 0, icon: Flame },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-4 py-3.5 bg-white border-b border-slate-200">
        <Text className="text-lg font-bold text-slate-900">Model Tests</Text>
        <Text className="text-xs text-slate-500 font-sans">মডেল টেস্ট ও আমার ফলাফল</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4 space-y-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor="#059669" />
        }
      >
        {/* Real progress, or an honest prompt when there is none yet */}
        <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
          <Text className="text-sm font-bold text-white">আমার অগ্রগতি</Text>
          <Text className="text-[11px] text-slate-400 font-sans mt-0.5">
            {(profile?.totalExams ?? 0) > 0
              ? `গড় স্কোর ${(profile?.averageScore ?? 0).toFixed(1)}`
              : 'একটি মডেল টেস্ট দিলে এখানে আপনার ফলাফল দেখা যাবে।'}
          </Text>

          <View className="flex-row gap-3 pt-4">
            {stats.map((s) => (
              <View
                key={s.label}
                className="flex-1 bg-slate-800/70 rounded-2xl p-3 items-center border border-slate-700"
              >
                <s.icon color="#34d399" size={15} />
                <Text className="text-lg font-black text-white mt-1">{s.value}</Text>
                <Text className="text-[10px] text-slate-400 text-center">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Anything left unfinished */}
        {resumable.length > 0 && (
          <View className="space-y-3">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Continue where you left off
            </Text>

            {resumable.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => handleResume(a.id)}
                disabled={resumingId === a.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex-row items-center gap-3"
              >
                {resumingId === a.id ? (
                  <ActivityIndicator color="#d97706" size="small" />
                ) : (
                  <PlayCircle color="#d97706" size={22} />
                )}
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">{a.exam?.titleEn}</Text>
                  <Text className="text-xs text-slate-500 font-sans mt-0.5">
                    {a.exam?.titleBn}
                    {a.exam?.unit ? ` · ${a.exam.unit.titleBn}` : ''}
                  </Text>
                </View>
                <ChevronRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Real results */}
        {finished.length > 0 && (
          <View className="space-y-3">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Results ({finished.length})
            </Text>

            {finished.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() =>
                  router.push({
                    pathname: `/exam/${a.examId}/result`,
                    params: { attemptId: a.id },
                  } as any)
                }
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center gap-3"
              >
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    a.percentage >= 50 ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  <Text
                    className={`text-sm font-black ${
                      a.percentage >= 50 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {Math.round(a.percentage)}%
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                    {a.exam?.titleEn}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {a.score} / {a.maxScore} · {a.correctCount} correct · {a.wrongCount} wrong
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">
                    {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}
                  </Text>
                </View>

                <ChevronRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Everything published, straight from the dashboard */}
        <View className="space-y-3 pb-8">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available Model Tests ({exams.length})
          </Text>

          {loading && exams.length === 0 ? (
            <ActivityIndicator color="#059669" className="py-8" />
          ) : exams.length === 0 ? (
            <View className="p-8 bg-white rounded-2xl border border-slate-200 items-center space-y-2">
              <GraduationCap color="#94a3b8" size={30} />
              <Text className="text-sm font-bold text-slate-800">No model tests published yet</Text>
              <Text className="text-xs text-slate-400 text-center">
                এখনো কোনো মডেল টেস্ট প্রকাশ করা হয়নি। প্রকাশ করা হলে এখানে দেখা যাবে।
              </Text>
            </View>
          ) : (
            exams.map((exam) => {
              const owned =
                !isSignedIn || !exam.portal
                  ? true
                  : hasAccess(access, exam.portal.key, exam.unit?.key);

              return (
                <View
                  key={exam.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        {exam.portal && (
                          <Text className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {exam.portal.titleEn}
                            {exam.unit ? ` · ${exam.unit.titleBn}` : ''}
                          </Text>
                        )}
                        {exam.category && (
                          <Text className="text-[10px] font-bold text-slate-500">
                            {exam.category.titleEn}
                          </Text>
                        )}
                        {!owned && (
                          <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded">
                            <Lock color="#b45309" size={9} />
                            <Text className="text-[10px] font-bold text-amber-700">LOCKED</Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-base font-bold text-slate-900 pt-1">
                        {exam.titleEn}
                      </Text>
                      <Text className="text-xs text-slate-500 font-sans">{exam.titleBn}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push(`/exam/${exam.id}/instructions` as any)}
                      className={`px-3 py-1.5 rounded-xl shadow-sm ${owned ? 'bg-emerald-600' : 'bg-slate-800'}`}
                    >
                      <Text className="text-xs font-bold text-white">
                        {owned ? 'Start Test' : 'Unlock'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    <View className="bg-slate-100 px-2 py-0.5 rounded flex-row items-center gap-1">
                      <Clock color="#475569" size={10} />
                      <Text className="text-[10px] font-bold text-slate-600">
                        {exam.durationMinutes} mins
                      </Text>
                    </View>
                    <View className="bg-slate-100 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-slate-600">
                        {exam.totalQuestions} MCQs
                      </Text>
                    </View>
                    {exam.negativeMark > 0 && (
                      <View className="bg-rose-50 px-2 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-rose-700">
                          −{exam.negativeMark} per wrong
                        </Text>
                      </View>
                    )}
                    {exam.passMarks != null && (
                      <View className="bg-purple-50 px-2 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-purple-700">
                          Pass: {exam.passMarks}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
