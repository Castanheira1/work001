# Setup do Domo de Ferro no Render

## Pré-requisitos

1. Conta no [Render](https://render.com)
2. Projeto Supabase criado e configurado
3. Credenciais do Supabase (URL e chave anônima)
4. Senha fiscal definida

## Passo a Passo

### 1. Preparar Credenciais Supabase

No painel do Supabase:
1. Ir para **Project Settings** > **API**
2. Copiar:
   - **Project URL** (ex: `https://seu-projeto.supabase.co`)
   - **anon public** key (chave anônima)

### 2. Criar Static Site no Render

1. Acessar [render.com](https://render.com)
2. Clicar em **New +** > **Static Site**
3. Conectar repositório Git ou fazer upload manual

### 3. Configurar Variáveis de Ambiente

No painel do Render, ir para **Environment** e adicionar:

```
SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_ANON_KEY = sua-chave-anonima-aqui
SENHA_FISCAL = sua-senha-fiscal-aqui
NODE_ENV = production
```

**Importante:** Não use `1q2w` como senha fiscal em produção!

### 4. Configurar Build

1. **Build Command:** `bash build-render.sh`
2. **Publish Directory:** `.` (raiz)

### 5. Deploy

Clicar em **Create Static Site** e aguardar o build.

## Após o Deploy

### Verificar Status

1. Acessar a URL fornecida pelo Render
2. Abrir console (F12)
3. Procurar por mensagens `[ENV]`, `[AUTH]`, `[SYNC]`

### Mensagens de Sucesso

```
[ENV] Configuração carregada de /config.json
[AUTH] Autenticação pronta
[SYNC] Sincronização iniciada
```

### Mensagens de Erro

Se ver:
```
[ENV] Nenhuma configuração carregada
[AUTH] Erro: Variáveis de ambiente não carregadas
```

**Solução:** Verificar variáveis de ambiente no Render Dashboard

### Testar Login

1. Criar usuário no Supabase (Authentication > Users)
2. Email: `usuario@soberano.local`
3. Senha: qualquer senha
4. Tentar fazer login

## Troubleshooting

### "Erro ao conectar com Supabase"

**Causa:** Credenciais inválidas

**Solução:**
1. Verificar `SUPABASE_URL` no Render Dashboard
2. Verificar `SUPABASE_ANON_KEY` está completa
3. Testar credenciais localmente
4. Fazer redeploy

### "Service Worker não registrado"

**Causa:** HTTPS não está ativo

**Solução:**
1. Render fornece HTTPS automaticamente
2. Limpar cache do navegador (Ctrl+Shift+Del)
3. Recarregar página (Ctrl+F5)

### "Dados não sincronizam"

**Causa:** RLS policies ou conexão

**Solução:**
1. Verificar RLS policies no Supabase
2. Verificar Network tab (F12) para requisições
3. Verificar logs do Supabase

## Atualizações Futuras

### Via Git

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
# Render faz redeploy automaticamente
```

### Atualizar Variáveis de Ambiente

1. Ir para **Environment** no Render Dashboard
2. Editar variáveis
3. Clicar **Save**
4. Redeploy automático

## Segurança

### ✅ Fazer

- Alterar senha fiscal de `1q2w`
- Usar HTTPS (Render fornece)
- Não commitar `.env` no git
- Revisar RLS policies no Supabase
- Monitorar logs regularmente

### ❌ Não Fazer

- Não expor credenciais no código
- Não usar senhas fracas
- Não commitar `.env`
- Não compartilhar `SUPABASE_ANON_KEY`
- Não desabilitar RLS

## Monitoramento

### Render Dashboard

- Status do site
- Últimas builds
- Logs de erro

### Supabase Dashboard

- Status do banco
- Requisições da API
- Erros de autenticação

### Navegador (F12)

- Console para erros
- Network para requisições
- Application para Service Worker

## Contato e Suporte

Para problemas:
1. Verificar logs (Render + Supabase)
2. Verificar console do navegador (F12)
3. Verificar status da API
4. Contatar administrador do sistema
