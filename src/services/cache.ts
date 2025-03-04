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
    };
    indexes: { 'by-conversation': string; 'by-date': string };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: {
      theme: 'light' | 'dark';
      notifications: boolean;
      language: string;
    };
  };
}

class CacheService {
  private db: IDBPDatabase<ChatwootDB> | null = null;

  async init() {
    this.db = await openDB<ChatwootDB>('chatwoot-cache', 1, {
      upgrade(db) {
        // Store de mensagens
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-conversation', 'conversation_id');
        messageStore.createIndex('by-date', 'created_at');

        // Store de conversas
        const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
        conversationStore.createIndex('by-date', 'created_at');

        // Store de configurações
        db.createObjectStore('settings', { keyPath: 'id' });
      },
    });
  }

  // Mensagens
  async cacheMessages(messages: ChatwootDB['messages']['value'][]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('messages', 'readwrite');
    await Promise.all(messages.map(msg => tx.store.put(msg)));
    await tx.done;
  }

  async getMessages(conversationId: string) {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('messages', 'by-conversation', conversationId);
  }

  // Conversas
  async cacheConversations(conversations: ChatwootDB['conversations']['value'][]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('conversations', 'readwrite');
    await Promise.all(conversations.map(conv => tx.store.put(conv)));
    await tx.done;
  }

  async getConversations() {
    if (!this.db) await this.init();
    return this.db!.getAll('conversations');
  }

  // Configurações
  async saveSettings(settings: ChatwootDB['settings']['value']) {
    if (!this.db) await this.init();
    await this.db!.put('settings', settings, 'user-settings');
  }

  async getSettings() {
    if (!this.db) await this.init();
    return this.db!.get('settings', 'user-settings');
  }

  // Limpar cache
  async clearCache() {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['messages', 'conversations', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('messages').clear(),
      tx.objectStore('conversations').clear(),
      tx.objectStore('settings').clear(),
    ]);
    await tx.done;
  }
}

export const cacheService = new CacheService(); 