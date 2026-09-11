import { styled } from 'nativewind';
import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';

/**
 * The SafeAreaView every screen should use.
 *
 * react-native's own SafeAreaView is a no-op on Android, so screens were either
 * padding the status bar by hand or running under it, and nothing accounted for
 * the gesture bar at the bottom. This one comes from react-native-safe-area-context
 * and is wrapped with NativeWind's `styled` so `className` works on it.
 *
 * Screens inside the tab navigator pass edges={['top']} — the tab bar carries
 * the bottom inset itself. Everything else passes edges={['top', 'bottom']}.
 */
export const SafeAreaView = styled(ContextSafeAreaView);
