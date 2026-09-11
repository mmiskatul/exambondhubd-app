import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from '../src/components/SafeScreen';
import { useRouter } from 'expo-router';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { mobileApi } from '../src/services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const res = await mobileApi('/notifications/my');
    setNotifications(res.success && Array.isArray(res.data) ? res.data : []);

    setLoading(false);
    setRefreshing(false);
  }

  async function handleMarkAsRead(notificationId: string) {
    const res = await mobileApi(`/notifications/${notificationId}/read`, { method: 'PATCH' });
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    }
  }

  async function handleMarkAllAsRead() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const res = await mobileApi('/notifications/read-all', { method: 'PATCH' });
    if (!res.success) setNotifications(previous);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ArrowLeft color="#0f172a" size={20} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900">Notifications</Text>
        </View>

        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text className="text-xs font-semibold text-emerald-600">Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4 space-y-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color="#059669" className="mt-8" />
        ) : notifications.length === 0 ? (
          <View className="bg-white p-12 rounded-2xl border border-slate-200 text-center items-center mt-6">
            <Bell color="#94a3b8" size={32} />
            <Text className="text-sm font-bold text-slate-800 mt-2">No Notifications</Text>
            <Text className="text-xs text-slate-500 mt-1">You are all caught up!</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border ${
                item.isRead
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50/60 border-emerald-300 shadow-sm'
              }`}
            >
              <View className="flex-row items-start justify-between gap-2 mb-1">
                <View className="flex-row items-center gap-2 flex-1">
                  {!item.isRead && <View className="w-2 h-2 rounded-full bg-emerald-600" />}
                  <Text
                    className={`text-sm ${item.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}
                  >
                    {item.notification.title}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-slate-600 leading-relaxed font-sans mt-1">
                {item.notification.body}
              </Text>

              <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <Text className="text-[10px] text-slate-400 font-medium">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text className="text-[10px] font-bold text-emerald-700">ExamBondhuBD Alert</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
