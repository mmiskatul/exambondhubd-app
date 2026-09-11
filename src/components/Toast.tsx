import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** Toasts an API response, picking the kind from `success`. */
  fromResponse: (
    res: { success: boolean; data?: any; message?: string },
    fallback?: { success?: string; error?: string },
  ) => boolean;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS: Record<ToastKind, number> = { success: 3000, info: 3500, error: 5000 };

let nextId = 1;

/**
 * A small in-app toast. React Native has no cross-platform toast — ToastAndroid
 * is Android-only and Alert steals focus — so this renders one itself.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    if (!message) return;
    const id = nextId++;

    // Keep at most three on screen so a burst cannot cover the app.
    setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS[kind]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      fromResponse: (res, fallback) => {
        if (res?.success) {
          push('success', res.data?.message || fallback?.success || res.message || 'Done.');
          return true;
        }
        push('error', res?.message || fallback?.error || 'Something went wrong.');
        return false;
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 52) + 8,
          left: 12,
          right: 12,
          zIndex: 1000,
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const PALETTE: Record<ToastKind, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#ecfdf5', border: '#a7f3d0', icon: '#059669', text: '#064e3b' },
  error: { bg: '#fff1f2', border: '#fecdd3', icon: '#e11d48', text: '#4c0519' },
  info: { bg: '#f8fafc', border: '#e2e8f0', icon: '#475569', text: '#0f172a' },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const slide = useRef(new Animated.Value(0)).current;
  const colors = PALETTE[toast.kind];
  const Icon =
    toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [slide]);

  return (
    <Animated.View
      style={{
        opacity: slide,
        transform: [
          { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
        ],
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Icon color={colors.icon} size={18} />

      <Text
        style={{
          flex: 1,
          marginLeft: 10,
          marginRight: 8,
          color: colors.text,
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 17,
        }}
      >
        {toast.message}
      </Text>

      <TouchableOpacity onPress={() => onDismiss(toast.id)} hitSlop={8}>
        <X color={colors.icon} size={15} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
