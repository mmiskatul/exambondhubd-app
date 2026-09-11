import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { Bookmark, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchBookmarks, toggleBookmark } from '../../src/store/slices/bookmarksSlice';
import { useToast } from '../../src/components/Toast';
import { useLang } from '../../src/i18n';

export default function BookmarksScreen() {
  const { pick } = useLang();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { items, loading, pending } = useAppSelector((s) => s.bookmarks);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, []);

  function remove(questionId: string) {
    dispatch(toggleBookmark(questionId));
    toast.success('Removed from bookmarks.');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-4 py-4 space-y-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchBookmarks())}
            tintColor="#059669"
          />
        }
      >
        {loading && items.length === 0 ? (
          <ActivityIndicator color="#059669" className="mt-8" />
        ) : items.length === 0 ? (
          <View className="bg-white p-12 rounded-2xl border border-slate-200 items-center mt-6">
            <Bookmark color="#94a3b8" size={32} />
            <Text className="text-sm font-bold text-slate-800 mt-2">No bookmarks saved</Text>
            <Text className="text-xs text-slate-500 mt-1 text-center">
              Tap the bookmark icon on any question to keep it here for revision.
            </Text>
          </View>
        ) : (
          items.map((b) => {
            const q = b.question || {};
            const questionId = b.questionId || q.id;
            const busy = pending.includes(questionId);
            const correct = q.options?.find((o: any) => o.isCorrect);

            return (
              <View
                key={b.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2"
              >
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-emerald-600 uppercase">
                      {q.subject?.titleEn || 'Question'}
                      {q.portal ? ` · ${q.portal.titleEn}` : ''}
                      {q.year ? ` · ${q.year}` : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => remove(questionId)}
                    disabled={busy}
                    hitSlop={8}
                    className={busy ? 'opacity-40' : ''}
                  >
                    <Bookmark color="#059669" fill="#059669" size={16} />
                  </TouchableOpacity>
                </View>

                <Text className="text-xs font-bold text-slate-900 leading-relaxed">
                  {pick(q, 'question')}
                </Text>

                {correct && (
                  <View className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Text className="text-[10px] font-bold text-emerald-800 uppercase">
                      সঠিক উত্তর
                    </Text>
                    <Text className="text-xs text-emerald-950 font-sans mt-0.5">
                      {correct.optionKey}. {pick(correct, 'text')}
                    </Text>
                  </View>
                )}

                {pick(q, 'explanation') && (
                  <View className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/70 flex-row gap-1.5">
                    <Sparkles color="#d97706" size={12} />
                    <Text className="text-[11px] text-amber-950 font-sans flex-1 leading-relaxed">
                      {pick(q, 'explanation')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
