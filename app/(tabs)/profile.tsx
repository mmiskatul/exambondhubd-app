import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import {
  CheckCircle,
  XCircle,
  Shield,
  ChevronRight,
  LogOut,
  Moon,
  HelpCircle,
  FileText,
  Info,
  Gift,
  ChevronDown,
  Sparkles,
  KeyRound,
  UserCog,
  Trash2,
  Languages,
  Mail,
  Bell,
} from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchProfile, signOut, updateProfile } from '../../src/store/slices/authSlice';
import { useLang } from '../../src/i18n';
import { setLanguage } from '../../src/store/slices/languageSlice';
import { useToast } from '../../src/components/Toast';

export default function ProfileAndSettingsScreen() {
  const { pick, t, language } = useLang();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const account = useAppSelector((st) => st.auth.user);
  const isSignedIn = useAppSelector((st) => st.auth.isAuthenticated);

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<{
    referralCode: string | null;
    totalSignups: number;
    rewardedCount: number;
    totalRewardDays: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Help content is authored in the dashboard, so it is fetched rather than
    // shipped with the build. Open to signed-out users too.
    mobileApi('/faqs').then((res) => {
      if (res.success && Array.isArray(res.data)) setFaqs(res.data);
    });
  }, []);

  const loadAccountData = useCallback(async () => {
    if (!isSignedIn) return;
    await Promise.all([
      dispatch(fetchProfile()),
      // Recent results, so the profile is not just static counters.
      mobileApi('/attempts?limit=5').then((res) => {
        if (res.success && Array.isArray(res.data?.items)) setHistory(res.data.items);
      }),
      mobileApi('/users/me/referrals').then((res) => {
        if (res.success && res.data) setReferrals(res.data);
      }),
    ]);
  }, [isSignedIn, dispatch]);

  // A plain effect only reruns when isSignedIn flips, so finishing an exam and
  // tapping back into this tab used to leave the stats and recent results
  // stale. Refetching on every focus keeps them current without a manual pull.
  useFocusEffect(
    useCallback(() => {
      loadAccountData();
    }, [loadAccountData]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  }

  const profileStats = account?.profile || {};
  const user = {
    id: account?.id ? `PP-${account.id.slice(0, 6).toUpperCase()}` : '',
    name: account?.name || 'Student Examinee',
    email: account?.email || '',
    phone: account?.phone || '',
    plan: account?.subscriptions?.length ? 'PRO ACTIVE' : 'FREE TIER',
    expiresAt: account?.subscriptions?.[0]?.expiresAt || '',
    stats: {
      studyStreak: profileStats.studyStreak || 0,
      totalExams: profileStats.totalExams || 0,
      questionsSolved: profileStats.questionsSolved || 0,
      accuracy: profileStats.accuracy ? Number(profileStats.accuracy.toFixed(1)) : 0,
      averageScore: profileStats.averageScore ? Number(profileStats.averageScore.toFixed(1)) : 0,
    },
  };

  async function handleShareReferral() {
    const code = referrals?.referralCode;
    if (!code) return;

    try {
      await Share.share({
        message: `Join ExamBondhuBD - Bangladesh's #1 MCQ & Exam Prep App! Enter my referral code ${code} when you sign up — once you subscribe, I get +7 days added to my active plan: https://exambondhubd.com`,
      });
    } catch {
      Alert.alert('Referral Code', `Your unique referral code is: ${code}`);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to log out of ExamBondhuBD?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          // signOut clears the token and every cached slice, so the next
          // student to sign in on this device sees none of the last one's data.
          await dispatch(signOut());
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-slate-900">Settings & Student Profile</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <LogOut color="#e11d48" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4 space-y-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />
        }
      >
        {/* Student ID Card */}
        <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-14 h-14 rounded-2xl bg-emerald-600 items-center justify-center shadow-md">
                <Text className="text-xl font-black text-white">
                  {user.name?.slice(0, 2).toUpperCase() || 'ST'}
                </Text>
              </View>

              <View>
                <Text className="text-lg font-bold text-white leading-tight">{user.name}</Text>
                <Text className="text-xs text-emerald-300 font-sans">{user.email}</Text>
                <Text className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Student ID: #{user.id}
                </Text>
              </View>
            </View>
          </View>

          <View className="pt-2 border-t border-slate-700/60 flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 self-start">
                <Sparkles color="#34d399" size={12} />
                <Text className="text-[11px] font-bold text-emerald-400">{user.plan}</Text>
              </View>
              {user.expiresAt ? (
                <Text className="text-[10px] text-slate-400 mt-1">
                  Expires {new Date(user.expiresAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/subscription/pay' as any)}
              className="px-3 py-1 bg-emerald-600 rounded-xl"
            >
              <Text className="text-xs font-bold text-white">Manage Plan →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
              <Languages color="#059669" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">{t('language')}</Text>
              <Text className="text-xs text-slate-500 font-sans">{t('languageHint')}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            {[
              { code: 'bn' as const, label: 'বাংলা' },
              { code: 'en' as const, label: 'English' },
            ].map((opt) => {
              const active = language === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  onPress={() => dispatch(setLanguage(opt.code))}
                  className={`flex-1 py-2.5 rounded-xl items-center border ${
                    active ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold font-sans ${
                      active ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dark Mode — not implemented yet; shown disabled rather than as a
            switch that visibly does nothing when flipped. */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between opacity-60">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-amber-50">
              <Moon color="#94a3b8" size={20} />
            </View>
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-bold text-slate-900">Dark Mode</Text>
                <View className="px-1.5 py-0.5 bg-slate-100 rounded-md">
                  <Text className="text-[9px] font-bold text-slate-500 uppercase">Coming Soon</Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500">Night reading & eye protection</Text>
            </View>
          </View>

          <Switch value={false} disabled trackColor={{ false: '#cbd5e1', true: '#059669' }} />
        </View>

        {/* Push Notifications */}
        {isSignedIn && (
          <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-emerald-50">
                <Bell color="#059669" size={20} />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900">Push Notifications</Text>
                <Text className="text-xs text-slate-500">Exam reminders & new content alerts</Text>
              </View>
            </View>

            <Switch
              value={account?.pushNotificationsEnabled !== false}
              onValueChange={async (val) => {
                const result = await dispatch(updateProfile({ pushNotificationsEnabled: val }));
                if (!updateProfile.fulfilled.match(result)) {
                  toast.error('Could not update your notification preference.');
                }
              }}
              trackColor={{ false: '#cbd5e1', true: '#059669' }}
              thumbColor="#ffffff"
            />
          </View>
        )}

        {/* Preparation & Performance Statistics */}
        <View className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Performance & Accuracy Overview
            </Text>
            <Text className="text-[11px] font-bold text-emerald-600">Live Analytics</Text>
          </View>

          <View className="grid grid-cols-3 gap-2 text-center">
            <View className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Text className="text-lg font-bold text-slate-900">{user.stats.totalExams}</Text>
              <Text className="text-[10px] text-slate-500 font-bold uppercase">Tests Done</Text>
            </View>

            <View className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Text className="text-lg font-bold text-slate-900">{user.stats.questionsSolved}</Text>
              <Text className="text-[10px] text-slate-500 font-bold uppercase">MCQs Solved</Text>
            </View>

            <View className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Text className="text-lg font-bold text-emerald-700">{user.stats.accuracy}%</Text>
              <Text className="text-[10px] text-emerald-700 font-bold uppercase">Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Recent Results */}
        {history.length > 0 && (
          <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <Text className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recent Results
            </Text>
            <View className="divide-y divide-slate-100">
              {history.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() =>
                    router.push({
                      pathname: `/exam/${a.examId}/result`,
                      params: { attemptId: a.id },
                    } as any)
                  }
                  className="px-4 py-3 flex-row items-center gap-3"
                >
                  {a.percentage >= 50 ? (
                    <CheckCircle color="#059669" size={16} />
                  ) : (
                    <XCircle color="#e11d48" size={16} />
                  )}
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                      {a.exam?.titleEn}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs font-black ${
                      a.percentage >= 50 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {Math.round(a.percentage)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Account */}
        <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <TouchableOpacity
            onPress={() => router.push('/edit-profile' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <UserCog color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">Edit Profile</Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/change-password' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <KeyRound color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">Change Password</Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/delete-account' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Trash2 color="#e11d48" size={18} />
              <Text className="text-xs font-semibold text-rose-700">Delete Account</Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>
        </View>

        {/* Refer & Earn Card */}
        <View className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-2xl shadow-sm space-y-3">
          <TouchableOpacity
            onPress={handleShareReferral}
            disabled={!referrals?.referralCode}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                <Gift color="#ffffff" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Refer & Earn</Text>
                <Text className="text-xs text-amber-100">
                  {referrals?.referralCode
                    ? `Share code ${referrals.referralCode} — get +7 days when they subscribe`
                    : 'Loading your code…'}
                </Text>
              </View>
            </View>

            <View className="bg-white px-3 py-1.5 rounded-xl">
              <Text className="text-xs font-bold text-amber-900">Share</Text>
            </View>
          </TouchableOpacity>

          {referrals && referrals.totalSignups > 0 && (
            <View className="flex-row gap-2 pt-2 border-t border-white/20">
              <View className="flex-1 items-center">
                <Text className="text-base font-black text-white">{referrals.totalSignups}</Text>
                <Text className="text-[10px] text-amber-100 uppercase">Signed Up</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-base font-black text-white">{referrals.rewardedCount}</Text>
                <Text className="text-[10px] text-amber-100 uppercase">Subscribed</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-base font-black text-white">{referrals.totalRewardDays}</Text>
                <Text className="text-[10px] text-amber-100 uppercase">Bonus Days</Text>
              </View>
            </View>
          )}
        </View>

        {/* Frequently Asked Questions (FAQ) Accordion */}
        <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
          <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100">
            <HelpCircle color="#059669" size={18} />
            <Text className="text-sm font-bold text-slate-900">
              Frequently Asked Questions (FAQ)
            </Text>
          </View>

          {faqs.length === 0 ? (
            <Text className="text-xs text-slate-400 text-center py-3">
              এখনো কোনো প্রশ্নোত্তর যোগ করা হয়নি।
            </Text>
          ) : (
            faqs.map((faq) => (
              <View key={faq.id} className="border-b border-slate-100 pb-2">
                <TouchableOpacity
                  onPress={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className="flex-row items-center justify-between py-1"
                >
                  <Text className="text-xs font-bold text-slate-800 flex-1 pr-2 font-sans">
                    {pick(faq, 'question')}
                  </Text>
                  <ChevronDown
                    color="#94a3b8"
                    size={16}
                    style={{ transform: [{ rotate: openFaqId === faq.id ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
                {openFaqId === faq.id && (
                  <Text className="text-xs text-slate-500 font-sans mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                    {pick(faq, 'answer')}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Support & Legal Links */}
        <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL('mailto:admin@exambondhubd.com?subject=Support%20Request')
            }
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Mail color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">Contact Support</Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/terms' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <FileText color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">Terms of Service & Rules</Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/privacy' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Shield color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">
                Privacy Policy & Data Security
              </Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/about' as any)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Info color="#64748b" size={18} />
              <Text className="text-xs font-semibold text-slate-800">
                About ExamBondhuBD (আমাদের সম্পর্কে)
              </Text>
            </View>
            <ChevronRight color="#94a3b8" size={16} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex-row items-center justify-center gap-2 mb-6"
        >
          <LogOut color="#e11d48" size={16} />
          <Text className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Log Out from Account
          </Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text className="text-[10px] text-slate-400 text-center mb-6">
          ExamBondhuBD v{Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
