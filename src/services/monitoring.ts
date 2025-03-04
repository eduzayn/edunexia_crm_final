import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initialize() {
    if (this.initialized) return;

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/edunexia\.com/],
        }),
        new Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    this.initialized = true;
  }

  // Métodos públicos
  setUser(userId: string, email?: string) {
    Sentry.setUser({
      id: userId,
      email,
    });
  }

  clearUser() {
    Sentry.setUser(null);
  }

  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, {
      level,
    });
  }

  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }

  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }

  // Métodos específicos para o Chatwoot
  captureApiError(error: Error, endpoint: string, params?: any) {
    this.captureError(error, {
      endpoint,
      params,
      type: 'api_error',
    });
  }

  captureAuthError(error: Error, action: string) {
    this.captureError(error, {
      action,
      type: 'auth_error',
    });
  }

  captureUploadError(error: Error, fileType: string, size: number) {
    this.captureError(error, {
      fileType,
      size,
      type: 'upload_error',
    });
  }

  // Métodos para performance
  startPageLoad(name: string) {
    return this.startTransaction(name, 'pageload');
  }

  startApiCall(endpoint: string) {
    return this.startTransaction(`API: ${endpoint}`, 'http');
  }

  startUpload(fileType: string) {
    return this.startTransaction(`Upload: ${fileType}`, 'upload');
  }
}

export const monitoringService = MonitoringService.getInstance(); 