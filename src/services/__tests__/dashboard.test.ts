import { dashboardService } from '../dashboard';
import { supabase } from '../../config/supabase';
import { monitoringService } from '../monitoring';

// Mock das dependências
jest.mock('../../config/supabase');
jest.mock('../monitoring');

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('deve retornar métricas do dashboard', async () => {
      const mockUser = { id: '123' };
      const mockMetrics = {
        total_conversations: 100,
        active_conversations: 20,
        resolved_conversations: 80,
        average_response_time: 5,
        customer_satisfaction: 4.5,
        total_messages: 500,
        total_agents: 10,
        total_customers: 50
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getMetrics();

      expect(result).toBeTruthy();
      expect(result?.total_conversations).toBe(100);
      expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_metrics', { user_id: mockUser.id });
    });

    it('deve retornar null quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getMetrics();

      expect(result).toBeNull();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getConversationMetrics', () => {
    it('deve retornar métricas de conversas por período', async () => {
      const mockUser = { id: '123' };
      const mockMetrics = [
        { date: '2024-01-01', total: 10, active: 5, resolved: 5 },
        { date: '2024-01-02', total: 15, active: 8, resolved: 7 }
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getConversationMetrics('2024-01-01', '2024-01-02');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-01');
      expect(supabase.rpc).toHaveBeenCalledWith('get_conversation_metrics_by_date', {
        user_id: mockUser.id,
        start_date: '2024-01-01',
        end_date: '2024-01-02'
      });
    });

    it('deve retornar array vazio quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getConversationMetrics('2024-01-01', '2024-01-02');

      expect(result).toHaveLength(0);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getAgentMetrics', () => {
    it('deve retornar métricas dos agentes', async () => {
      const mockUser = { id: '123' };
      const mockMetrics = [
        {
          id: '456',
          name: 'Agent 1',
          conversations_handled: 50,
          average_response_time: 3,
          customer_satisfaction: 4.8,
          messages_sent: 200
        }
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getAgentMetrics();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Agent 1');
      expect(supabase.rpc).toHaveBeenCalledWith('get_agent_metrics', { user_id: mockUser.id });
    });

    it('deve retornar array vazio quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getAgentMetrics();

      expect(result).toHaveLength(0);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getCustomerMetrics', () => {
    it('deve retornar métricas dos clientes', async () => {
      const mockUser = { id: '123' };
      const mockMetrics = [
        {
          id: '789',
          name: 'Customer 1',
          conversations: 5,
          messages: 25,
          last_interaction: '2024-01-01T10:00:00Z'
        }
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getCustomerMetrics();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Customer 1');
      expect(supabase.rpc).toHaveBeenCalledWith('get_customer_metrics', { user_id: mockUser.id });
    });

    it('deve retornar array vazio quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getCustomerMetrics();

      expect(result).toHaveLength(0);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getAgentPerformance', () => {
    it('deve retornar performance de um agente específico', async () => {
      const mockUser = { id: '123' };
      const mockPerformance = {
        id: '456',
        name: 'Agent 1',
        conversations_handled: 50,
        average_response_time: 3,
        customer_satisfaction: 4.8,
        messages_sent: 200
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockPerformance });

      const result = await dashboardService.getAgentPerformance('456', '2024-01-01', '2024-01-31');

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Agent 1');
      expect(supabase.rpc).toHaveBeenCalledWith('get_agent_performance', {
        user_id: mockUser.id,
        agent_id: '456',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });
    });

    it('deve retornar null quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getAgentPerformance('456', '2024-01-01', '2024-01-31');

      expect(result).toBeNull();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getCustomerActivity', () => {
    it('deve retornar atividade de um cliente específico', async () => {
      const mockUser = { id: '123' };
      const mockActivity = {
        id: '789',
        name: 'Customer 1',
        conversations: 5,
        messages: 25,
        last_interaction: '2024-01-01T10:00:00Z'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockActivity });

      const result = await dashboardService.getCustomerActivity('789');

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Customer 1');
      expect(supabase.rpc).toHaveBeenCalledWith('get_customer_activity', {
        user_id: mockUser.id,
        customer_id: '789'
      });
    });

    it('deve retornar null quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result = await dashboardService.getCustomerActivity('789');

      expect(result).toBeNull();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });
}); 