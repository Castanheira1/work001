# Domo de Ferro - Sistema MCR

Sistema PWA para gerenciamento de Ordens de Manutenção em Refrigeração e Climatização.

## 📋 Requisitos

- Navegador moderno (Chrome, Edge, Safari, Firefox)
- Conexão com Supabase
- Credenciais de acesso ao Supabase

## 🚀 Deployment no Render

### 1. Preparar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SENHA_FISCAL=sua-senha-fiscal-aqui
NODE_ENV=production
```

**Nunca commite o arquivo `.env` no git!**

### 2. Fazer Upload para Render

#### Opção A: Via Git (Recomendado)

```bash
# 1. Inicializar repositório git
git init
git add .
git commit -m "Initial commit - Domo de Ferro v5"

# 2. Fazer push para seu repositório (GitHub, GitLab, etc)
git remote add origin https://seu-repo.git
git push -u origin main

# 3. No Render Dashboard:
# - Conectar seu repositório
# - Selecionar "Static Site"
# - Apontar para a pasta raiz
# - Adicionar variáveis de ambiente
# - Deploy
```

#### Opção B: Upload Manual

```bash
# 1. Compactar arquivos
zip -r domo-ferro.zip . -x ".git/*" ".env" "node_modules/*"

# 2. No Render Dashboard:
# - Selecionar "Static Site"
# - Upload do arquivo ZIP
# - Configurar variáveis de ambiente
# - Deploy
```

### 3. Configurar Variáveis de Ambiente no Render

No painel do Render:

1. Ir para "Environment"
2. Adicionar as variáveis:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SENHA_FISCAL`
   - `NODE_ENV=production`

### 4. Verificar Deploy

Após o deploy:

1. Acessar a URL fornecida pelo Render
2. Verificar console do navegador (F12) para erros
3. Testar login com credenciais Supabase
4. Testar funcionalidades principais

## 📁 Estrutura de Arquivos

```
domo-ferro/
├── PCM_MCR_v5.html              # Página principal
├── admin_soberano.html          # Painel admin
├── fiscal_soberano.html         # Painel fiscal
├── manifest.webmanifest         # Configuração PWA
├── service-worker.js            # Service Worker para offline
├── render.yaml                  # Configuração Render
├── .env.example                 # Exemplo de variáveis
├── .gitignore                   # Arquivos ignorados
├── assets/
│   ├── pcm_mcr.js              # Lógica principal (4266 linhas)
│   ├── pcm_mcr_constants.js    # Constantes e config
│   ├── pcm_auth.js             # Autenticação
│   ├── pcm_storage.js          # Armazenamento
│   ├── sync_engine.js          # Sincronização
│   ├── app_bootstrap.js        # Bootstrap
│   ├── env-loader.js           # Carregador de env vars
│   ├── pcm_mcr.css             # Estilos
│   ├── toast.js                # Notificações
│   ├── vendor/                 # Bibliotecas externas
│   └── icons/                  # Ícones PWA
├── schema_supabase_v2.sql      # Schema do banco
├── patch_seguranca.sql         # Patch de segurança
└── patch_materiais_v2.sql      # Patch de materiais
```

## 🔧 Variáveis de Ambiente

### SUPABASE_URL
URL do seu projeto Supabase. Exemplo:
```
https://seu-projeto.supabase.co
```

### SUPABASE_ANON_KEY
Chave anônima do Supabase (encontrada em Project Settings > API Keys).

### SENHA_FISCAL
Senha para acesso ao painel fiscal. **Altere para uma senha forte!**

### NODE_ENV
Ambiente de execução. Use `production` em produção.

## 🔐 Segurança

1. **Nunca commite `.env`** - Use `.env.example` como template
2. **Altere a senha fiscal** - `1q2w` é apenas um padrão
3. **Use HTTPS** - Render fornece automaticamente
4. **Monitore acessos** - Verifique logs no Render Dashboard

## 📱 Funcionalidades

- ✅ PWA com suporte offline
- ✅ Gerenciamento de OMs (Ordens de Manutenção)
- ✅ Múltiplos painéis (Mecânico, Admin, Fiscal)
- ✅ Geração de PDFs e Excel
- ✅ Sincronização com Supabase
- ✅ Suporte a fotos e documentos

## 🐛 Troubleshooting

### "Erro ao conectar com Supabase"
- Verificar se `SUPABASE_URL` está correto
- Verificar se `SUPABASE_ANON_KEY` está válida
- Verificar conexão de internet

### "Service Worker não registrado"
- Verificar se está usando HTTPS (Render fornece)
- Limpar cache do navegador
- Verificar console do navegador (F12)

### "CORS/manifest/config.json no file://"
- Abra o app por servidor local (`http://localhost`) ou deploy HTTPS
- Não execute abrindo o arquivo HTML direto no Explorer (`file://`)
- Em `file://` o app entra em modo degradado sem manifest/SW por segurança do navegador

### "Dados não sincronizam"
- Verificar conexão com Supabase
- Verificar RLS policies no banco
- Verificar logs no Render Dashboard

## 📞 Suporte

Para problemas:
1. Verificar console do navegador (F12)
2. Verificar logs do Render Dashboard
3. Verificar status do Supabase
4. Contatar administrador do sistema

## 📝 Changelog

### v5.0 (2026-03-05)
- Preparação para Render
- Suporte a variáveis de ambiente
- Service Worker corrigido
- Segurança melhorada

## 📄 Licença

Propriedade de Soberano Mineração.
