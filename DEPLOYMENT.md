# 🚀 Guia de Deployment - Domo de Ferro no Render

## Checklist Pré-Deployment

- [ ] Credenciais Supabase obtidas
- [ ] Senha fiscal definida (alterar de `1q2w`)
- [ ] Arquivo `.env` criado localmente (não commitar)
- [ ] Testes locais realizados
- [ ] Repositório Git preparado (opcional)

---

## Opção 1: Upload Manual (Mais Rápido)

### Passo 1: Preparar Arquivos

```bash
# Extrair o arquivo ZIP
unzip domo-ferro-producao.zip

# Entrar no diretório
cd domo-producao

# Criar arquivo .env (não será enviado)
cp .env.example .env
# Editar .env com suas credenciais reais
```

### Passo 2: Acessar Render Dashboard

1. Ir para [render.com](https://render.com)
2. Fazer login na sua conta
3. Clicar em "New +" → "Static Site"

### Passo 3: Configurar o Site

1. **Name:** `domo-ferro` (ou seu nome preferido)
2. **Build Command:** deixar vazio ou `echo "Static site"`
3. **Publish Directory:** `.` (raiz)

### Passo 4: Adicionar Variáveis de Ambiente

No painel "Environment":

```
SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_ANON_KEY = sua-chave-anonima-aqui
SENHA_FISCAL = sua-senha-forte-aqui
NODE_ENV = production
```

### Passo 5: Deploy

1. Clicar em "Create Static Site"
2. Fazer upload dos arquivos (ou conectar repositório)
3. Aguardar build (deve ser rápido, ~30 segundos)
4. Acessar URL fornecida

---

## Opção 2: Deploy via Git (Recomendado)

### Passo 1: Preparar Repositório

```bash
# Entrar no diretório
cd domo-producao

# Inicializar git
git init
git add .
git commit -m "Initial commit - Domo de Ferro v5"

# Adicionar remote (GitHub, GitLab, etc)
git remote add origin https://seu-repo-git.git
git branch -M main
git push -u origin main
```

### Passo 2: Conectar no Render

1. Ir para [render.com](https://render.com)
2. Clicar em "New +" → "Static Site"
3. Selecionar "Connect a repository"
4. Autorizar acesso ao GitHub/GitLab
5. Selecionar seu repositório `domo-ferro`

### Passo 3: Configurar Build

1. **Build Command:** deixar vazio
2. **Publish Directory:** `.` (raiz)
3. **Branch:** `main`

### Passo 4: Variáveis de Ambiente

Adicionar no painel "Environment":

```
SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_ANON_KEY = sua-chave-anonima-aqui
SENHA_FISCAL = sua-senha-forte-aqui
NODE_ENV = production
```

### Passo 5: Deploy

1. Clicar em "Create Static Site"
2. Render faz pull automático do repositório
3. Aguardar build
4. Acessar URL fornecida

---

## Após o Deploy

### 1. Verificar Status

```
✓ Build bem-sucedido
✓ Site online em https://seu-dominio.onrender.com
✓ Service Worker registrado
✓ Variáveis de ambiente carregadas
```

### 2. Testar Funcionalidades

1. Abrir a URL em navegador
2. Verificar console (F12) para erros
3. Testar login com credenciais Supabase
4. Testar carregamento de OMs
5. Testar geração de PDF

### 3. Verificar Logs

No Render Dashboard:
- Ir para "Logs"
- Procurar por erros ou warnings
- Verificar se Service Worker está ativo

---

## Troubleshooting

### "Erro ao conectar com Supabase"

**Causa:** Credenciais inválidas ou URL incorreta

**Solução:**
1. Verificar `SUPABASE_URL` no Render Dashboard
2. Verificar `SUPABASE_ANON_KEY` está completa
3. Testar credenciais localmente
4. Redeploy após correção

### "Service Worker não registrado"

**Causa:** HTTPS não está ativo ou arquivo não encontrado

**Solução:**
1. Render fornece HTTPS automaticamente
2. Verificar se `service-worker.js` está na raiz
3. Limpar cache do navegador (Ctrl+Shift+Del)
4. Recarregar página (Ctrl+F5)

### "Dados não sincronizam"

**Causa:** RLS policies ou conexão com Supabase

**Solução:**
1. Verificar RLS policies no Supabase
2. Verificar logs do Supabase
3. Testar conexão com Supabase API
4. Verificar Network tab (F12) para requisições

### "Página em branco"

**Causa:** Erro ao carregar bibliotecas

**Solução:**
1. Abrir console (F12)
2. Procurar por erros de carregamento
3. Verificar se assets estão sendo servidos
4. Verificar tamanho do bundle

---

## Atualizações Futuras

### Para fazer update do código:

**Via Git:**
```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
# Render faz redeploy automaticamente
```

**Via Upload Manual:**
1. Fazer upload dos novos arquivos
2. Render detecta mudanças
3. Redeploy automático

### Para atualizar variáveis de ambiente:

1. Ir para "Environment" no Render Dashboard
2. Editar variáveis
3. Clicar "Save"
4. Redeploy automático

---

## Segurança

### ✅ Fazer

- [ ] Alterar senha fiscal de `1q2w` para algo forte
- [ ] Usar HTTPS (Render fornece)
- [ ] Não commitar `.env` no git
- [ ] Revisar RLS policies no Supabase
- [ ] Monitorar logs regularmente

### ❌ Não Fazer

- [ ] Não expor credenciais no código
- [ ] Não usar senhas fracas
- [ ] Não commitar `.env`
- [ ] Não compartilhar SUPABASE_ANON_KEY
- [ ] Não desabilitar RLS

---

## Monitoramento

### Verificar Saúde da Aplicação

1. **Render Dashboard:**
   - Status do site
   - Últimas builds
   - Logs de erro

2. **Supabase Dashboard:**
   - Status do banco
   - Requisições da API
   - Erros de autenticação

3. **Navegador (F12):**
   - Console para erros
   - Network para requisições
   - Application para Service Worker

---

## Contato e Suporte

Para problemas:
1. Verificar logs (Render + Supabase)
2. Verificar console do navegador
3. Verificar status da API
4. Contatar administrador do sistema

---

## Versão

**Domo de Ferro v5.0** - Preparado para Render  
**Data:** 05/03/2026  
**Status:** Pronto para produção
