import { supabase } from '../config/supabase';
import { notificationService } from './notifications';
import { monitoringService } from './monitoring';

interface RealtimeMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'file' | 'system';
}

class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  private async initialize() {
    try {
      // Configurar canal de mensagens
      const messagesChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            this.handleNewMessage(payload.new as RealtimeMessage);
          }
        )
        .subscribe();

      this.subscriptions.set('messages', () => messagesChannel.unsubscribe());

      // Configurar canal de status de conversas
      const conversationsChannel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
          },
          (payload) => {
            this.handleConversationUpdate(payload.new);
          }
        )
        .subscribe();

      this.subscriptions.set('conversations', () => conversationsChannel.unsubscribe());

      monitoringService.captureMessage('Realtime service initialized');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'realtime_init' });
    }
  }

  private async handleNewMessage(message: RealtimeMessage) {
    try {
      // Verificar se a mensagem é relevante para o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se o usuário é parte da conversa
      const { data: conversation } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', message.conversation_id)
        .eq('user_id', user.id)
        .single();

      if (!conversation) return;

      // Mostrar notificação
      await notificationService.showNotification({
        title: 'Nova mensagem',
        body: message.content,
        data: {
          conversation_id: message.conversation_id,
          message_id: message.id,
        },
      });

      monitoringService.captureMessage('New message notification sent', 'info');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_new_message' });
    }
  }

  private async handleConversationUpdate(conversation: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se o usuário é parte da conversa
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conversation.id)
        .eq('user_id', user.id)
        .single();

      if (!participant) return;

      // Notificar mudanças relevantes
      if (conversation.status === 'resolved') {
        await notificationService.showNotification({
          title: 'Conversa resolvida',
          body: `A conversa #${conversation.id} foi marcada como resolvida`,
          data: {
            conversation_id: conversation.id,
          },
        });
      }

      monitoringService.captureMessage('Conversation update handled', 'info');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_conversation_update' });
    }
  }

  // Métodos públicos
  async subscribeToConversation(conversationId: string) {
    try {
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            this.handleNewMessage(payload.new as RealtimeMessage);
          }
        )
        .subscribe();

      this.subscriptions.set(`conversation:${conversationId}`, () => channel.unsubscribe());
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'subscribe_to_conversation' });
    }
  }

  async unsubscribeFromConversation(conversationId: string) {
    const unsubscribe = this.subscriptions.get(`conversation:${conversationId}`);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(`conversation:${conversationId}`);
    }
  }

  // Destrutor
  destroy() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

export const realtimeService = RealtimeService.getInstance(); 