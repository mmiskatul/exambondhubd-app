import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronRight, Layers, BookOpen, Lock, Sparkles } from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useAppSelector } from '../../src/store';
import { selectPortalByKey } from '../../src/store/slices/portalsSlice';
import { makeSelectHasAccess } from '../../src/store/slices/accessSlice';

type PortalYear = {
  year: number;
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
};

type PortalUnit = {
  id: string;
  key: string;
  titleEn: string;
  titleBn: string;
  badge?: string | null;
  questionCount: number;
};

type PortalSubject = {
  id: string;
  code: string;
  titleEn: string;
  titleBn: string;
  marks?: number | null;
  topics?: { id: string; titleEn: string; titleBn: string; _count?: { questions: number } }[];
  _count?: { questions: number };
  stats?: {
    questionsInPortal: number;
    chapterCount: number;
    chaptersWithQuestions: number;
    years: { year: number; count: number }[];
  };
};

export default function ExamPortalDetailScreen() {
  const router = useRouter();
  const { key, unitKey: initialUnitKey } = useLocalSearchParams<{
    key: string;
    unitKey?: string;
  }>();
  const examKey = typeof key === 'string' ? decodeURIComponent(key) : '';

  // The portal list is already in the store from the home screen, so the title
  // and unit pills paint on the first frame instead of after a round trip.
  const cached = useAppSelector(selectPortalByKey(examKey));

  // '' means the whole portal; a unit key narrows everything below to it.
  // Seeded from the route so a link that already knows which unit (a student's
  // own enrolled exam, say) lands there directly instead of showing the unit
  // picker again for something already decided.
  const [selectedUnit, setSelectedUnit] = useState<string>(
    typeof initialUnitKey === 'string' ? initialUnitKey : '',
  );

  // A package buys the ability to open this exam. The syllabus stays visible so
  // a student can see what they would be paying for.
  const hasAccess = useAppSelector(
    React.useMemo(
      () => makeSelectHasAccess(examKey, selectedUnit || undefined),
      [examKey, selectedUnit],
    ),
  );
  const isSignedIn = useAppSelector((st) => st.auth.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<{
    portal: any;
    units: PortalUnit[];
    years: PortalYear[];
    subjects: PortalSubject[];
    stats: { totalQuestions: number };
  }>({
    portal: cached ? { title: cached.title, bn: cached.bn, icon: cached.icon } : null,
    units: (cached?.units as PortalUnit[]) || [],
    years: [],
    subjects: [],
    stats: { totalQuestions: 0 },
  });

  useEffect(() => {
    async function loadPortal() {
      if (!examKey) return;
      setLoading(true);
      setError(null);

      const query = selectedUnit ? `?unitKey=${encodeURIComponent(selectedUnit)}` : '';
      const res = await mobileApi(`/exams/portal/${encodeURIComponent(examKey)}${query}`);

      if (res.success && res.data) {
        setPortalData({
          portal: res.data.portal || null,
          units: res.data.units?.length ? res.data.units : (cached?.units as PortalUnit[]) || [],
          years: res.data.years || [],
          subjects: res.data.subjects || [],
          stats: res.data.stats || { totalQuestions: 0 },
        });
      } else {
        setError(res.message || 'Could not load this exam portal.');
      }

      setLoading(false);
    }

    loadPortal();
  }, [examKey, selectedUnit]);

  const portalTitle = portalData.portal?.title || examKey;
  const activeUnit = portalData.units.find((u) => u.key === selectedUnit) || null;

  // An exam split into units (Medical / Dental, DU ক-ঘ) asks which one first,
  // and shows nothing else until that is answered — mixing every unit's papers
  // into one list is what made this screen confusing. A portal with no units
  // has nothing to ask, so it opens straight onto its content.
  const hasUnits = portalData.units.length > 0;
  const showUnitPicker = hasUnits && !selectedUnit;
  const portalSubtitle = activeUnit
    ? `${portalData.portal?.bn || ''} · ${activeUnit.titleBn}`
    : portalData.portal?.bn || '';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {/* Header */}
      <ScreenHeader
        title={portalTitle}
        subtitle={portalSubtitle || undefined}
        center
        onBack={() => {
          // Inside a unit, back steps out to the unit list rather than
          // leaving the exam altogether.
          if (activeUnit) setSelectedUnit('');
          else router.back();
        }}
        right={
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center shadow-xs"
          >
            <Text className="text-sm">🔔</Text>
          </TouchableOpacity>
        }
      />

      {/* Which unit you are inside stays on screen rather than scrolling away. */}
      {activeUnit && !loading && !error && (
        <View className="px-4 pt-3 bg-slate-50">
          <TouchableOpacity
            onPress={() => setSelectedUnit('')}
            className="flex-row items-center justify-between bg-slate-900 px-4 py-2.5 rounded-2xl"
          >
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Layers color="#34d399" size={15} />
              <Text className="text-xs font-bold text-white font-sans" numberOfLines={1}>
                {activeUnit.titleBn}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              ইউনিট বদলান
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#059669" className="py-16" />
      ) : error ? (
        <View className="p-8 items-center space-y-2">
          <Text className="text-sm font-bold text-slate-800">{error}</Text>
        </View>
      ) : showUnitPicker ? (
        /* ---- Stage one: which unit? ---- */
        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ইউনিট নির্বাচন করুন
          </Text>
          <Text className="text-[11px] text-slate-500 font-sans mt-1 mb-4">
            {portalTitle} এর কোন ইউনিটের প্রস্তুতি নিচ্ছেন?
          </Text>

          <View className="space-y-3">
            {portalData.units.map((u) => (
              <TouchableOpacity
                key={u.key}
                onPress={() => setSelectedUnit(u.key)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center gap-3"
              >
                <View className="w-11 h-11 rounded-2xl bg-emerald-50 items-center justify-center">
                  <Layers color="#059669" size={20} />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 font-sans">{u.titleBn}</Text>
                  <Text className="text-[11px] text-slate-500 mt-0.5">
                    {u.titleEn}
                    {u.badge ? ` · ${u.badge}` : ''}
                  </Text>

                  <View className="flex-row items-center gap-2 mt-2">
                    <View
                      className={`px-2 py-0.5 rounded ${
                        u.questionCount > 0 ? 'bg-emerald-50' : 'bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          u.questionCount > 0 ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {u.questionCount > 0 ? `${u.questionCount} MCQs` : 'প্রশ্ন যোগ হয়নি'}
                      </Text>
                    </View>
                  </View>
                </View>

                <ChevronRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* ---- Stage two: everything inside the chosen unit ---- */
        <ScrollView className="flex-1 px-4 py-4 space-y-4" showsVerticalScrollIndicator={false}>
          {!hasAccess && (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  (`/subscription/pay?portalKey=${encodeURIComponent(examKey)}` +
                    (selectedUnit ? `&unitKey=${encodeURIComponent(selectedUnit)}` : '')) as any,
                )
              }
              className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex-row items-center gap-3"
            >
              <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center">
                <Lock color="#b45309" size={18} />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-bold text-amber-900">
                  {isSignedIn ? 'এই পরীক্ষার প্যাকেজ কিনুন' : 'সাইন ইন করে প্যাকেজ কিনুন'}
                </Text>
                <Text className="text-[11px] text-amber-800 font-sans mt-0.5">
                  {activeUnit
                    ? `${activeUnit.titleBn} এর প্রশ্নপত্র ও মডেল টেস্ট খুলতে প্যাকেজ প্রয়োজন।`
                    : 'প্রশ্নপত্র ও মডেল টেস্ট খুলতে প্যাকেজ প্রয়োজন।'}
                </Text>
              </View>

              <ChevronRight color="#b45309" size={18} />
            </TouchableOpacity>
          )}

          {/* 1. What this unit holds */}
          <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md space-y-1">
            <Text className="text-base font-bold text-white leading-tight">
              {portalTitle}
              {activeUnit ? ` · ${activeUnit.titleBn}` : ''}
            </Text>
            <Text className="text-[11px] text-emerald-400 font-sans">
              {portalData.stats.totalQuestions} verified MCQs · {portalData.subjects.length} subject
              {portalData.subjects.length === 1 ? '' : 's'} · {portalData.years.length} question
              paper
              {portalData.years.length === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Build Your Own Test — pick subjects/chapters, get a randomly
              generated set of questions instead of browsing a fixed paper. */}
          <TouchableOpacity
            onPress={() => {
              if (!hasAccess) {
                router.push(
                  (`/subscription/pay?portalKey=${encodeURIComponent(examKey)}` +
                    (selectedUnit ? `&unitKey=${encodeURIComponent(selectedUnit)}` : '')) as any,
                );
                return;
              }
              router.push(
                (`/practice/custom?portalKey=${encodeURIComponent(examKey)}` +
                  (selectedUnit ? `&unitKey=${encodeURIComponent(selectedUnit)}` : '')) as any,
              );
            }}
            className="bg-emerald-600 p-4 rounded-2xl shadow-md flex-row items-center gap-3"
          >
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <Sparkles color="#ffffff" size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Build Your Own Test</Text>
              <Text className="text-[11px] text-emerald-100 font-sans">
                Pick subjects &amp; chapters — we'll randomly generate the questions
              </Text>
            </View>
            <ChevronRight color="#ffffff" size={18} />
          </TouchableOpacity>

          {/* 2. Subjects — each opens its own page of chapters and papers */}
          <View className="space-y-3 pt-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <BookOpen color="#059669" size={15} />
                <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  বিষয়সমূহ
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-emerald-600">
                {portalData.subjects.length} subjects
              </Text>
            </View>

            {portalData.subjects.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl border border-slate-200 items-center">
                <Text className="text-xs text-slate-400 text-center">
                  এই ইউনিটে এখনো কোনো বিষয় যোগ করা হয়নি।
                </Text>
              </View>
            ) : (
              portalData.subjects.map((sub) => {
                const count = sub.stats?.questionsInPortal ?? sub._count?.questions ?? 0;
                const chapterCount = sub.stats?.chapterCount ?? sub.topics?.length ?? 0;

                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() =>
                      router.push(
                        (`/subject/${sub.id}?portalKey=${encodeURIComponent(examKey)}` +
                          `&unitKey=${encodeURIComponent(selectedUnit)}`) as any,
                      )
                    }
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center gap-3"
                  >
                    <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
                      <BookOpen color="#059669" size={17} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">{sub.titleEn}</Text>
                      <Text className="text-xs text-slate-500 font-sans mt-0.5">
                        {sub.titleBn}
                        {sub.marks ? ` · ${sub.marks} marks` : ''}
                      </Text>

                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="bg-slate-100 px-2 py-0.5 rounded">
                          <Text className="text-[10px] font-bold text-slate-700">
                            {chapterCount} chapters
                          </Text>
                        </View>
                        <View
                          className={`px-2 py-0.5 rounded ${
                            count > 0 ? 'bg-emerald-50' : 'bg-slate-100'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              count > 0 ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {count > 0 ? `${count} MCQs` : 'প্রশ্ন যোগ হয়নি'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <ChevronRight color="#94a3b8" size={18} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* 3. Year-wise question papers */}
          <View className="space-y-3 pt-1">
            <View className="flex-row items-center gap-1.5">
              <Calendar color="#059669" size={16} />
              <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Question Papers by Year
              </Text>
            </View>

            {portalData.years.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl border border-slate-200 items-center">
                <Text className="text-sm font-bold text-slate-800">
                  No question papers published yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Papers for {activeUnit ? `${portalTitle} ${activeUnit.titleBn}` : portalTitle}{' '}
                  will appear here as soon as they are added.
                </Text>
              </View>
            ) : (
              portalData.years.map((item) => (
                <TouchableOpacity
                  key={item.year}
                  onPress={() => {
                    if (!hasAccess) {
                      router.push(
                        (`/subscription/pay?portalKey=${encodeURIComponent(examKey)}` +
                          (selectedUnit
                            ? `&unitKey=${encodeURIComponent(selectedUnit)}`
                            : '')) as any,
                      );
                      return;
                    }

                    router.push(
                      `/paper/${encodeURIComponent(examKey)}/${item.year}${
                        selectedUnit
                          ? `?unit=${encodeURIComponent(selectedUnit)}&unitBn=${encodeURIComponent(
                              activeUnit?.titleBn || selectedUnit,
                            )}`
                          : ''
                      }` as any,
                    );
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between"
                >
                  <View className="space-y-1 flex-1 pr-3">
                    <Text className="text-sm font-bold text-slate-900">
                      {portalTitle}
                      {activeUnit ? ` ${activeUnit.titleBn}` : ''} — {item.year}
                    </Text>
                    <Text className="text-xs text-slate-500 font-sans">
                      {item.questionCount} MCQs · {item.durationMinutes} মিনিট · {item.totalMarks}{' '}
                      নম্বর
                    </Text>
                  </View>

                  <View className="px-3.5 py-2 bg-emerald-600 rounded-xl flex-row items-center gap-1 shadow-sm">
                    <Text className="text-xs font-bold text-white">View Paper</Text>
                    <ChevronRight color="#ffffff" size={14} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View className="pb-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
