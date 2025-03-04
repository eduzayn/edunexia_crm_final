import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatwootDB extends DBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      conversation_id: string;
      content: string;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
    };
    indexes: { 'by-conversation': string; 'by-date': string; 'by-sync-status': string };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      status: string;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'error';
    };
    indexes: { 'by-date': string; 'by-sync-status': string };
  };
  settings: {
    key: string;
    value: {
      theme: 'light' | 'dark';
      notifications: boolean;
      language: string;
      last_sync: string;
      offline_mode: boolean;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      type: 'message' | 'conversation';
      action: 'create' | 'update' | 'delete';
      data: any;
      created_at: string;
      retry_count: number;
    };
    indexes: { 'by-type': string; 'by-date': string };
  };
}

class CacheService {
  private db: IDBPDatabase<ChatwootDB> | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

  async init() {
    this.db = await openDB<ChatwootDB>('chatwoot-cache', 2, {
      upgrade(db, oldVersion, newVersion) {
        // Versão 1
        if (oldVersion < 1) {
          // Store de mensagens
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-conversation', 'conversation_id');
          messageStore.createIndex('by-date', 'created_at');

          // Store de conversas
          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationStore.createIndex('by-date', 'created_at');

          // Store de configurações
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Versão 2
        if (oldVersion < 2) {
          // Adicionar sync_status e índices
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-sync-status', 'sync_status');

          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationStore.createIndex('by-sync-status', 'sync_status');

          // Store de fila de sincronização
          const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-type', 'type');
          syncQueueStore.createIndex('by-date', 'created_at');
        }
      },
    });

    // Iniciar sincronização automática
    this.startAutoSync();
  }

  // Mensagens
  async cacheMessages(messages: ChatwootDB['messages']['value'][]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('messages', 'readwrite');
    await Promise.all(messages.map(msg => tx.store.put({
      ...msg,
      sync_status: 'synced'
    })));
    await tx.done;
  }

  async getMessages(conversationId: string) {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('messages', 'by-conversation', conversationId);
  }

  async queueMessageSync(message: ChatwootDB['messages']['value']) {
    if (!this.db) await this.init();
    await this.db!.add('sync_queue', {
      id: `msg-${Date.now()}`,
      type: 'message',
      action: 'create',
      data: message,
      created_at: new Date().toISOString(),
      retry_count: 0
    });
  }

  // Conversas
  async cacheConversations(conversations: ChatwootDB['conversations']['value'][]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('conversations', 'readwrite');
    await Promise.all(conversations.map(conv => tx.store.put({
      ...conv,
      sync_status: 'synced'
    })));
    await tx.done;
  }

  async getConversations() {
    if (!this.db) await this.init();
    return this.db!.getAll('conversations');
  }

  async queueConversationSync(conversation: ChatwootDB['conversations']['value']) {
    if (!this.db) await this.init();
    await this.db!.add('sync_queue', {
      id: `conv-${Date.now()}`,
      type: 'conversation',
      action: 'create',
      data: conversation,
      created_at: new Date().toISOString(),
      retry_count: 0
    });
  }

  // Configurações
  async saveSettings(settings: ChatwootDB['settings']['value']) {
    if (!this.db) await this.init();
    await this.db!.put('settings', {
      ...settings,
      last_sync: new Date().toISOString(),
      offline_mode: navigator.onLine ? false : true
    }, 'user-settings');
  }

  async getSettings() {
    if (!this.db) await this.init();
    return this.db!.get('settings', 'user-settings');
  }

  // Sincronização
  private startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      if (!navigator.onLine) return;
      await this.syncPendingChanges();
    }, this.SYNC_INTERVAL);
  }

  private async syncPendingChanges() {
    if (!this.db) return;

    const tx = this.db.transaction('sync_queue', 'readwrite');
    const pendingItems = await tx.store.index('by-date').getAll();
    
    for (const item of pendingItems) {
      try {
        // Implementar lógica de sincronização com o servidor
        // await syncWithServer(item);
        
        // Marcar como sincronizado
        await tx.store.delete(item.id);
      } catch (error) {
        if (item.retry_count < this.MAX_RETRY_COUNT) {
          await tx.store.put({
            ...item,
            retry_count: item.retry_count + 1
          });
        }
      }
    }
    
    await tx.done;
  }

  // Limpeza automática
  private async cleanupOldData() {
    if (!this.db) return;

    const tx = this.db.transaction(['messages', 'conversations', 'sync_queue'], 'readwrite');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Limpar mensagens antigas
    const oldMessages = await tx.objectStore('messages')
      .index('by-date')
      .getAllKeys(IDBKeyRange.upperBound(thirtyDaysAgo.toISOString()));
    await Promise.all(oldMessages.map(key => tx.objectStore('messages').delete(key)));

    // Limpar conversas antigas
    const oldConversations = await tx.objectStore('conversations')
      .index('by-date')
      .getAllKeys(IDBKeyRange.upperBound(thirtyDaysAgo.toISOString()));
    await Promise.all(oldConversations.map(key => tx.objectStore('conversations').delete(key)));

    // Limpar itens da fila de sincronização antigos
    const oldQueueItems = await tx.objectStore('sync_queue')
      .index('by-date')
      .getAllKeys(IDBKeyRange.upperBound(thirtyDaysAgo.toISOString()));
    await Promise.all(oldQueueItems.map(key => tx.objectStore('sync_queue').delete(key)));

    await tx.done;
  }

  // Limpar cache
  async clearCache() {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['messages', 'conversations', 'settings', 'sync_queue'], 'readwrite');
    await Promise.all([
      tx.objectStore('messages').clear(),
      tx.objectStore('conversations').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('sync_queue').clear(),
    ]);
    await tx.done;
  }

  // Destrutor
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const cacheService = new CacheService(); 