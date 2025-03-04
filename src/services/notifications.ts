import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../config/supabase';

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

class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;

  private constructor() {
    this.initialize();
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
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
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
      // Criar notificação
      const notification = new Notification(payload.notification?.title || 'Nova mensagem', {
        body: payload.notification?.body,
        icon: '/icon.png',
        badge: '/badge.png',
        data: payload.data,
      });

      // Adicionar click handler
      notification.onclick = (event) => {
        event.preventDefault();
        // Navegar para a conversa específica
        if (payload.data?.conversation_id) {
          window.location.href = `/conversations/${payload.data.conversation_id}`;
        }
      };
    });
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
}

export const notificationService = NotificationService.getInstance(); 