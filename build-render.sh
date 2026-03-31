#!/bin/bash
set -euo pipefail

echo "[BUILD] Iniciando build para Render..."

: "${NODE_ENV:=production}"

python3 - <<'PY'
import json, os
cfg = {
  "SUPABASE_URL": os.environ.get("SUPABASE_URL", ""),
  "SUPABASE_ANON_KEY": os.environ.get("SUPABASE_ANON_KEY", ""),
  "SENHA_FISCAL": os.environ.get("SENHA_FISCAL", ""),
  "NODE_ENV": os.environ.get("NODE_ENV", "production"),
  "APP_URL": os.environ.get("RENDER_EXTERNAL_URL", os.environ.get("APP_URL", "")),
  "SYNC_ENDPOINT": os.environ.get("SYNC_ENDPOINT", "/api/sync"),
  "SYNC_SHARED_SECRET": os.environ.get("SYNC_SHARED_SECRET", ""),
  "GOOGLE_MAPS_KEY": os.environ.get("GOOGLE_MAPS_KEY", "")
}
with open('config.json', 'w', encoding='utf-8') as fh:
    json.dump(cfg, fh, ensure_ascii=False, indent=2)
with open('config.js', 'w', encoding='utf-8') as fh:
    fh.write('window.__PCM_BOOTSTRAP_ENV__ = ')
    json.dump(cfg, fh, ensure_ascii=False, indent=2)
    fh.write(';\nwindow.ENV = Object.assign({}, window.__PCM_BOOTSTRAP_ENV__);\n')
    fh.write('window.SUPABASE_URL = window.ENV.SUPABASE_URL;\n')
    fh.write('window.SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY;\n')
    fh.write('window.GOOGLE_MAPS_KEY = window.ENV.GOOGLE_MAPS_KEY;\n')
PY

echo "[BUILD] config.json e config.js criados com variáveis de ambiente"

required=(SUPABASE_URL SUPABASE_ANON_KEY)
if [ "${NODE_ENV}" = "production" ]; then
  required+=(SYNC_ENDPOINT)
fi

missing=0
for key in "${required[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo "[BUILD] ERRO: variável obrigatória ausente -> ${key}"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

echo "[BUILD] Build concluído com sucesso"
