import { supabase } from '../config/supabase';
import { monitoringService } from './monitoring';

interface DashboardMetrics {
  total_conversations: number;
  active_conversations: number;
  resolved_conversations: number;
  average_response_time: number;
  customer_satisfaction: number;
  total_messages: number;
  total_agents: number;
  total_customers: number;
}

interface ConversationMetrics {
  date: string;
  total: number;
  active: number;
  resolved: number;
}

interface AgentMetrics {
  id: string;
  name: string;
  conversations_handled: number;
  average_response_time: number;
  customer_satisfaction: number;
  messages_sent: number;
}

interface CustomerMetrics {
  id: string;
  name: string;
  conversations: number;
  messages: number;
  last_interaction: string;
}

class DashboardService {
  private static instance: DashboardService;
  private metrics: DashboardMetrics | null = null;
  private conversationMetrics: ConversationMetrics[] = [];
  private agentMetrics: AgentMetrics[] = [];
  private customerMetrics: CustomerMetrics[] = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  private async initialize() {
    try {
      await this.loadMetrics();
      this.setupRealtimeUpdates();
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'dashboard_init' });
    }
  }

  private async loadMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Carregar métricas gerais
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics', { user_id: user.id });

      if (metricsError) throw metricsError;
      this.metrics = metrics;

      // Carregar métricas de conversas por período
      const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_conversation_metrics', { user_id: user.id });

      if (conversationError) throw conversationError;
      this.conversationMetrics = conversationData;

      // Carregar métricas dos agentes
      const { data: agentData, error: agentError } = await supabase
        .rpc('get_agent_metrics', { user_id: user.id });

      if (agentError) throw agentError;
      this.agentMetrics = agentData;

      // Carregar métricas dos clientes
      const { data: customerData, error: customerError } = await supabase
        .rpc('get_customer_metrics', { user_id: user.id });

      if (customerError) throw customerError;
      this.customerMetrics = customerData;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'load_metrics' });
    }
  }

  private setupRealtimeUpdates() {
    try {
      // Atualizar métricas quando houver mudanças nas conversas
      const conversationsChannel = supabase
        .channel('dashboard_conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          () => {
            this.loadMetrics();
          }
        )
        .subscribe();

      // Atualizar métricas quando houver mudanças nas mensagens
      const messagesChannel = supabase
        .channel('dashboard_messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            this.loadMetrics();
          }
        )
        .subscribe();
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'setup_realtime_updates' });
    }
  }

  // Métodos públicos
  async getMetrics(): Promise<DashboardMetrics | null> {
    try {
      if (!this.metrics) {
        await this.loadMetrics();
      }
      return this.metrics;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_metrics' });
      return null;
    }
  }

  async getConversationMetrics(startDate: string, endDate: string): Promise<ConversationMetrics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('get_conversation_metrics_by_date', {
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
        });

      if (error) throw error;
      this.conversationMetrics = data;
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_conversation_metrics' });
      return [];
    }
  }

  async getAgentMetrics(): Promise<AgentMetrics[]> {
    try {
      if (!this.agentMetrics.length) {
        await this.loadMetrics();
      }
      return this.agentMetrics;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_agent_metrics' });
      return [];
    }
  }

  async getCustomerMetrics(): Promise<CustomerMetrics[]> {
    try {
      if (!this.customerMetrics.length) {
        await this.loadMetrics();
      }
      return this.customerMetrics;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_customer_metrics' });
      return [];
    }
  }

  async getAgentPerformance(agentId: string, startDate: string, endDate: string): Promise<AgentMetrics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('get_agent_performance', {
          user_id: user.id,
          agent_id: agentId,
          start_date: startDate,
          end_date: endDate,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_agent_performance' });
      return null;
    }
  }

  async getCustomerActivity(customerId: string): Promise<CustomerMetrics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('get_customer_activity', {
          user_id: user.id,
          customer_id: customerId,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_customer_activity' });
      return null;
    }
  }

  async refreshMetrics(): Promise<void> {
    try {
      await this.loadMetrics();
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'refresh_metrics' });
    }
  }
}

export const dashboardService = DashboardService.getInstance(); 