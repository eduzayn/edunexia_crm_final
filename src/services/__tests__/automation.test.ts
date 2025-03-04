import { automationService } from '../automation';
import { supabase } from '../../config/supabase';
import { monitoringService } from '../monitoring';
import { whatsappService } from '../whatsapp';

// Mock das dependências
jest.mock('../../config/supabase');
jest.mock('../monitoring');
jest.mock('../whatsapp');

describe('AutomationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    it('deve criar uma regra de automação com sucesso', async () => {
      const mockUser = { id: '123' };
      const mockRule = {
        name: 'Test Rule',
        description: 'Test Description',
        trigger: {
          type: 'message_received',
          conditions: { content: { contains: 'test' } }
        },
        actions: [
          {
            type: 'send_message',
            params: { content: 'Hello' }
          }
        ],
        is_active: true
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { ...mockRule, id: '456' } })
          })
        })
      });

      const result = await automationService.createRule(mockRule);

      expect(result).toBeTruthy();
      expect(result?.id).toBe('456');
      expect(supabase.from).toHaveBeenCalledWith('automation_rules');
    });

    it('deve retornar null quando houver erro', async () => {
      const mockUser = { id: '123' };
      const mockRule = {
        name: 'Test Rule',
        trigger: { type: 'message_received' },
        actions: []
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Test error'))
          })
        })
      });

      const result = await automationService.createRule(mockRule);

      expect(result).toBeNull();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('updateRule', () => {
    it('deve atualizar uma regra com sucesso', async () => {
      const mockUser = { id: '123' };
      const mockRule = {
        id: '456',
        name: 'Updated Rule'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRule })
            })
          })
        })
      });

      const result = await automationService.updateRule('456', { name: 'Updated Rule' });

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Updated Rule');
    });

    it('deve retornar null quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Test error'))
            })
          })
        })
      });

      const result = await automationService.updateRule('456', { name: 'Updated Rule' });

      expect(result).toBeNull();
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    it('deve deletar uma regra com sucesso', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await automationService.deleteRule('456');

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('automation_rules');
    });

    it('deve retornar false quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Test error'))
          })
        })
      });

      const result = await automationService.deleteRule('456');

      expect(result).toBe(false);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('getRules', () => {
    it('deve retornar lista de regras', async () => {
      const mockUser = { id: '123' };
      const mockRules = [
        { id: '456', name: 'Rule 1' },
        { id: '789', name: 'Rule 2' }
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockRules })
        })
      });

      const result = await automationService.getRules();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Rule 1');
    });

    it('deve retornar array vazio quando houver erro', async () => {
      const mockUser = { id: '123' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Test error'))
        })
      });

      const result = await automationService.getRules();

      expect(result).toHaveLength(0);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });

  describe('toggleRule', () => {
    it('deve alternar status da regra com sucesso', async () => {
      const mockRule = {
        id: '456',
        is_active: true
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { ...mockRule, is_active: false } })
            })
          })
        })
      });

      const result = await automationService.toggleRule('456');

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('automation_rules');
    });

    it('deve retornar false quando houver erro', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Test error'))
            })
          })
        })
      });

      const result = await automationService.toggleRule('456');

      expect(result).toBe(false);
      expect(monitoringService.captureError).toHaveBeenCalled();
    });
  });
}); 