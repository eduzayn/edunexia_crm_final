import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Tipos de eventos
export type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
};

// Configuração do Realtime
export const realtime = {
  // Canal de conversas
  conversations: () => {
    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation change:', payload);
        }
      )
      .subscribe();
  },

  // Canal de mensagens
  messages: (conversationId: string) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message change:', payload);
        }
      )
      .subscribe();
  },

  // Canal de presença (online/offline)
  presence: (userId: string) => {
    return supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const newState = supabase.channel('presence').presenceState();
        console.log('Presence state:', newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await supabase.channel('presence').track({ user_id: userId });
        }
      });
  },

  // Desconectar de um canal
  unsubscribe: (channel: RealtimeChannel) => {
    return supabase.removeChannel(channel);
  },
}; 