import api from '../config/axios';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Conversation,
  Message,
  Contact,
  ApiResponse,
  API_ENDPOINTS
} from '../types/api';

// Serviço de autenticação
export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.auth.login, credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.auth.register, data);
    return response.data;
  }
};

// Serviço de conversas
export const conversationService = {
  list: async (): Promise<ApiResponse<Conversation[]>> => {
    const response = await api.get(API_ENDPOINTS.conversations.list);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.get(API_ENDPOINTS.conversations.detail(id));
    return response.data;
  },

  create: async (): Promise<ApiResponse<Conversation>> => {
    const response = await api.post(API_ENDPOINTS.conversations.list);
    return response.data;
  }
};

// Serviço de mensagens
export const messageService = {
  list: async (conversationId: string): Promise<ApiResponse<Message[]>> => {
    const response = await api.get(API_ENDPOINTS.messages.list(conversationId));
    return response.data;
  },

  create: async (data: { conversation_id: string; content: string }): Promise<ApiResponse<Message>> => {
    const response = await api.post(API_ENDPOINTS.messages.create, data);
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<ApiResponse<void>> => {
    const response = await api.put(API_ENDPOINTS.messages.markRead(conversationId));
    return response.data;
  }
};

// Serviço de contatos
export const contactService = {
  list: async (): Promise<ApiResponse<Contact[]>> => {
    const response = await api.get(API_ENDPOINTS.contacts.list);
    return response.data;
  },

  create: async (data: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Contact>> => {
    const response = await api.post(API_ENDPOINTS.contacts.create, data);
    return response.data;
  },

  update: async (id: string, data: Partial<Contact>): Promise<ApiResponse<Contact>> => {
    const response = await api.put(API_ENDPOINTS.contacts.update(id), data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.contacts.delete(id));
    return response.data;
  }
}; 