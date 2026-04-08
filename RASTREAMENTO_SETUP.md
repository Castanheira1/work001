# 🗺 Rastreamento em Tempo Real — Guia de Configuração

## Visão Geral

O sistema de rastreamento em tempo real permite ao **Fiscal** visualizar a localização de todas as equipes de campo em um mapa interativo, junto com o status das Ordens de Manutenção (OM) ativas.

### Como funciona

| Componente | Arquivo | Descrição |
|---|---|---|
| **Tela do Fiscal** | `fiscal_soberano.html` | Nova aba "🗺 Mapa ao Vivo" com Google Maps |
| **App de Campo** | `PCM_MCR_v5.html` | Envia localização GPS a cada 15 segundos |
| **Módulo GPS** | `assets/pcm_mcr/pcm_rastreamento.js` | Captura e envia posição ao Supabase |
| **Banco de Dados** | `patch_rastreamento_equipes_v1.sql` | Tabela `equipe_localizacao` no Supabase |

---

## Passo 1 — Executar o SQL no Supabase

Acesse o **Supabase Dashboard** → **SQL Editor** e execute o arquivo:

```
patch_rastreamento_equipes_v1.sql
```

Isso cria:
- Tabela `equipe_localizacao` (posição atual de cada dispositivo)
- Tabela `equipe_localizacao_historico` (trilha de posições)
- Políticas RLS de leitura/escrita
- Função `fn_upsert_localizacao` para upsert eficiente

### Habilitar Realtime

No Supabase Dashboard → **Database** → **Replication**, adicione a tabela:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipe_localizacao;
```

---

## Passo 2 — Obter a Chave da Google Maps API

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Ative as APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (opcional)
4. Crie uma **Chave de API** (API Key)
5. Restrinja a chave ao seu domínio (recomendado)

---

## Passo 3 — Configurar a Chave

### Ambiente Local

Edite o arquivo `config.js`:

```js
window.__PCM_BOOTSTRAP_ENV__ = {
  // ... outras variáveis ...
  "GOOGLE_MAPS_KEY": "SUA_CHAVE_AQUI"
};
```

### Render.com (Produção)

No painel do Render → **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `GOOGLE_MAPS_KEY` | `SUA_CHAVE_AQUI` |

> A variável já está configurada no `render.yaml` e no `build-render.sh`.

---

## Funcionalidades do Mapa ao Vivo

### Tela do Fiscal (`fiscal_soberano.html`)

- **Aba "🗺 Mapa ao Vivo"** na navegação principal
- **KPIs em tempo real**: equipes online, total e offline
- **Lista lateral** com cards de cada equipe:
  - Status online/offline com indicador colorido
  - Nome do operador
  - OM ativa com número, título e status
  - Coordenadas GPS
  - Nível de bateria e velocidade
- **Mapa Google Maps** com marcadores verdes (online) e cinzas (offline)
- **InfoWindow** ao clicar no marcador com detalhes completos
- **Atualização em tempo real** via Supabase Realtime (sem recarregar a página)
- **Refresh automático** a cada 30 segundos como fallback
- Botões **"Centralizar"** e **"Atualizar"** manuais

### App de Campo (`PCM_MCR_v5.html`)

- **Indicador GPS** na barra de controles (ponto verde = ativo)
- Envio automático de localização a cada **15 segundos**
- Inclui dados da OM ativa automaticamente
- Detecta nível de bateria do dispositivo
- Marca o dispositivo como **offline** ao fazer logout
- Reconexão automática em caso de falha

---

## Status das OMs no Mapa

| Status | Cor | Descrição |
|---|---|---|
| `executada` / `iniciada` | 🟢 Verde | OM em execução |
| `em_deslocamento` | 🔵 Azul | Equipe em deslocamento |
| `pausada` | 🟡 Amarelo | OM pausada |
| `pendente_fiscal` | 🟢 Verde claro | Aguardando assinatura fiscal |
| `cancelada` / `devolvida_admin` | 🔴 Vermelho | OM cancelada ou devolvida |
| `em_oficina` | 🟣 Roxo | Equipamento em oficina |
| `arquivada` | ⚫ Cinza | OM arquivada |

---

## Sem Chave do Google Maps?

O sistema funciona mesmo **sem a chave do Google Maps**:
- A lista lateral de equipes continua funcionando normalmente
- As posições são rastreadas e salvas no banco de dados
- Uma mensagem orienta como configurar a API
- Ao configurar a chave, o mapa aparece automaticamente

---

## Estrutura da Tabela `equipe_localizacao`

| Coluna | Tipo | Descrição |
|---|---|---|
| `device_id` | TEXT | ID único do dispositivo (chave) |
| `equipe` | TEXT | Nome da equipe |
| `operador` | TEXT | Nome do técnico |
| `latitude` | DOUBLE | Latitude GPS |
| `longitude` | DOUBLE | Longitude GPS |
| `precisao` | DOUBLE | Precisão em metros |
| `om_num` | TEXT | Número da OM ativa |
| `om_status` | TEXT | Estado do fluxo da OM |
| `om_titulo` | TEXT | Título da OM ativa |
| `bateria` | INTEGER | Nível de bateria (0-100%) |
| `velocidade` | DOUBLE | Velocidade em km/h |
| `online` | BOOLEAN | Se o dispositivo está ativo |
| `updated_at` | TIMESTAMPTZ | Última atualização |

---

## Segurança

- O `device_id` é gerado automaticamente no primeiro acesso e salvo no `localStorage`
- As políticas RLS permitem leitura pública e escrita por qualquer usuário autenticado
- A chave do Google Maps deve ser **restrita ao domínio** do seu site no console do Google
- O Supabase Anon Key é suficiente para as operações de localização
