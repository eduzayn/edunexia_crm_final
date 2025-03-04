import { supabase } from '../config/supabase';
import { monitoringService } from './monitoring';
import { realtimeService } from './realtime';
import { notificationService } from './notifications';

interface SLA {
  id: string;
  name: string;
  description: string;
  first_response_time: number; // em minutos
  resolution_time: number; // em minutos
  business_hours: {
    start: string; // formato HH:mm
    end: string; // formato HH:mm
    timezone: string;
    working_days: number[]; // 0-6 (Domingo-Sábado)
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SLAViolation {
  id: string;
  conversation_id: string;
  sla_id: string;
  violation_type: 'first_response' | 'resolution';
  expected_time: string;
  actual_time: string;
  created_at: string;
}

class SLAService {
  private static instance: SLAService;
  private cache: Map<string, SLA[]> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): SLAService {
    if (!SLAService.instance) {
      SLAService.instance = new SLAService();
    }
    return SLAService.instance;
  }

  private async initialize() {
    try {
      // Configurar canal de violações de SLA
      const violationsChannel = supabase
        .channel('sla_violations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sla_violations',
          },
          (payload) => {
            this.handleSLAViolation(payload.new as SLAViolation);
          }
        )
        .subscribe();

      realtimeService.subscribeToConversation('sla_violations');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'sla_init' });
    }
  }

  async getSLAs(): Promise<SLA[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (this.cache.has('all')) {
        return this.cache.get('all')!;
      }

      const { data, error } = await supabase
        .from('slas')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      this.cache.set('all', data);
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_slas' });
      return [];
    }
  }

  async createSLA(sla: Omit<SLA, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<SLA | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('slas')
        .insert({
          ...sla,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      this.cache.clear();
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'create_sla' });
      return null;
    }
  }

  async updateSLA(id: string, sla: Partial<SLA>): Promise<SLA | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('slas')
        .update({
          ...sla,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      this.cache.clear();
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'update_sla' });
      return null;
    }
  }

  async deleteSLA(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('slas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      this.cache.clear();
      return true;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'delete_sla' });
      return false;
    }
  }

  async checkSLA(conversationId: string): Promise<SLAViolation[]> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conversation) throw new Error('Conversa não encontrada');

      const sla = await this.getSLAForConversation(conversation);
      if (!sla) return [];

      const violations: SLAViolation[] = [];

      // Verificar tempo de primeira resposta
      const firstResponseTime = await this.calculateFirstResponseTime(conversationId);
      if (firstResponseTime > sla.first_response_time) {
        violations.push({
          id: `fr-${Date.now()}`,
          conversation_id: conversationId,
          sla_id: sla.id,
          violation_type: 'first_response',
          expected_time: new Date(Date.now() - sla.first_response_time * 60000).toISOString(),
          actual_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }

      // Verificar tempo de resolução
      const resolutionTime = await this.calculateResolutionTime(conversationId);
      if (resolutionTime > sla.resolution_time) {
        violations.push({
          id: `rt-${Date.now()}`,
          conversation_id: conversationId,
          sla_id: sla.id,
          violation_type: 'resolution',
          expected_time: new Date(Date.now() - sla.resolution_time * 60000).toISOString(),
          actual_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }

      // Registrar violações
      if (violations.length > 0) {
        await this.recordViolations(violations);
      }

      return violations;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'check_sla' });
      return [];
    }
  }

  private async getSLAForConversation(conversation: any): Promise<SLA | null> {
    try {
      const slas = await this.getSLAs();
      return slas.find(sla => sla.priority === conversation.priority) || null;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_sla_for_conversation' });
      return null;
    }
  }

  private async calculateFirstResponseTime(conversationId: string): Promise<number> {
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(2);

      if (!messages || messages.length < 2) return 0;

      const firstMessage = new Date(messages[0].created_at);
      const firstResponse = new Date(messages[1].created_at);

      return (firstResponse.getTime() - firstMessage.getTime()) / 60000; // converter para minutos
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'calculate_first_response_time' });
      return 0;
    }
  }

  private async calculateResolutionTime(conversationId: string): Promise<number> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('created_at, resolved_at')
        .eq('id', conversationId)
        .single();

      if (!conversation || !conversation.resolved_at) return 0;

      const start = new Date(conversation.created_at);
      const end = new Date(conversation.resolved_at);

      return (end.getTime() - start.getTime()) / 60000; // converter para minutos
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'calculate_resolution_time' });
      return 0;
    }
  }

  private async recordViolations(violations: SLAViolation[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('sla_violations')
        .insert(violations);

      if (error) throw error;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'record_violations' });
    }
  }

  private async handleSLAViolation(violation: SLAViolation): Promise<void> {
    try {
      // Notificar sobre a violação
      await notificationService.showNotification({
        title: 'Violação de SLA',
        body: `A conversa #${violation.conversation_id} violou o SLA de ${violation.violation_type}`,
        data: {
          conversation_id: violation.conversation_id,
          violation_id: violation.id,
        },
      });
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_sla_violation' });
    }
  }

  // Métodos auxiliares
  isWithinBusinessHours(sla: SLA): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    const [startHour, startMinute] = sla.business_hours.start.split(':').map(Number);
    const [endHour, endMinute] = sla.business_hours.end.split(':').map(Number);

    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return (
      sla.business_hours.working_days.includes(currentDay) &&
      currentTime >= startTime &&
      currentTime <= endTime
    );
  }
}

export const slaService = SLAService.getInstance(); 