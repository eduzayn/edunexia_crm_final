import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatwootDB extends DBSchema {
  conversations: {
    key: string;
    value: {
      id: string;
      account_id: string;
      inbox_id: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    indexes: {
      'by-account': string;
      'by-inbox': string;
      'by-status': string;
    };
  };
  messages: {
    key: string;
    value: {
      id: string;
      conversation_id: string;
      content: string;
      message_type: string;
      created_at: string;
      updated_at: string;
    };
    indexes: {
      'by-conversation': string;
      'by-created-at': string;
    };
  };
  contacts: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      phone_number: string;
      created_at: string;
      updated_at: string;
    };
    indexes: {
      'by-email': string;
      'by-phone': string;
    };
  };
}

const DB_NAME = 'chatwoot-webcontainer';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<ChatwootDB>> {
  return openDB<ChatwootDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<ChatwootDB>) {
      // Criar store de conversas
      const conversationsStore = db.createObjectStore('conversations', {
        keyPath: 'id',
      });
      conversationsStore.createIndex('by-account', 'account_id');
      conversationsStore.createIndex('by-inbox', 'inbox_id');
      conversationsStore.createIndex('by-status', 'status');

      // Criar store de mensagens
      const messagesStore = db.createObjectStore('messages', {
        keyPath: 'id',
      });
      messagesStore.createIndex('by-conversation', 'conversation_id');
      messagesStore.createIndex('by-created-at', 'created_at');

      // Criar store de contatos
      const contactsStore = db.createObjectStore('contacts', {
        keyPath: 'id',
      });
      contactsStore.createIndex('by-email', 'email');
      contactsStore.createIndex('by-phone', 'phone_number');
    },
  });
}

export async function getConversations(db: IDBPDatabase<ChatwootDB>, accountId: string) {
  return db.getAllFromIndex('conversations', 'by-account', accountId);
}

export async function getMessages(db: IDBPDatabase<ChatwootDB>, conversationId: string) {
  return db.getAllFromIndex('messages', 'by-conversation', conversationId);
}

export async function getContact(db: IDBPDatabase<ChatwootDB>, email: string) {
  return db.getFromIndex('contacts', 'by-email', email);
}

export async function saveConversation(
  db: IDBPDatabase<ChatwootDB>,
  conversation: ChatwootDB['conversations']['value']
) {
  return db.put('conversations', conversation);
}

export async function saveMessage(
  db: IDBPDatabase<ChatwootDB>,
  message: ChatwootDB['messages']['value']
) {
  return db.put('messages', message);
}

export async function saveContact(
  db: IDBPDatabase<ChatwootDB>,
  contact: ChatwootDB['contacts']['value']
) {
  return db.put('contacts', contact);
} 