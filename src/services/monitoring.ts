import * as Sentry from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  network: {
    type: string;
    effectiveType: string;
    downlink: number;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;
  private performanceInterval: NodeJS.Timeout | null = null;
  private readonly METRICS_INTERVAL = 60 * 1000; // 1 minuto
  private metrics: PerformanceMetrics = {
    memory: { used: 0, total: 0, limit: 0 },
    cpu: { usage: 0, cores: navigator.hardwareConcurrency || 0 },
    network: { type: '', effectiveType: '', downlink: 0 },
  };

  private constructor() {
    this.initialize();
    this.startPerformanceMonitoring();
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

  private startPerformanceMonitoring() {
    if (this.performanceInterval) return;

    this.performanceInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.METRICS_INTERVAL);

    // Coletar métricas iniciais
    this.collectPerformanceMetrics();
  }

  private async collectPerformanceMetrics() {
    try {
      // Coletar métricas de memória
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
      }

      // Coletar métricas de rede
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.metrics.network = {
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
        };
      }

      // Coletar métricas de CPU
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.metrics.cpu.usage = battery.level * 100;
      }

      // Enviar métricas para Sentry
      this.sendPerformanceMetrics();
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
    }
  }

  private sendPerformanceMetrics() {
    Sentry.setContext('performance', {
      memory: this.metrics.memory,
      cpu: this.metrics.cpu,
      network: this.metrics.network,
      timestamp: new Date().toISOString(),
    });
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

  // Métodos para monitoramento de recursos
  getPerformanceMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  isLowMemory(): boolean {
    return this.metrics.memory.used / this.metrics.memory.total > 0.8;
  }

  isLowBandwidth(): boolean {
    return this.metrics.network.effectiveType === '2g' || 
           this.metrics.network.effectiveType === 'slow-2g';
  }

  // Destrutor
  destroy() {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
  }
}

export const monitoringService = MonitoringService.getInstance(); 