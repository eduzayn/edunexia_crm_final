import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../config/supabase';
import { cacheService } from './cache';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

interface NotificationQueueItem {
  id: string;
  title: string;
  body: string;
  data?: any;
  created_at: string;
  retry_count: number;
}

class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;
  private notificationQueue: NotificationQueueItem[] = [];
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private retryInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initialize();
    this.setupOfflineSupport();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
    try {
      // Solicitar permissão para notificações
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Obter token do Firebase
        this.token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        // Salvar token no Supabase
        if (this.token) {
          await this.saveToken();
        }

        // Configurar listener de mensagens
        this.setupMessageListener();

        // Processar fila de notificações pendentes
        await this.processNotificationQueue();
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  }

  private setupOfflineSupport() {
    // Monitorar estado da conexão
    window.addEventListener('online', () => {
      this.processNotificationQueue();
    });

    window.addEventListener('offline', () => {
      this.startRetryInterval();
    });
  }

  private async saveToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && this.token) {
        await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: user.id,
            token: this.token,
            platform: 'web',
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  private setupMessageListener() {
    onMessage(messaging, (payload) => {
      this.showNotification({
        title: payload.notification?.title || 'Nova mensagem',
        body: payload.notification?.body || '',
        data: payload.data,
      });
    });
  }

  private async showNotification(notification: Omit<NotificationQueueItem, 'id' | 'created_at' | 'retry_count'>) {
    try {
      if (!navigator.onLine) {
        // Adicionar à fila se offline
        this.queueNotification(notification);
        return;
      }

      const notif = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon.png',
        badge: '/badge.png',
        data: notification.data,
      });

      notif.onclick = (event) => {
        event.preventDefault();
        if (notification.data?.conversation_id) {
          window.location.href = `/conversations/${notification.data.conversation_id}`;
        }
      };
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      this.queueNotification(notification);
    }
  }

  private queueNotification(notification: Omit<NotificationQueueItem, 'id' | 'created_at' | 'retry_count'>) {
    const queueItem: NotificationQueueItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
      retry_count: 0,
    };

    this.notificationQueue.push(queueItem);
    this.startRetryInterval();
  }

  private startRetryInterval() {
    if (this.retryInterval) return;

    this.retryInterval = setInterval(async () => {
      if (!navigator.onLine) return;
      await this.processNotificationQueue();
    }, this.RETRY_INTERVAL);
  }

  private async processNotificationQueue() {
    if (!navigator.onLine) return;

    const pendingNotifications = this.notificationQueue.filter(
      item => item.retry_count < this.MAX_RETRY_COUNT
    );

    for (const item of pendingNotifications) {
      try {
        await this.showNotification({
          title: item.title,
          body: item.body,
          data: item.data,
        });

        // Remover da fila se bem sucedido
        this.notificationQueue = this.notificationQueue.filter(n => n.id !== item.id);
      } catch (error) {
        item.retry_count++;
        console.error(`Erro ao processar notificação ${item.id}:`, error);
      }
    }

    // Limpar intervalo se não houver mais notificações pendentes
    if (this.notificationQueue.length === 0 && this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  // Métodos públicos
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async clearToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_push_tokens')
          .delete()
          .eq('user_id', user.id);
      }
      this.token = null;
    } catch (error) {
      console.error('Erro ao limpar token:', error);
    }
  }

  // Destrutor
  destroy() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }
}

export const notificationService = NotificationService.getInstance(); 