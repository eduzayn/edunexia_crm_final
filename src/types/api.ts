// Tipos de usuário
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Tipos de autenticação
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

// Tipos de conversa
export interface Conversation {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

// Tipos de mensagem
export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  message_type: 'incoming' | 'outgoing';
  read: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de contato
export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Endpoints da API
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register'
  },
  conversations: {
    list: '/api/conversations',
    detail: (id: string) => `/api/conversations/${id}`
  },
  messages: {
    list: (conversationId: string) => `/api/messages/conversation/${conversationId}`,
    create: '/api/messages',
    markRead: (conversationId: string) => `/api/messages/read/${conversationId}`
  },
  contacts: {
    list: '/api/contacts',
    create: '/api/contacts',
    update: (id: string) => `/api/contacts/${id}`,
    delete: (id: string) => `/api/contacts/${id}`
  }
}; 