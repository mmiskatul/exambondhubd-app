import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { RotateCcw, ChevronRight, Bookmark, Lock, GraduationCap } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchPortals, selectAllPortals } from '../../src/store/slices/portalsSlice';
import { fetchBookmarks } from '../../src/store/slices/bookmarksSlice';
import { fetchAccess, selectEnrolledExams } from '../../src/store/slices/accessSlice';
import { mobileApi } from '../../src/services/api';
import { useLang } from '../../src/i18n';

export default function PracticeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLang();

  const portals = useAppSelector(selectAllPortals);
  const portalsLoaded = useAppSelector((s) => s.portals.loaded);
  const bookmarkCount = useAppSelector((s) => s.bookmarks.ids.length);
  const isSignedIn = useAppSelector((s) => s.auth.isAuthenticated);

  const accessLoaded = useAppSelector((s) => s.access.loaded);
  const platformWide = useAppSelector((s) => s.access.platformWide);
  const enrolledExams = useAppSelector(selectEnrolledExams);

  const [mistakes, setMistakes] = React.useState(0);

  useEffect(() => {
    if (!portalsLoaded) dispatch(fetchPortals());
    if (isSignedIn) {
      dispatch(fetchBookmarks());
      // What you're enrolled in can change any time a purchase is approved,
      // so this is never stale about which exam(s) the tab should open onto.
      dispatch(fetchAccess());
      mobileApi('/attempts/practice/mistakes?count=50').then((res) => {
        setMistakes(res.data?.totalMistakes ?? 0);
      });
    }
  }, [isSignedIn]);

  function practise(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    router.push(`/practice/session?${qs}` as any);
  }

  function openExam(portalKey: string, unitKey?: string) {
    router.push(
      (`/portal/${encodeURIComponent(portalKey)}` +
        (unitKey ? `?unitKey=${encodeURIComponent(unitKey)}` : '')) as any,
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4 py-4 space-y-4" showsVerticalScrollIndicator={false}>
        {/* Practice My Mistakes */}
        <View className="bg-slate-900 p-5 rounded-2xl shadow-md">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
              <Text className="text-[10px] font-bold text-rose-300 uppercase">
                Weak Area Recovery
              </Text>
            </View>
            <RotateCcw color="#fda4af" size={16} />
          </View>

          <Text className="text-lg font-bold text-white mb-1">Practice My Mistakes</Text>
          <Text className="text-xs text-rose-100 mb-4">
            {mistakes > 0
              ? `You have ${mistakes} question${mistakes === 1 ? '' : 's'} marked incorrect. Turn mistakes into strengths.`
              : 'Complete a mock test and the ones you get wrong collect here.'}
          </Text>

          <TouchableOpacity
            disabled={mistakes === 0}
            onPress={() =>
              practise({ mode: 'mistakes', title: 'Mistakes Sprint', subtitle: 'Your weak areas' })
            }
            className={`py-3 rounded-xl items-center ${mistakes > 0 ? 'bg-white' : 'bg-rose-900/60'}`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-wider ${
                mistakes > 0 ? 'text-rose-900' : 'text-rose-300'
              }`}
            >
              {mistakes > 0 ? `Start Sprint (${mistakes} Qs)` : 'No Mistakes Recorded'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saved questions */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/bookmarks' as any)}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
              <Bookmark color="#059669" size={18} />
            </View>
            <View>
              <Text className="text-sm font-bold text-slate-900">Saved Questions</Text>
              <Text className="text-xs text-slate-500">
                {bookmarkCount} bookmarked for revision
              </Text>
            </View>
          </View>
          <ChevronRight color="#94a3b8" size={18} />
        </TouchableOpacity>

        {/*
          My Exams — scoped to what the student actually owns, not every
          exam on the platform. The old version listed every subject from
          every exam (100+ rows, mostly locked); this is the fix for that:
            - platform-wide package -> everything really is open, show it all
            - nothing bought yet     -> one prompt, not a locked wall
            - one thing bought       -> land straight on it, no picker
            - several things bought  -> a short picker of just those
        */}
        <View className="space-y-3 pt-2 pb-8">
          <Text className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            My Exams
          </Text>

          {!accessLoaded ? (
            <ActivityIndicator color="#059669" size="small" className="py-6" />
          ) : platformWide ? (
            portals
              .filter((p) => p.isEnabled !== false)
              .map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => openExam(p.key)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3 flex-1 pr-3">
                    <Text className="text-xl">{p.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">{p.title}</Text>
                      <Text className="text-xs text-slate-500 font-sans" numberOfLines={1}>
                        {p.bn}
                        {p.hasUnits ? ` · ${p.units?.length} units` : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color="#94a3b8" size={18} />
                </TouchableOpacity>
              ))
          ) : enrolledExams.length === 0 ? (
            <View className="bg-white p-6 rounded-2xl border border-amber-200 items-center space-y-2">
              <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center">
                <Lock color="#b45309" size={22} />
              </View>
              <Text className="text-sm font-bold text-slate-800 text-center">No package yet</Text>
              <Text className="text-xs text-slate-400 text-center">
                Buy a package to start practicing its subjects and question papers here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/subscription/pay' as any)}
                className="mt-2 px-6 py-2.5 bg-emerald-600 rounded-xl"
              >
                <Text className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('buyPackage')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            enrolledExams.map((e) => (
              <TouchableOpacity
                key={`${e.portalKey}::${e.unitKey || ''}`}
                onPress={() => openExam(e.portalKey, e.unitKey)}
                className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View className="w-11 h-11 rounded-2xl bg-emerald-50 items-center justify-center">
                    {e.portalIcon ? (
                      <Text className="text-xl">{e.portalIcon}</Text>
                    ) : (
                      <GraduationCap color="#059669" size={20} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {enrolledExams.length === 1 ? 'Continue Practicing' : 'Enrolled'}
                    </Text>
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                      {e.portalTitleEn}
                      {e.unitTitleEn ? ` · ${e.unitTitleEn}` : ''}
                    </Text>
                    <Text className="text-xs text-slate-500 font-sans" numberOfLines={1}>
                      {e.portalTitleBn}
                      {e.unitTitleBn ? ` · ${e.unitTitleBn}` : ''}
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#94a3b8" size={18} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
