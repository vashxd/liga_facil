# ⚽ LigaFácil - Sistema de Gestão de Campeonatos

Sistema completo para organização e gestão de campeonatos de futebol amador, desenvolvido em português brasileiro.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com Express
- **TypeScript**
- **Prisma ORM** com SQLite
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **express-validator** para validação

### Frontend
- **React** com TypeScript
- **Material-UI** para interface
- **React Router** para navegação
- **Axios** para requisições HTTP

## 📁 Estrutura do Projeto

```
LigaFacil/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares (auth, etc)
│   │   ├── routes/          # Rotas da API
│   │   ├── utils/           # Utilitários (Prisma)
│   │   └── index.js         # Arquivo principal
│   ├── prisma/              # Schema e migrations
│   └── package.json
├── frontend/                # App React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Context API (Auth)
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # API services
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### 2. Backend

```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências
npm install

# Gerar o Prisma Client
npm run db:generate

# Executar migrations (criar banco de dados)
npm run db:migrate

# Iniciar o servidor
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 3. Frontend

```bash
# Em outro terminal, navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar a aplicação React
npm start
```

O frontend estará rodando em `http://localhost:3000`

## 📊 Funcionalidades Implementadas

### ✅ Autenticação
- Registro de usuários
- Login/Logout
- Proteção de rotas
- JWT tokens

### ✅ Gestão de Usuários
- Perfil do usuário
- Atualização de dados

### ✅ Gestão de Times
- Criar time
- Adicionar/remover jogadores
- Definir posições e números
- Visualizar times do usuário

### ✅ Gestão de Campeonatos
- Criar campeonatos (20 formatos disponíveis)
- Campeonatos públicos e privados
- Inscrição de times
- Visualizar campeonatos

### ✅ Gestão de Partidas
- Criar partidas
- Registrar resultados
- Acompanhar classificações

### ✅ Sistema de Notificações
- Notificações in-app
- Marcar como lida
- Tipos diversos de notificação

## 🎯 Formatos de Campeonato Suportados

1. Eliminação Simples
2. Eliminação Dupla
3. Grupos + Eliminação
4. Pontos Corridos
5. Sistema Suíço
6. Round Robin
7. Mata-mata com Grupos
8. Playoff
9. Liga com Ascenso
10. Torneio Duplo
11. Classificatório
12. Copa Liga
13. Champions
14. Mundial
15. Regional
16. Estadual
17. Municipal
18. Amistoso
19. Festival
20. Exhibition

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Usuários
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil

### Times
- `GET /api/teams` - Listar times do usuário
- `POST /api/teams` - Criar time
- `GET /api/teams/:id` - Obter time
- `PUT /api/teams/:id` - Atualizar time
- `POST /api/teams/:id/players` - Adicionar jogador
- `DELETE /api/teams/:id/players/:playerId` - Remover jogador

### Campeonatos
- `GET /api/championships/public` - Listar campeonatos públicos
- `GET /api/championships` - Listar campeonatos do usuário
- `POST /api/championships` - Criar campeonato
- `GET /api/championships/:id` - Obter campeonato
- `PUT /api/championships/:id` - Atualizar campeonato
- `POST /api/championships/:id/enroll` - Inscrever time

### Partidas
- `GET /api/matches/championship/:id` - Partidas do campeonato
- `POST /api/matches` - Criar partida
- `PUT /api/matches/:id/result` - Registrar resultado

### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida
- `PUT /api/notifications/read-all` - Marcar todas como lidas

## 🧪 Testando a API

### 1. Teste de Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Registro de Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "12345678"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "12345678"
  }'
```

## 🎨 Interface do Usuário

A aplicação possui uma interface moderna e responsiva com:

- **Dashboard**: Visão geral das atividades
- **Login/Registro**: Autenticação de usuários
- **Menu lateral**: Navegação intuitiva
- **Cards informativos**: Estatísticas e dados importantes
- **Tema personalizado**: Cores do futebol brasileiro

## 📱 Próximas Funcionalidades

- [ ] Páginas de gestão de times completas
- [ ] Sistema de sorteio automático
- [ ] Geração de calendário de partidas
- [ ] Classificações em tempo real
- [ ] Estatísticas avançadas
- [ ] Sistema de convites
- [ ] Notificações por email
- [ ] Upload de escudos dos times
- [ ] Relatórios em PDF
- [ ] Sistema de comentários

## 🤝 Contribuição

Este projeto foi desenvolvido baseado na documentação de requisitos fornecida, incluindo:

- Diagramas de caso de uso
- Diagramas de classe
- Diagramas ER
- Histórias de usuário
- Fluxogramas do sistema

## 📄 Licença

Este projeto é de uso educacional e demonstrativo.

---

**Desenvolvido com ⚽ para a comunidade brasileira de futebol amador**