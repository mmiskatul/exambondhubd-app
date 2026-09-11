import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { mobileApi } from '../../src/services/api';
import { useToast } from '../../src/components/Toast';
import { useAppDispatch } from '../../src/store';
import { fetchAccess } from '../../src/store/slices/accessSlice';
import { useLang } from '../../src/i18n';

export default function ManualPaymentScreen() {
  const { pick, t } = useLang();
  const router = useRouter();
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Arriving from a locked exam, so only the packages that unlock it are shown.
  const params = useLocalSearchParams<{ portalKey?: string; unitKey?: string }>();
  const portalKey = params.portalKey || '';
  const unitKey = params.unitKey || '';
  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [instructions, setInstructions] = useState<any>(null);
  const [scope, setScope] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only gateways an admin has actually configured a number for.
  const gateways = (
    [
      { key: 'BKASH', name: 'bKash', settingKey: 'bkash' },
      { key: 'NAGAD', name: 'Nagad', settingKey: 'nagad' },
      { key: 'ROCKET', name: 'Rocket', settingKey: 'rocket' },
    ] as const
  ).filter((g) => instructions?.[g.settingKey]?.isConfigured);

  useEffect(() => {
    loadPaymentSetup();
  }, []);

  useEffect(() => {
    if (gateways.length && !gateways.some((g) => g.key === method)) {
      setMethod(gateways[0].key);
    }
  }, [instructions]);

  async function loadPaymentSetup() {
    // Scoped to one exam when we came from a locked screen, otherwise the
    // whole catalogue.
    const plansUrl = portalKey
      ? `/subscriptions/plans/for?portalKey=${encodeURIComponent(portalKey)}` +
        (unitKey ? `&unitKey=${encodeURIComponent(unitKey)}` : '')
      : '/subscriptions/plans';

    const [instrRes, plansRes] = await Promise.all([
      mobileApi('/payments/instructions'),
      mobileApi(plansUrl),
    ]);

    if (instrRes.success && instrRes.data) {
      setInstructions(instrRes.data);
    }

    if (plansRes.success && plansRes.data) {
      const list = Array.isArray(plansRes.data) ? plansRes.data : plansRes.data.plans || [];
      // Free plans need no payment.
      const paid = list.filter((pl: any) => (pl.discountPriceBdt ?? pl.priceBdt) > 0);
      setPlans(paid);
      setScope(Array.isArray(plansRes.data) ? null : plansRes.data);

      if (paid.length > 0) {
        setSelectedPlanId(paid[0].id);
        setAmount(String(paid[0].discountPriceBdt ?? paid[0].priceBdt));
      }
    }
  }

  // Never invent a wallet number: if the admin has not configured one, the
  // screen says so instead of sending money into the void.
  const activeWallet =
    method === 'BKASH'
      ? instructions?.bkash
      : method === 'NAGAD'
        ? instructions?.nagad
        : instructions?.rocket;

  const currentNumber = activeWallet?.number || '';

  async function handleSubmit() {
    if (!selectedPlanId) {
      toast.error('Choose a subscription plan first.');
      return;
    }

    if (!currentNumber) {
      toast.error('That payment number is not configured yet. Try another gateway.');
      return;
    }

    if (!senderNumber || !transactionId) {
      toast.error('Enter your sender number and Transaction ID.');
      return;
    }

    setLoading(true);

    const res = await mobileApi('/payments/manual-submit', {
      method: 'POST',
      body: JSON.stringify({
        planId: selectedPlanId,
        provider: method,
        senderNumber: senderNumber.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        amount: Number(amount),
      }),
    });

    setLoading(false);

    if (res.success) {
      toast.success('Payment submitted for verification.');
      setSubmitted(true);
      dispatch(fetchAccess());
    } else {
      toast.error(res.message || 'Could not submit the payment.');
    }
  }

  if (submitted) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 bg-white items-center justify-center p-6"
      >
        <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-4">
          <CheckCircle2 color="#059669" size={36} />
        </View>
        <Text className="text-xl font-bold text-slate-900 text-center">
          Payment Submitted for Verification!
        </Text>
        <Text className="text-xs text-slate-500 text-center mt-2 px-4 leading-relaxed font-sans">
          Your Transaction ID (
          <Text className="font-bold font-mono text-slate-800">{transactionId}</Text>) has been
          submitted to the admin team. Your subscription will be activated shortly after
          verification!
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="mt-8 bg-emerald-600 px-8 py-3 rounded-xl shadow-sm"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">
            Back to Home
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-slate-200 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-900">Manual bKash / Nagad Payment</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1 p-4 space-y-4" showsVerticalScrollIndicator={false}>
          {/* Plan Selector */}
          <View className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <Text className="text-xs font-bold text-slate-700 uppercase">1. Choose Your Plan</Text>

            {plans.length === 0 ? (
              <Text className="text-xs text-slate-400 py-3">
                No paid subscription plans are available right now.
              </Text>
            ) : (
              plans.map((pl) => {
                const price = pl.discountPriceBdt ?? pl.priceBdt;
                const isSelected = selectedPlanId === pl.id;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => {
                      setSelectedPlanId(pl.id);
                      setAmount(String(price));
                    }}
                    className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold text-slate-900">{pl.nameEn}</Text>
                      <Text className="text-[11px] text-slate-500 font-sans">
                        {pl.nameBn} · {pl.durationDays} days
                      </Text>

                      {/* What the package actually unlocks: a scope with no unit
                        covers the whole exam, one with a unit covers just it. */}
                      <View className="flex-row flex-wrap gap-1 mt-1.5">
                        {(pl.scopes || []).length === 0 ? (
                          <View className="bg-amber-50 px-1.5 py-0.5 rounded">
                            <Text className="text-[10px] font-bold text-amber-700">সব পরীক্ষা</Text>
                          </View>
                        ) : (
                          pl.scopes.map((sc: any) => (
                            <View key={sc.id} className="bg-slate-200/70 px-1.5 py-0.5 rounded">
                              <Text className="text-[10px] font-bold text-slate-700 font-sans">
                                {sc.unit
                                  ? `${pick(sc.portal, 'title')} ${pick(sc.unit, 'title')}`
                                  : `${pick(sc.portal, 'title')} — ${t('allUnits')}`}
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                    <Text
                      className={`text-base font-black ${
                        isSelected ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      ৳{price}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {scope?.portal && (
            <View className="bg-slate-900 p-4 rounded-2xl">
              <Text className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                যে পরীক্ষার জন্য
              </Text>
              <Text className="text-sm font-bold text-white mt-0.5 font-sans">
                {pick(scope.portal, 'title')}
                {scope.unit ? ` · ${scope.unit.titleBn}` : ''}
              </Text>
            </View>
          )}

          {/* Method Selector */}
          <View className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <Text className="text-xs font-bold text-slate-700 uppercase">
              2. Select Payment Gateway
            </Text>
            <View className="flex-row gap-2">
              {gateways.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMethod(m.key as any)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    method === m.key
                      ? 'bg-slate-900 border-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${method === m.key ? 'text-white' : 'text-slate-700'}`}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Send Money Number Card */}
          <View className="bg-emerald-950 p-5 rounded-2xl space-y-2">
            <Text className="text-xs font-semibold text-emerald-300 uppercase">
              3. Send Money to this {method} Number
            </Text>

            {currentNumber ? (
              <>
                <View className="flex-row items-center justify-between bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-800">
                  <Text className="text-xl font-bold font-mono text-white tracking-wider">
                    {currentNumber}
                  </Text>
                  <View className="px-2.5 py-1 rounded bg-emerald-500">
                    <Text className="text-[10px] font-bold text-white uppercase">
                      {activeWallet?.type || 'Personal'}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-emerald-200 leading-relaxed">
                  Go to your {method} app ➔ Send Money ➔ Enter ৳{amount} ➔ Complete the transaction
                  and copy the <Text className="font-bold text-white">TrxID</Text>.
                </Text>
              </>
            ) : (
              <View className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-800">
                <Text className="text-xs font-bold text-amber-300">
                  No {method} number has been configured yet.
                </Text>
                <Text className="text-[11px] text-emerald-200 mt-1">
                  Please choose another gateway or contact support.
                </Text>
              </View>
            )}
          </View>

          {/* Verification Form */}
          <View className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <Text className="text-xs font-bold text-slate-700 uppercase">
              4. Enter Transaction Details
            </Text>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                Your {method} Sender Phone Number
              </Text>
              <TextInput
                placeholder="e.g. 01712345678"
                keyboardType="phone-pad"
                value={senderNumber}
                onChangeText={setSenderNumber}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                Transaction ID (TrxID)
              </Text>
              <TextInput
                placeholder="e.g. BLA94K89F1"
                autoCapitalize="characters"
                value={transactionId}
                onChangeText={setTransactionId}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-emerald-600 py-3.5 rounded-xl items-center shadow-md shadow-emerald-700/20 mt-2"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-white uppercase tracking-wider">
                  Submit Payment Verification
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
