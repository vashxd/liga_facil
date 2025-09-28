# 🚀 Deploy no Render - LigaFacil

Este guia mostra como fazer o deploy completo da aplicação LigaFacil no Render.

## ✅ Pré-requisitos

- Conta no [Render](https://render.com/)
- Projeto já configurado e commitado no GitHub
- Node.js e npm funcionando localmente

## 📋 Passo a Passo

### 1. **Preparar o Repositório GitHub**

```bash
# Fazer commit de todas as alterações
git add .
git commit -m "Configurar projeto para deploy no Render"
git push origin main
```

### 2. **Criar Banco PostgreSQL**

1. Acesse [render.com](https://render.com/)
2. Clique em **"New +"** > **"PostgreSQL"**
3. Configure:
   - **Name**: `ligafacil-db`
   - **Database**: `ligafacil`
   - **User**: `ligafacil_user`
   - **Region**: `Oregon (US West)`
   - **Plan**: **Free**
4. Clique **"Create Database"**
5. **⚠️ ANOTE a URL de conexão** que aparecerá!
5.1 password = Yo3WW2adNhB8r9o4op22DAM3PGFI8W2O
5.2 Internal Database URL = postgresql://ligafacil_user:Yo3WW2adNhB8r9o4op22DAM3PGFI8W2O@dpg-d3ckacili9vc73dl54j0-a/ligafacil
5.3 External Database URL =  postgresql://ligafacil_user:Yo3WW2adNhB8r9o4op22DAM3PGFI8W2O@dpg-d3ckacili9vc73dl54j0-a.oregon-postgres.render.com/ligafacil
5.4 PSQL Command = PGPASSWORD=Yo3WW2adNhB8r9o4op22DAM3PGFI8W2O psql -h dpg-d3ckacili9vc73dl54j0-a.oregon-postgres.render.com -U ligafacil_user ligafacil

### 3. **Deploy do Backend**

#### 3.1 Criar Web Service
1. Clique **"New +"** > **"Web Service"**
2. Conecte seu repositório GitHub **LigaFacil**
3. Configure:
   - **Name**: `ligafacil-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

#### 3.2 Configurar Variáveis de Ambiente
Adicione no **Environment**:

```env
DATABASE_URL=sua_url_do_postgresql_aqui
JWT_SECRET=025eb20cbb4bf91cf6671e5b4eed102f
NODE_ENV=production
PORT=10000
```

**⚠️ IMPORTANTE:**
- Use a URL do PostgreSQL criado no passo 2
- Gere um JWT_SECRET forte e único!

4. Clique **"Create Web Service"**

### 4. **Deploy do Frontend**

#### 4.1 Criar Static Site
1. Clique **"New +"** > **"Static Site"**
2. Conecte seu repositório GitHub **LigaFacil**
3. Configure:
   - **Name**: `ligafacil-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

#### 4.2 Configurar Variáveis de Ambiente
Adicione no **Environment**:

```env
REACT_APP_API_URL=https://ligafacil-backend.onrender.com/api
REACT_APP_ENVIRONMENT=production
```

**⚠️ IMPORTANTE:** Substitua pela URL real do seu backend!

4. Clique **"Create Static Site"**

### 5. **Conectar os Serviços**

#### 5.1 Atualizar Backend com URL do Frontend
1. Vá no service **ligafacil-backend**
2. Adicione variável:
```env
FRONTEND_URL=https://ligafacil-frontend.onrender.com
```
3. Salve e aguarde redeploy

#### 5.2 Verificar URLs
- Copie a URL do backend e cole no `REACT_APP_API_URL` do frontend
- Salve e aguarde redeploy do frontend

### 6. **Verificações Finais**

1. **Backend Health Check**:
   - Acesse: `https://seu-backend.onrender.com/api/health`
   - Deve retornar: `{"message": "LigaFacil API está funcionando!"}`

2. **Frontend Loading**:
   - Acesse: `https://seu-frontend.onrender.com`
   - Deve carregar a página de login

3. **Teste de Login/Registro**:
   - Tente criar uma conta
   - Tente fazer login

## 🔧 Configurações Importantes

### Build Command do Backend
```bash
npm run render-build
```

### Start Command do Backend
```bash
npm start
```

### Build Command do Frontend
```bash
npm run build
```

## 🌐 URLs Finais

Após o deploy, você terá:

- **Frontend**: `https://ligafacil-frontend.onrender.com`
- **Backend**: `https://ligafacil-backend.onrender.com`
- **API Health**: `https://ligafacil-backend.onrender.com/api/health`
- **Database**: PostgreSQL no Render

## ⚠️ Limitações do Plano Gratuito

- **Backend**: Hiberna após 15min inativo (demora ~30s para "acordar")
- **Database**: 1GB de storage
- **Builds**: 500 horas/mês

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Verifique logs no dashboard Render
# Problemas comuns:
- DATABASE_URL incorreta
- JWT_SECRET não configurado
- Porta errada (deve ser 10000)
```

### Frontend não conecta à API
```bash
# Verifique:
- REACT_APP_API_URL está correto
- Backend está rodando
- CORS configurado corretamente
```

### Erro de Prisma/Database
```bash
# No dashboard do backend, execute:
# Manual Deploy > Build Command:
npm run render-build
```

### Build falha
```bash
# Verifique:
- Root Directory está correto (backend/frontend)
- package.json tem todas as dependências
- Build commands estão corretos
```

## 🚀 Deploy Automático

Após configurar tudo, qualquer push para `main` fará deploy automático:

```bash
git add .
git commit -m "Nova feature"
git push origin main
# Render fará deploy automaticamente! 🎉
```

## 💰 Custos

- **PostgreSQL**: Grátis (1GB)
- **Backend Web Service**: Grátis (750h/mês)
- **Frontend Static Site**: Grátis (100GB bandwidth)
- **Domínio custom**: $5/mês (opcional)

---

🎉 **Pronto!** Sua aplicação LigaFacil está online no Render!

## 📱 Próximos Passos

1. **Teste todas as funcionalidades**
2. **Configure domínio custom** (opcional)
3. **Configure SSL** (automático no Render)
4. **Monitor performance** no dashboard