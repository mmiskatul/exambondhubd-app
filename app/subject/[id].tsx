import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Layers, Calendar, ChevronRight, Play, BookOpen } from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';

type Chapter = {
  id: string;
  titleEn: string;
  titleBn: string;
  _count?: { questions: number };
};

type Subject = {
  id: string;
  code: string;
  titleEn: string;
  titleBn: string;
  marks?: number | null;
  topics?: Chapter[];
  _count?: { questions: number };
  stats?: {
    questionsInPortal: number;
    chapterCount: number;
    chaptersWithQuestions: number;
    years: { year: number; count: number }[];
  };
};

/**
 * Third level of the drill-down: exam → unit → subject. Chapters and this
 * subject's papers used to be flattened onto the portal screen for every
 * subject at once, which buried them.
 */
export default function SubjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; portalKey?: string; unitKey?: string }>();

  const subjectId = typeof params.id === 'string' ? params.id : '';
  const portalKey = params.portalKey || '';
  const unitKey = params.unitKey || '';

  const [subject, setSubject] = useState<Subject | null>(null);
  const [scope, setScope] = useState<{ portal?: any; unit?: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!subjectId || !portalKey) return;
      setLoading(true);
      setError(null);

      // The portal's syllabus already carries each subject's chapters, per-chapter
      // counts and the years it appears in, so one request covers this page.
      const query = unitKey ? `?unitKey=${encodeURIComponent(unitKey)}` : '';
      const [subsRes, portalRes] = await Promise.all([
        mobileApi(`/portals/${encodeURIComponent(portalKey)}/subjects${query}`),
        mobileApi(`/exams/portal/${encodeURIComponent(portalKey)}${query}`),
      ]);

      if (subsRes.success && Array.isArray(subsRes.data)) {
        const found = subsRes.data.find((s: Subject) => s.id === subjectId);
        if (found) setSubject(found);
        else setError('This subject is no longer part of this unit.');
      } else {
        setError(subsRes.message || 'Could not load this subject.');
      }

      if (portalRes.success && portalRes.data) {
        setScope({
          portal: portalRes.data.portal,
          unit: (portalRes.data.units || []).find((u: any) => u.key === unitKey) || null,
        });
      }

      setLoading(false);
    }

    load();
  }, [subjectId, portalKey, unitKey]);

  function practise(extra: Record<string, string> = {}) {
    const qs = new URLSearchParams({
      mode: 'subject',
      subjectId,
      title: subject?.titleEn || 'Practice',
      subtitle: scope.unit?.titleBn || scope.portal?.title || '',
      portalKey,
      ...(unitKey ? { unitKey } : {}),
      ...extra,
    }).toString();
    router.push(`/practice/session?${qs}` as any);
  }

  const questionCount = subject?.stats?.questionsInPortal ?? subject?._count?.questions ?? 0;
  const chapters = subject?.topics || [];
  const years = subject?.stats?.years || [];

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {/* Header keeps the trail visible: exam · unit */}
      <ScreenHeader
        title={subject?.titleEn || 'Subject'}
        subtitle={`${scope.portal?.title || portalKey}${scope.unit ? ` · ${scope.unit.titleBn}` : ''}`}
      />

      {loading ? (
        <ActivityIndicator color="#059669" className="py-16" />
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
      ) : (
        <ScrollView className="flex-1 px-4 py-4 space-y-4" showsVerticalScrollIndicator={false}>
          {/* Overview */}
          <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-1">
            <Text className="text-base font-bold text-white leading-tight">
              {subject?.titleEn} ({subject?.titleBn})
            </Text>
            <Text className="text-[11px] text-emerald-400 font-sans">
              {questionCount} verified MCQs · {chapters.length} chapter
              {chapters.length === 1 ? '' : 's'}
              {subject?.marks ? ` · ${subject.marks} marks` : ''}
            </Text>
            <Text className="text-[10px] text-slate-400 font-sans">
              {subject?.stats?.chaptersWithQuestions ?? 0} of{' '}
              {subject?.stats?.chapterCount ?? chapters.length} chapters have questions
            </Text>

            <TouchableOpacity
              onPress={() => practise()}
              disabled={questionCount === 0}
              className={`mt-3 py-3 rounded-2xl flex-row items-center justify-center gap-2 ${
                questionCount > 0 ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <Play color={questionCount > 0 ? '#ffffff' : '#64748b'} size={14} />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  questionCount > 0 ? 'text-white' : 'text-slate-500'
                }`}
              >
                {questionCount > 0 ? 'এই বিষয়ে অনুশীলন করুন' : 'প্রশ্ন যোগ হয়নি'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* This subject's papers */}
          {years.length > 0 && (
            <View className="space-y-3 pt-1">
              <View className="flex-row items-center gap-1.5">
                <Calendar color="#0891b2" size={15} />
                <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Question Papers
                </Text>
              </View>

              {years.map((y) => (
                <TouchableOpacity
                  key={y.year}
                  onPress={() =>
                    router.push(
                      (`/paper/${encodeURIComponent(portalKey)}/${y.year}` +
                        (unitKey
                          ? `?unit=${encodeURIComponent(unitKey)}&unitBn=${encodeURIComponent(
                              scope.unit?.titleBn || unitKey,
                            )}`
                          : '')) as any,
                    )
                  }
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-sm font-bold text-slate-900">
                      {y.year} Admission Test
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {y.count} question{y.count === 1 ? '' : 's'} from {subject?.titleEn}
                    </Text>
                  </View>
                  <ChevronRight color="#94a3b8" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chapters */}
          <View className="space-y-3 pt-1 pb-8">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Layers color="#2563eb" size={15} />
                <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  অধ্যায়সমূহ
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-slate-400">
                {chapters.length} chapters
              </Text>
            </View>

            {chapters.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl border border-slate-200 items-center">
                <BookOpen color="#94a3b8" size={22} />
                <Text className="text-xs text-slate-400 text-center mt-2">
                  এই বিষয়ে এখনো কোনো অধ্যায় যোগ করা হয়নি।
                </Text>
              </View>
            ) : (
              chapters.map((ch) => {
                const n = ch._count?.questions || 0;

                return (
                  <TouchableOpacity
                    key={ch.id}
                    disabled={n === 0}
                    onPress={() => practise({ topicId: ch.id, title: ch.titleEn })}
                    className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between ${
                      n === 0 ? 'opacity-60' : ''
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold text-slate-900">{ch.titleEn}</Text>
                      <Text className="text-xs text-slate-500 font-sans mt-0.5">{ch.titleBn}</Text>
                      <Text
                        className={`text-[11px] mt-1.5 font-bold ${
                          n > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {n > 0 ? `${n} solved questions with explanation` : 'প্রশ্ন যোগ হয়নি'}
                      </Text>
                    </View>
                    {n > 0 && <ChevronRight color="#94a3b8" size={18} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
