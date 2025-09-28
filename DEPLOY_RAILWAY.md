# 🚀 Deploy no Railway - LigaFacil

Este guia mostra como fazer o deploy completo da aplicação LigaFacil no Railway.

## ✅ Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Projeto já configurado e commitado no GitHub
- Node.js e npm funcionando localmente

## 📋 Passo a Passo

### 1. **Preparar o Repositório GitHub**

```bash
# Fazer commit de todas as alterações
git add .
git commit -m "Configurar projeto para deploy no Railway"
git push origin main
```

### 2. **Criar Projeto no Railway**

1. Acesse [railway.app](https://railway.app/)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório **LigaFacil**
5. Railway detectará automaticamente os serviços

### 3. **Configurar o Backend**

#### 3.1 Adicionar Banco PostgreSQL
1. No dashboard do projeto, clique em **"+ New Service"**
2. Selecione **"Database" > "PostgreSQL"**
3. Aguarde a criação do banco

#### 3.2 Configurar Variáveis de Ambiente
No serviço **backend**, adicione as seguintes variáveis:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=sua_chave_jwt_super_segura_aqui_mude_agora
NODE_ENV=production
PORT=3001
```

**⚠️ IMPORTANTE:** Substitua o `JWT_SECRET` por uma chave forte e única!

#### 3.3 Configurar Build Command
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 4. **Configurar o Frontend**

#### 4.1 Configurar Variáveis de Ambiente
No serviço **frontend**, adicione:

```env
REACT_APP_API_URL=https://seu-backend-url.railway.app/api
REACT_APP_ENVIRONMENT=production
```

**⚠️ IMPORTANTE:** Substitua `seu-backend-url` pela URL real do seu backend!

#### 4.2 Build Settings
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s build -l 3000`

### 5. **Conectar os Serviços**

1. Copie a URL do backend (ex: `https://backend-production-abc123.railway.app`)
2. Cole no `REACT_APP_API_URL` do frontend
3. Copie a URL do frontend e adicione no backend como `FRONTEND_URL`

### 6. **Deploy Final**

1. Faça push das alterações finais:
```bash
git add .
git commit -m "Configurar URLs de produção"
git push origin main
```

2. Railway fará o redeploy automaticamente

## 🔧 Comandos Úteis

### Logs do Backend
```bash
railway logs --service backend
```

### Logs do Frontend
```bash
railway logs --service frontend
```

### Conectar ao Banco
```bash
railway connect postgres
```

## 🌐 URLs Finais

Após o deploy, você terá:

- **Frontend**: `https://frontend-production-abc123.railway.app`
- **Backend**: `https://backend-production-abc123.railway.app`
- **API Health**: `https://backend-production-abc123.railway.app/api/health`

## ✅ Verificações

1. **Frontend carrega** ✓
2. **API responde** em `/api/health` ✓
3. **Login funciona** ✓
4. **Banco conectado** ✓

## 🆘 Troubleshooting

### Backend não conecta ao banco
- Verifique se `DATABASE_URL` está configurada
- Confirme que o PostgreSQL está rodando

### Frontend não conecta à API
- Verifique `REACT_APP_API_URL`
- Confirme CORS configurado

### Build falha
- Verifique dependências no `package.json`
- Confirme Node.js version compatibility

## 💰 Custos

- **PostgreSQL**: Grátis até 1GB
- **2 Serviços**: $5/mês cada após trial
- **Domínio custom**: Grátis

---

🎉 **Pronto!** Sua aplicação LigaFacil está online no Railway!