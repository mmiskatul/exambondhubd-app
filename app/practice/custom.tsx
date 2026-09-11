import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Minus, Plus, Sparkles, ChevronDown } from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useExamStore } from '../../src/store/useExamStore';
import { useToast } from '../../src/components/Toast';

type Topic = { id: string; titleEn: string; titleBn: string; _count?: { questions: number } };
type Subject = { id: string; titleEn: string; titleBn: string; topics?: Topic[] };

type Selection = { subjectId: string; topicIds: string[] };

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-sm font-semibold text-slate-800">{label}</Text>
      <View className="flex-row items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 items-center justify-center"
        >
          <Minus color="#334155" size={14} />
        </TouchableOpacity>
        <Text className="text-sm font-bold text-slate-900 w-14 text-center">
          {value}
          {suffix || ''}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, Number((value + step).toFixed(2))))}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 items-center justify-center"
        >
          <Plus color="#334155" size={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CustomTestBuilderScreen() {
  const router = useRouter();
  const toast = useToast();
  const setAttempt = useExamStore((state) => state.setAttempt);

  const { portalKey, unitKey } = useLocalSearchParams<{ portalKey: string; unitKey?: string }>();
  const key = typeof portalKey === 'string' ? decodeURIComponent(portalKey) : '';
  const unit = typeof unitKey === 'string' && unitKey ? decodeURIComponent(unitKey) : undefined;

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(20);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMark, setNegativeMark] = useState(0.25);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!key) return;
      setLoading(true);
      const query = unit ? `?unitKey=${encodeURIComponent(unit)}` : '';
      const res = await mobileApi(`/portals/${encodeURIComponent(key)}/subjects${query}`);
      if (res.success && Array.isArray(res.data)) setSubjects(res.data);
      setLoading(false);
    }
    load();
  }, [key, unit]);

  function toggleSubject(subjectId: string) {
    setSelections((prev) => {
      const exists = prev.find((s) => s.subjectId === subjectId);
      if (exists) return prev.filter((s) => s.subjectId !== subjectId);
      return [...prev, { subjectId, topicIds: [] }];
    });
  }

  function toggleTopic(subjectId: string, topicId: string) {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.subjectId !== subjectId) return s;
        const has = s.topicIds.includes(topicId);
        return {
          ...s,
          topicIds: has ? s.topicIds.filter((t) => t !== topicId) : [...s.topicIds, topicId],
        };
      }),
    );
  }

  async function handleGenerate() {
    if (selections.length === 0) {
      toast.error('Pick at least one subject.');
      return;
    }

    setGenerating(true);
    const res = await mobileApi('/attempts/custom', {
      method: 'POST',
      body: JSON.stringify({
        portalKey: key,
        unitKey: unit,
        subjects: selections,
        questionCount,
        marksPerQuestion,
        negativeMark,
      }),
    });
    setGenerating(false);

    if (res.success && res.data) {
      setAttempt(res.data);
      router.replace(`/exam/${res.data.examId}/live` as any);
    } else if ((res as any).error?.code === 'SUBSCRIPTION_REQUIRED') {
      router.push(
        (`/subscription/pay?portalKey=${encodeURIComponent(key)}` +
          (unit ? `&unitKey=${encodeURIComponent(unit)}` : '')) as any,
      );
    } else {
      toast.error(res.message || 'Could not generate your test.');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      <ScreenHeader title="Build Your Own Test" />

      {loading ? (
        <ActivityIndicator color="#059669" className="py-16" />
      ) : (
        <ScrollView className="flex-1 px-4 py-4 space-y-4" showsVerticalScrollIndicator={false}>
          <View className="bg-slate-900 p-4 rounded-2xl flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center">
              <Sparkles color="#34d399" size={18} />
            </View>
            <Text className="text-xs text-slate-300 flex-1 leading-relaxed">
              Pick subjects (and chapters, if you want to narrow it down) — we'll randomly pull
              questions from the question bank for you. You never pick individual questions.
            </Text>
          </View>

          <View>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Subjects
            </Text>

            {subjects.length === 0 ? (
              <View className="bg-white p-6 rounded-2xl border border-slate-200 items-center">
                <Text className="text-xs text-slate-400 text-center">
                  No subjects available here yet.
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {subjects.map((sub) => {
                  const selection = selections.find((s) => s.subjectId === sub.id);
                  const isSelected = !!selection;
                  const isExpanded = expandedSubjectId === sub.id;
                  const topics = sub.topics || [];

                  return (
                    <View key={sub.id}>
                      <TouchableOpacity
                        onPress={() => toggleSubject(sub.id)}
                        className="p-4 flex-row items-center gap-3"
                      >
                        <View
                          className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <Text className="text-white text-[10px] font-bold">✓</Text>
                          )}
                        </View>

                        <View className="w-9 h-9 rounded-lg bg-emerald-50 items-center justify-center">
                          <BookOpen color="#059669" size={16} />
                        </View>

                        <View className="flex-1">
                          <Text className="text-sm font-bold text-slate-900">{sub.titleEn}</Text>
                          <Text className="text-xs text-slate-500 font-sans">{sub.titleBn}</Text>
                        </View>

                        {isSelected && topics.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                            hitSlop={8}
                            className="px-2 py-1"
                          >
                            <View className="flex-row items-center gap-1">
                              {selection.topicIds.length > 0 && (
                                <View className="bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <Text className="text-[10px] font-bold text-emerald-700">
                                    {selection.topicIds.length}
                                  </Text>
                                </View>
                              )}
                              <ChevronDown
                                color="#94a3b8"
                                size={16}
                                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                              />
                            </View>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      {isSelected && isExpanded && topics.length > 0 && (
                        <View className="px-4 pb-4 pl-14 space-y-2">
                          <Text className="text-[10px] text-slate-400 mb-1">
                            Leave all unchecked to use the whole subject, or pick specific chapters:
                          </Text>
                          {topics.map((topic) => {
                            const checked = selection.topicIds.includes(topic.id);
                            return (
                              <TouchableOpacity
                                key={topic.id}
                                onPress={() => toggleTopic(sub.id, topic.id)}
                                className="flex-row items-center gap-2.5"
                              >
                                <View
                                  className={`w-4 h-4 rounded border-2 items-center justify-center ${
                                    checked
                                      ? 'bg-emerald-600 border-emerald-600'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {checked && (
                                    <Text className="text-white text-[8px] font-bold">✓</Text>
                                  )}
                                </View>
                                <Text className="text-xs text-slate-700 flex-1">
                                  {topic.titleEn}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            <Stepper
              label="Number of Questions"
              value={questionCount}
              onChange={setQuestionCount}
              min={MIN_QUESTIONS}
              max={MAX_QUESTIONS}
              step={5}
            />
            <Stepper
              label="Marks per Question"
              value={marksPerQuestion}
              onChange={setMarksPerQuestion}
              min={0.5}
              max={5}
              step={0.5}
            />
            <Stepper
              label="Negative Marking"
              value={negativeMark}
              onChange={setNegativeMark}
              min={0}
              max={1}
              step={0.25}
            />
          </View>

          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating || selections.length === 0}
            className={`py-4 rounded-2xl items-center shadow-md mt-2 ${
              generating || selections.length === 0 ? 'bg-emerald-300' : 'bg-emerald-600'
            }`}
          >
            {generating ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Generate &amp; Start Test
              </Text>
            )}
          </TouchableOpacity>

          <View className="pb-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
