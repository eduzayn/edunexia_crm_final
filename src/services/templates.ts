import { supabase } from '../config/supabase';
import { monitoringService } from './monitoring';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

class TemplateService {
  private static instance: TemplateService;
  private cache: Map<string, MessageTemplate[]> = new Map();

  private constructor() {}

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  async getTemplates(category?: string): Promise<MessageTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const cacheKey = category || 'all';
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'get_templates' });
      return [];
    }
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<MessageTemplate | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          ...template,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Limpar cache
      this.cache.clear();
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'create_template' });
      return null;
    }
  }

  async updateTemplate(id: string, template: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('message_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Limpar cache
      this.cache.clear();
      return data;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'update_template' });
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Limpar cache
      this.cache.clear();
      return true;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'delete_template' });
      return false;
    }
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      let content = template.content;
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      return content;
    } catch (error) {
      monitoringService.captureError(error as Error, { context: 'render_template' });
      return null;
    }
  }

  // Métodos auxiliares
  extractVariables(content: string): string[] {
    const matches = content.match(/{{([^}]+)}}/g) || [];
    return matches.map(match => match.slice(2, -2));
  }

  validateVariables(content: string, variables: Record<string, string>): boolean {
    const required = this.extractVariables(content);
    return required.every(variable => variables[variable] !== undefined);
  }
}

export const templateService = TemplateService.getInstance(); 