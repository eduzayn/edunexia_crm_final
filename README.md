# EduNexia CRM

Sistema de CRM baseado no Chatwoot, adaptado para as necessidades específicas da EduNexia.

## Tecnologias Utilizadas

- Ruby on Rails
- Vue.js
- PostgreSQL
- Redis
- Docker

## Requisitos

- Docker
- Docker Compose
- Git

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/edunexia_crm.git
cd edunexia_crm
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Acesse a aplicação em `http://localhost:3000`

## Desenvolvimento

Para desenvolvimento local:

```bash
docker-compose up -d
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 