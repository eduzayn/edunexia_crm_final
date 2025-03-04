import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 30, // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Chaves de cache para queries
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    byAccount: (accountId: string) => ['conversations', accountId] as const,
    byInbox: (inboxId: string) => ['conversations', 'inbox', inboxId] as const,
    byStatus: (status: string) => ['conversations', 'status', status] as const,
  },
  messages: {
    all: ['messages'] as const,
    byConversation: (conversationId: string) => ['messages', conversationId] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    byEmail: (email: string) => ['contacts', 'email', email] as const,
    byPhone: (phone: string) => ['contacts', 'phone', phone] as const,
  },
  settings: {
    all: ['settings'] as const,
    byAccount: (accountId: string) => ['settings', accountId] as const,
  },
};

// Configurações de invalidação de cache
export const invalidateQueries = {
  conversations: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
  messages: () => queryClient.invalidateQueries({ queryKey: queryKeys.messages.all }),
  contacts: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  settings: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
}; 