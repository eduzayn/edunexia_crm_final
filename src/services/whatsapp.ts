import { supabase } from '../config/supabase';
import { monitoringService } from './monitoring';
import { realtimeService } from './realtime';
import { templateService } from './templates';

interface WhatsAppConfig {
  id: string;
  business_account_id: string;
  phone_number: string;
  access_token: string;
  webhook_secret: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  whatsapp_message_id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'document' | 'location';
  media_url?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private config: WhatsAppConfig | null = null;
  private readonly API_VERSION = 'v17.0';
  private readonly BASE_URL = 'https://graph.facebook.com';

  private constructor() {
    this.initialize();
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  private async initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: config, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      this.config = config;

      // Configurar webhook para atualizações de status
      this.setupWebhook();
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'whatsapp_init' });
    }
  }

  private async setupWebhook() {
    try {
      const channel = supabase
        .channel('whatsapp_status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'whatsapp_messages',
          },
          (payload) => {
            this.handleStatusUpdate(payload.new as WhatsAppMessage);
          }
        )
        .subscribe();

      realtimeService.subscribeToConversation('whatsapp_status');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'whatsapp_webhook' });
    }
  }

  async sendMessage(conversationId: string, content: string, templateId?: string): Promise<WhatsAppMessage | null> {
    try {
      if (!this.config) throw new Error('Configuração do WhatsApp não encontrada');

      let messageContent = content;
      if (templateId) {
        messageContent = await templateService.renderTemplate(templateId, {});
        if (!messageContent) throw new Error('Erro ao renderizar template');
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phone_number}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversationId,
            type: 'text',
            text: { body: messageContent },
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();
      
      // Salvar mensagem no banco
      const { data: message, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          whatsapp_message_id: data.messages[0].id,
          from: this.config.phone_number,
          to: conversationId,
          content: messageContent,
          type: 'text',
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'send_whatsapp_message' });
      return null;
    }
  }

  async sendMedia(
    conversationId: string,
    mediaUrl: string,
    type: 'image' | 'video' | 'document'
  ): Promise<WhatsAppMessage | null> {
    try {
      if (!this.config) throw new Error('Configuração do WhatsApp não encontrada');

      // Primeiro, fazer upload da mídia
      const mediaResponse = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phone_number}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            file: mediaUrl,
          }),
        }
      );

      if (!mediaResponse.ok) throw new Error('Erro ao fazer upload da mídia');

      const mediaData = await mediaResponse.json();

      // Enviar mensagem com mídia
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phone_number}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversationId,
            type,
            [type]: {
              id: mediaData.id,
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao enviar mídia');

      const data = await response.json();

      // Salvar mensagem no banco
      const { data: message, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          whatsapp_message_id: data.messages[0].id,
          from: this.config.phone_number,
          to: conversationId,
          content: '',
          type,
          media_url: mediaUrl,
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'send_whatsapp_media' });
      return null;
    }
  }

  async sendTemplate(
    conversationId: string,
    templateName: string,
    language: string,
    variables: Record<string, string>
  ): Promise<WhatsAppMessage | null> {
    try {
      if (!this.config) throw new Error('Configuração do WhatsApp não encontrada');

      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.config.phone_number}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversationId,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: language,
              },
              components: [
                {
                  type: 'body',
                  parameters: Object.entries(variables).map(([key, value]) => ({
                    type: 'text',
                    text: value,
                  })),
                },
              ],
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao enviar template');

      const data = await response.json();

      // Salvar mensagem no banco
      const { data: message, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          whatsapp_message_id: data.messages[0].id,
          from: this.config.phone_number,
          to: conversationId,
          content: templateName,
          type: 'template',
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'send_whatsapp_template' });
      return null;
    }
  }

  private async handleStatusUpdate(message: WhatsAppMessage): Promise<void> {
    try {
      // Atualizar status da conversa se necessário
      if (message.status === 'read') {
        await supabase
          .from('conversations')
          .update({ last_read_at: new Date().toISOString() })
          .eq('id', message.conversation_id);
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_whatsapp_status' });
    }
  }

  // Métodos auxiliares
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${phoneNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config?.access_token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'validate_phone_number' });
      return false;
    }
  }

  async getMessageStatus(messageId: string): Promise<string | null> {
    try {
      const { data: message, error } = await supabase
        .from('whatsapp_messages')
        .select('status')
        .eq('whatsapp_message_id', messageId)
        .single();

      if (error) throw error;
      return message.status;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_message_status' });
      return null;
    }
  }
}

export const whatsappService = WhatsAppService.getInstance(); 