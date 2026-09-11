import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../../src/components/SafeScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle, Bookmark } from 'lucide-react-native';
import { mobileApi } from '../../../src/services/api';
import { useAppDispatch, useAppSelector } from '../../../src/store';
import { fetchBookmarks, toggleBookmark } from '../../../src/store/slices/bookmarksSlice';

export default function ExamReviewScreen() {
  const { attemptId } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const bookmarkIds = useAppSelector((s) => s.bookmarks.ids);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReview() {
      if (!attemptId) return;
      const res = await mobileApi(`/attempts/${attemptId}/result`);
      if (res.success && res.data) {
        setResult(res.data);
      }
      setLoading(false);
    }
    loadReview();
    // Bookmarking here has to agree with the Bookmarks tab, so both read the
    // same slice rather than each keeping their own flag.
    dispatch(fetchBookmarks());
  }, [attemptId]);

  function handleToggleBookmark(questionId: string) {
    dispatch(toggleBookmark(questionId));
  }

  if (loading || !result) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center"
      >
        <ActivityIndicator color="#059669" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      <ScreenHeader title="Answer Review" subtitle={result.examTitleEn} />

      <ScrollView className="flex-1 px-4 py-4 space-y-4" showsVerticalScrollIndicator={false}>
        {result.questionsReview?.map((q: any, idx: number) => {
          return (
            <View
              key={q.questionId}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
            >
              {/* Question Header */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="bg-slate-100 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-slate-700">Q.{idx + 1}</Text>
                  </View>
                  <View
                    className={`px-2 py-0.5 rounded ${q.isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${q.isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}
                    >
                      {q.isCorrect ? 'CORRECT (+1.0)' : 'INCORRECT (-0.25)'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleToggleBookmark(q.questionId)}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <Bookmark
                    color={bookmarkIds.includes(q.questionId) ? '#059669' : '#94a3b8'}
                    size={16}
                    fill={bookmarkIds.includes(q.questionId) ? '#059669' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              {/* Question Text */}
              <Text className="text-sm font-bold text-slate-900 leading-snug">{q.questionEn}</Text>
              {q.questionBn && (
                <Text className="text-xs text-slate-700 font-sans font-medium">{q.questionBn}</Text>
              )}

              {/* Options */}
              <View className="space-y-2 pt-1">
                {q.options?.map((opt: any) => {
                  const isUserPick = q.selectedOptionId === opt.id;
                  const isCorrect = opt.isCorrect;

                  let optionStyle = 'bg-slate-50 border-slate-200';
                  if (isCorrect)
                    optionStyle = 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950';
                  else if (isUserPick && !isCorrect)
                    optionStyle = 'bg-rose-50 border-rose-500 font-bold text-rose-950';

                  return (
                    <View
                      key={opt.id}
                      className={`p-3 rounded-xl border flex-row items-center justify-between ${optionStyle}`}
                    >
                      <View className="flex-row items-center flex-1 pr-2">
                        <Text className="w-6 text-xs font-bold text-slate-700">
                          {opt.optionKey}.
                        </Text>
                        <Text className="text-xs text-slate-800">{opt.textEn}</Text>
                      </View>

                      {isCorrect && <CheckCircle color="#059669" size={16} />}
                      {isUserPick && !isCorrect && <XCircle color="#e11d48" size={16} />}
                    </View>
                  );
                })}
              </View>

              {/* Explanation Box */}
              {(q.explanationEn || q.explanationBn) && (
                <View className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <Text className="text-[11px] font-bold text-emerald-900 uppercase">
                    Verified Explanation:
                  </Text>
                  {q.explanationEn && (
                    <Text className="text-xs text-slate-700">{q.explanationEn}</Text>
                  )}
                  {q.explanationBn && (
                    <Text className="text-xs text-slate-700 font-sans">{q.explanationBn}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
