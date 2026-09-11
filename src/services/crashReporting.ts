import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    enableNativeCrashHandling: true,
  });
}

/**
 * Crash reporting stays inert until EXPO_PUBLIC_SENTRY_DSN is set — local
 * dev and any environment without a Sentry project configured yet don't
 * silently start sending events to nowhere.
 */
export const wrapRootComponent: typeof Sentry.wrap = dsn ? Sentry.wrap : (component) => component;

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
