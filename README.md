# EduNexia CRM

Sistema de CRM baseado no Chatwoot, adaptado para WebContainer.

## Funcionalidades

- Autenticação com Supabase
- Chat em tempo real
- Integração com WhatsApp
- Sistema de automação
- Dashboard com métricas
- Gerenciamento de templates
- Monitoramento de SLA
- Notificações push
- Cache local
- Testes automatizados

## Requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Firebase (para notificações)
- Conta no Sentry (para monitoramento)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/edunexia_crm.git
cd edunexia_crm
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha as variáveis no arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave_api_do_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_dominio_do_firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_id_do_projeto_firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket_do_firebase
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_id_do_sender_firebase
NEXT_PUBLIC_FIREBASE_APP_ID=seu_id_do_app_firebase
NEXT_PUBLIC_SENTRY_DSN=sua_dsn_do_sentry
```

## Desenvolvimento

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

2. Acesse http://localhost:3000

## Testes

1. Execute os testes:
```bash
npm test
# ou
yarn test
```

2. Execute os testes em modo watch:
```bash
npm run test:watch
# ou
yarn test:watch
```

3. Gere relatório de cobertura:
```bash
npm run test:coverage
# ou
yarn test:coverage
```

## Build

1. Gere o build de produção:
```bash
npm run build
# ou
yarn build
```

2. Inicie o servidor de produção:
```bash
npm start
# ou
yarn start
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes React
  ├── hooks/         # Custom hooks
  ├── services/      # Serviços e APIs
  ├── types/         # Definições de tipos
  ├── utils/         # Funções utilitárias
  ├── pages/         # Páginas da aplicação
  └── styles/        # Estilos globais
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, envie um email para suporte@edunexia.com.br ou abra uma issue no GitHub. 