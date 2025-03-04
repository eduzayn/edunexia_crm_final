# Estrutura do Projeto

Este diretório contém o código fonte do Chatwoot WebContainer.

## Estrutura de Diretórios

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes de UI básicos (botões, inputs, etc)
│   ├── layout/          # Componentes de layout (header, sidebar, etc)
│   ├── chat/            # Componentes específicos do chat
│   ├── forms/           # Componentes de formulário
│   └── common/          # Componentes comuns reutilizáveis
│
├── pages/               # Páginas da aplicação
│
├── hooks/               # Hooks React personalizados
│   ├── useQueries/      # Hooks para queries do React Query
│   ├── useMutations/    # Hooks para mutations do React Query
│   └── useWebContainer/ # Hooks para interação com WebContainer
│
├── services/            # Serviços e APIs
│   ├── api/            # Serviços de API REST
│   ├── supabase/       # Serviços do Supabase
│   └── webcontainer/   # Serviços do WebContainer
│
├── types/               # Definições de tipos TypeScript
│   ├── api/            # Tipos relacionados à API
│   ├── supabase/       # Tipos do Supabase
│   └── webcontainer/   # Tipos do WebContainer
│
└── utils/               # Utilitários e helpers
    ├── api/            # Utilitários para API
    ├── supabase/       # Utilitários para Supabase
    ├── webcontainer/   # Utilitários para WebContainer
    └── helpers/        # Funções auxiliares gerais
```

## Convenções de Nomenclatura

- Componentes: PascalCase (ex: `ChatWindow.tsx`)
- Hooks: camelCase com prefixo 'use' (ex: `useChat.ts`)
- Serviços: camelCase (ex: `apiService.ts`)
- Tipos: PascalCase (ex: `ChatMessage.ts`)
- Utilitários: camelCase (ex: `formatDate.ts`)

## Padrões de Código

- Use TypeScript para todos os arquivos
- Use componentes funcionais com hooks
- Implemente testes unitários para componentes e hooks
- Documente componentes e funções complexas
- Siga as convenções do ESLint e Prettier 