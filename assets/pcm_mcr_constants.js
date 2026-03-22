(function (w) {
  if (!w) return;

  // Chaves de armazenamento local (Storage keys)
  w.STORAGE_KEY_OMS = 'pcm_oms_mcr_v4';
  w.STORAGE_KEY_CURRENT = 'pcm_current_om_mcr_v4';
  w.STORAGE_KEY_MATERIAIS = 'pcm_materiais_mcr_v4';
  w.STORAGE_KEY_DEVICE = 'pcm_device_id_v4';
  w.STORAGE_KEY_HISTORICO = 'pcm_historico_v4';
  w.STORAGE_KEY_DESVIOS = 'pcm_desvios_v1';
  w.STORAGE_KEY_DESVIOS_ACUM = 'pcm_desvios_acumulados';
  w.STORAGE_KEY_DASHBOARD = 'pcm_dashboard_log';
  w.STORAGE_KEY_CONFIG = 'pcm_config_v1';

  // Tabelas Supabase
  w.SUPABASE_TABLE_OMS = 'oms';
  w.SUPABASE_TABLE_MATERIAIS = 'pricelist2026';

  // Nota: SUPABASE_URL, SUPABASE_ANON_KEY e SENHA_FISCAL são definidos
  // pelo env-loader.js a partir de config.json — não duplicar aqui.
})(window);
