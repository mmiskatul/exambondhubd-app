import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

/** The circular back button repeated across every detail screen. */
export function BackButton({
  onPress,
  className = '',
}: {
  onPress?: () => void;
  className?: string;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      className={`w-9 h-9 rounded-full bg-slate-100 items-center justify-center ${className}`}
    >
      <ArrowLeft color="#334155" size={18} />
    </TouchableOpacity>
  );
}

/**
 * The bordered white title bar repeated at the top of most detail screens:
 * back button, title (+ optional subtitle), and an optional right-side slot
 * for screen-specific actions (a notification bell, a mode switch, ...).
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  center = false,
  numberOfLines = 1,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  center?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View
      className={`px-4 py-3 bg-white border-b border-slate-200 flex-row items-center ${
        right ? 'justify-between' : ''
      }`}
    >
      <BackButton onPress={onBack} className={right ? 'shadow-xs' : ''} />

      <View className={center ? 'items-center flex-1 px-2' : 'flex-1 px-3'}>
        <Text className="text-base font-bold text-slate-900" numberOfLines={numberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[10px] text-slate-500 font-sans" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}
