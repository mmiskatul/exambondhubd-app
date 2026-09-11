import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Flame, BookOpen, ChevronRight, GraduationCap, Briefcase } from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchPortals } from '../../src/store/slices/portalsSlice';
import { fetchProfile } from '../../src/store/slices/authSlice';

export default function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const university = useAppSelector((st) => st.portals.university);
  const jobs = useAppSelector((st) => st.portals.jobs);
  const portalsError = useAppSelector((st) => st.portals.error);
  const studyStreak = useAppSelector((st) => st.auth.user?.profile?.studyStreak || 0);
  const isSignedIn = useAppSelector((st) => st.auth.isAuthenticated);

  const [popularExams, setPopularExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    dispatch(fetchPortals());

    if (isSignedIn) {
      dispatch(fetchProfile());
      mobileApi('/notifications/my').then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
        }
      });
    } else {
      setUnreadCount(0);
    }

    mobileApi('/exams').then((res) => {
      if (res.success && Array.isArray(res.data)) setPopularExams(res.data);
      setLoading(false);
    });
  }, [isSignedIn]);

  // Surface a connectivity failure instead of leaving a blank screen.
  useEffect(() => {
    if (portalsError) toast.error(portalsError);
  }, [portalsError]);

  const portals = { university, jobs };

  const activeUniversityExams = (portals.university || []).filter((p) => p.isEnabled !== false);
  const activeJobExams = (portals.jobs || []).filter((p) => p.isEnabled !== false);

  function handleExamCategoryClick(categoryName: string) {
    router.push(`/portal/${encodeURIComponent(categoryName)}` as any);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4 py-2 space-y-6" showsVerticalScrollIndicator={false}>
        {/* Top Minimalist Action Bar */}
        <View className="flex-row items-center justify-between pb-1">
          {studyStreak > 0 ? (
            <View className="flex-row items-center bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-sm">
              <Flame color="#f59e0b" size={16} />
              <Text className="text-xs font-bold text-amber-700 ml-1.5">
                {studyStreak} Day{studyStreak === 1 ? '' : 's'} Streak
              </Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center relative shadow-sm"
          >
            <Text className="text-base">🔔</Text>
            {unreadCount > 0 && (
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </TouchableOpacity>
        </View>

        {/* 🎓 SECTION 1: University & Admission Exams */}
        {activeUniversityExams.length > 0 && (
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <GraduationCap color="#2563eb" size={18} />
                <Text className="text-base font-bold text-slate-900">
                  University & Admission Exams
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-blue-600">বিশ্ববিদ্যালয় ভর্তি</Text>
            </View>

            {/* 3-Column Responsive Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-2.5">
              {activeUniversityExams.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={() => handleExamCategoryClick(item.key)}
                  className={`w-[31.5%] p-2.5 sm:p-3 rounded-2xl border ${item.color || 'bg-white border-slate-200'} shadow-xs items-center justify-between min-h-[110px]`}
                >
                  <Text className="text-2xl mb-1">{item.icon}</Text>
                  <Text className="text-xs font-bold text-slate-900 text-center leading-tight">
                    {item.title}
                  </Text>
                  <Text
                    className="text-[10px] text-slate-500 font-sans text-center mt-0.5"
                    numberOfLines={1}
                  >
                    {item.bn}
                  </Text>
                  <View className="mt-1.5 bg-white/90 px-1.5 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                    <Text className="text-[9px] font-bold text-slate-700">{item.badge}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Invisible spacers so last row (Agriculture & CKRUET) sits side-by-side with no gap in the middle */}
              {activeUniversityExams.length % 3 === 2 && (
                <View className="w-[31.5%]" pointerEvents="none" />
              )}
              {activeUniversityExams.length % 3 === 1 && (
                <>
                  <View className="w-[31.5%]" pointerEvents="none" />
                  <View className="w-[31.5%]" pointerEvents="none" />
                </>
              )}
            </View>
          </View>
        )}

        {/* 💼 SECTION 2: Job & Govt Career Exams */}
        {activeJobExams.length > 0 && (
          <View className="space-y-3 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Briefcase color="#059669" size={18} />
                <Text className="text-base font-bold text-slate-900">Job & Career Exams</Text>
              </View>
              <Text className="text-[11px] font-bold text-emerald-600">চাকরি পরীক্ষা</Text>
            </View>

            {/* 2-Column Responsive Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-2.5">
              {activeJobExams.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  onPress={() => handleExamCategoryClick(item.key)}
                  className={`w-[48.5%] p-3.5 rounded-2xl border ${item.color || 'bg-white border-slate-200'} shadow-xs flex-row items-center gap-3`}
                >
                  <Text className="text-2xl">{item.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 leading-tight">
                      {item.title}
                    </Text>
                    <Text className="text-[10px] text-slate-500 font-sans mt-0.5" numberOfLines={1}>
                      {item.bn}
                    </Text>
                    <Text className="text-[9px] font-bold text-emerald-700 mt-1">{item.badge}</Text>
                  </View>
                  <ChevronRight color="#94a3b8" size={14} />
                </TouchableOpacity>
              ))}
              {activeJobExams.length % 2 === 1 && (
                <View className="w-[48.5%]" pointerEvents="none" />
              )}
            </View>
          </View>
        )}

        {/* 📝 Live Examination Catalog */}
        <View className="space-y-3 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">Live Mock Tests (2026 Ready)</Text>
            <TouchableOpacity onPress={() => router.push('/exams')}>
              <Text className="text-xs font-bold text-emerald-600">View All →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#059669" className="py-6" />
          ) : popularExams.length === 0 ? (
            <View className="p-8 bg-white rounded-2xl border border-slate-200 text-center items-center space-y-1">
              <BookOpen color="#94a3b8" size={24} />
              <Text className="text-xs font-bold text-slate-800">No active exams right now</Text>
              <Text className="text-[11px] text-slate-400">
                Exams published in dashboard will appear here instantly.
              </Text>
            </View>
          ) : (
            popularExams.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                onPress={() => router.push(`/exam/${exam.id}/instructions`)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[11px] font-bold text-emerald-600 uppercase">
                      {exam.category?.titleEn || 'Competitive'}
                    </Text>
                    {exam.isPremium && (
                      <View className="bg-amber-100 px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-amber-800">PRO</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-sm font-bold text-slate-900 mb-0.5" numberOfLines={1}>
                    {exam.titleEn}
                  </Text>
                  <Text className="text-xs text-slate-500 font-sans" numberOfLines={1}>
                    {exam.titleBn}
                  </Text>

                  <View className="flex-row items-center gap-3 mt-2">
                    <Text className="text-[11px] font-medium text-slate-500">
                      ⏱️ {exam.durationMinutes}m
                    </Text>
                    <Text className="text-[11px] font-medium text-slate-500">
                      📝 {exam.totalQuestions} MCQs
                    </Text>
                    <Text className="text-[11px] font-medium text-slate-500">
                      -{exam.negativeMark} Neg
                    </Text>
                  </View>
                </View>

                <ChevronRight color="#94a3b8" size={20} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
