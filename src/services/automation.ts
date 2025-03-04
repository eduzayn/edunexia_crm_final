import { supabase } from '../config/supabase';
import { monitoringService } from './monitoring';
import { realtimeService } from './realtime';
import { whatsappService } from './whatsapp';
import { templateService } from './templates';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'message_received' | 'conversation_created' | 'conversation_resolved' | 'sla_violated';
    conditions: Record<string, any>;
  };
  actions: {
    type: 'send_message' | 'assign_agent' | 'add_tag' | 'update_status' | 'send_template';
    params: Record<string, any>;
  }[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

class AutomationService {
  private static instance: AutomationService;
  private rules: AutomationRule[] = [];
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private async initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      this.rules = rules;

      // Configurar listeners para eventos
      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'automation_init' });
    }
  }

  private setupEventListeners() {
    try {
      // Listener para novas mensagens
      const messagesChannel = supabase
        .channel('automation_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            this.handleNewMessage(payload.new);
          }
        )
        .subscribe();

      // Listener para novas conversas
      const conversationsChannel = supabase
        .channel('automation_conversations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
          },
          (payload) => {
            this.handleNewConversation(payload.new);
          }
        )
        .subscribe();

      // Listener para violações de SLA
      const slaChannel = supabase
        .channel('automation_sla')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sla_violations',
          },
          (payload) => {
            this.handleSLAViolation(payload.new);
          }
        )
        .subscribe();

      realtimeService.subscribeToConversation('automation');
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'automation_listeners' });
    }
  }

  private async handleNewMessage(message: any) {
    try {
      const rules = this.rules.filter(rule => 
        rule.trigger.type === 'message_received' &&
        this.evaluateConditions(rule.trigger.conditions, message)
      );

      for (const rule of rules) {
        await this.executeActions(rule.actions, message.conversation_id);
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_new_message' });
    }
  }

  private async handleNewConversation(conversation: any) {
    try {
      const rules = this.rules.filter(rule => 
        rule.trigger.type === 'conversation_created' &&
        this.evaluateConditions(rule.trigger.conditions, conversation)
      );

      for (const rule of rules) {
        await this.executeActions(rule.actions, conversation.id);
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_new_conversation' });
    }
  }

  private async handleSLAViolation(violation: any) {
    try {
      const rules = this.rules.filter(rule => 
        rule.trigger.type === 'sla_violated' &&
        this.evaluateConditions(rule.trigger.conditions, violation)
      );

      for (const rule of rules) {
        await this.executeActions(rule.actions, violation.conversation_id);
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'handle_sla_violation' });
    }
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    try {
      return Object.entries(conditions).every(([key, value]) => {
        const dataValue = data[key];
        if (typeof value === 'object' && value !== null) {
          switch (value.operator) {
            case 'equals':
              return dataValue === value.value;
            case 'contains':
              return dataValue?.includes(value.value);
            case 'greater_than':
              return dataValue > value.value;
            case 'less_than':
              return dataValue < value.value;
            case 'in':
              return value.value.includes(dataValue);
            default:
              return false;
          }
        }
        return dataValue === value;
      });
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'evaluate_conditions' });
      return false;
    }
  }

  private async executeActions(actions: AutomationRule['actions'], conversationId: string) {
    try {
      for (const action of actions) {
        switch (action.type) {
          case 'send_message':
            await this.executeSendMessage(action.params, conversationId);
            break;
          case 'assign_agent':
            await this.executeAssignAgent(action.params, conversationId);
            break;
          case 'add_tag':
            await this.executeAddTag(action.params, conversationId);
            break;
          case 'update_status':
            await this.executeUpdateStatus(action.params, conversationId);
            break;
          case 'send_template':
            await this.executeSendTemplate(action.params, conversationId);
            break;
        }
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_actions' });
    }
  }

  private async executeSendMessage(params: any, conversationId: string) {
    try {
      const { content, templateId } = params;
      await whatsappService.sendMessage(conversationId, content, templateId);
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_send_message' });
    }
  }

  private async executeAssignAgent(params: any, conversationId: string) {
    try {
      const { agent_id } = params;
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: agent_id,
          role: 'agent',
        });
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_assign_agent' });
    }
  }

  private async executeAddTag(params: any, conversationId: string) {
    try {
      const { tag_id } = params;
      await supabase
        .from('conversation_tags')
        .insert({
          conversation_id: conversationId,
          tag_id,
        });
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_add_tag' });
    }
  }

  private async executeUpdateStatus(params: any, conversationId: string) {
    try {
      const { status } = params;
      await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_update_status' });
    }
  }

  private async executeSendTemplate(params: any, conversationId: string) {
    try {
      const { template_name, language, variables } = params;
      await whatsappService.sendTemplate(conversationId, template_name, language, variables);
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'execute_send_template' });
    }
  }

  // Métodos públicos
  async createRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<AutomationRule | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          ...rule,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (rule.is_active) {
        this.rules.push(data);
      }

      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'create_rule' });
      return null;
    }
  }

  async updateRule(id: string, rule: Partial<AutomationRule>): Promise<AutomationRule | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('automation_rules')
        .update({
          ...rule,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const index = this.rules.findIndex(r => r.id === id);
      if (index !== -1) {
        this.rules[index] = data;
      }

      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'update_rule' });
      return null;
    }
  }

  async deleteRule(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      this.rules = this.rules.filter(rule => rule.id !== id);
      return true;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'delete_rule' });
      return false;
    }
  }

  async getRules(): Promise<AutomationRule[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      this.rules = data.filter(rule => rule.is_active);
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_rules' });
      return [];
    }
  }

  async toggleRule(id: string): Promise<boolean> {
    try {
      const rule = this.rules.find(r => r.id === id);
      if (!rule) throw new Error('Regra não encontrada');

      const { data, error } = await supabase
        .from('automation_rules')
        .update({
          is_active: !rule.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const index = this.rules.findIndex(r => r.id === id);
      if (index !== -1) {
        this.rules[index] = data;
      }

      return true;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'toggle_rule' });
      return false;
    }
  }
}

export const automationService = AutomationService.getInstance(); 